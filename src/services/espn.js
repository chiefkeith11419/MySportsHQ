const ESPN_SITE = 'https://site.api.espn.com/apis/site/v2/sports';

const ymd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

export function dateRange(startOffset = -1, endOffset = 7) {
  const start = new Date();
  start.setDate(start.getDate() + startOffset);
  const end = new Date();
  end.setDate(end.getDate() + endOffset);
  return `${ymd(start)}-${ymd(end)}`;
}

function normalizeSoccerEvent(event, fallbackLeague) {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
  const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];
  const statusType = event?.status?.type || competition?.status?.type || {};
  const state = statusType.state || 'scheduled';

  const team = (entry) => ({
    id: entry?.team?.id || entry?.id || '',
    name: entry?.team?.displayName || entry?.team?.shortDisplayName || 'TBD',
    short: entry?.team?.abbreviation || entry?.team?.shortDisplayName || 'TBD',
    score: entry?.score ?? null,
    logo: entry?.team?.logo || null,
  });

  return {
    id: event?.id || crypto.randomUUID(),
    sport: 'football',
    leagueId: fallbackLeague.id,
    leagueName: event?.league?.name || fallbackLeague.name,
    date: event?.date || competition?.date || new Date().toISOString(),
    status: state,
    detail: statusType.shortDetail || statusType.detail || event?.status?.type?.description || '',
    home: team(home),
    away: team(away),
    raw: event,
  };
}

export async function fetchSoccerScoreboards(leagues, range = dateRange()) {
  const requests = leagues.map(async (league) => {
    const url = `${ESPN_SITE}/soccer/${league.id}/scoreboard?dates=${range}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${league.name}: ${response.status}`);
    const data = await response.json();
    return (data.events || []).map((event) => normalizeSoccerEvent(event, league));
  });

  const results = await Promise.allSettled(requests);
  const events = [];
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') events.push(...result.value);
    else errors.push(`${leagues[index].name}: ${result.reason?.message || 'unavailable'}`);
  });

  if (!events.length && errors.length === leagues.length) {
    throw new Error('Football data is unavailable from the browser right now.');
  }

  return {
    events: events.sort((a, b) => new Date(a.date) - new Date(b.date)),
    partialErrors: errors,
  };
}

export async function fetchF1Scoreboard() {
  const url = `${ESPN_SITE}/racing/f1/scoreboard`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`F1: ${response.status}`);
  const data = await response.json();
  const events = data.events || [];
  if (!events.length) return { event: null, raw: data };

  const now = Date.now();
  const ordered = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const event = ordered.find((item) => new Date(item.date).getTime() >= now - 12 * 60 * 60 * 1000) || ordered.at(-1);
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const podium = competitors
    .map((c) => ({
      place: Number(c.order || c.place || c.rank || c.score || 999),
      name: c?.athlete?.displayName || c?.team?.displayName || c?.displayName || 'Driver',
      short: c?.athlete?.shortName || c?.team?.abbreviation || '',
    }))
    .sort((a, b) => a.place - b.place)
    .slice(0, 3);

  return {
    event: {
      id: event?.id,
      name: event?.name || event?.shortName || 'Formula 1',
      date: event?.date || competition?.date,
      status: event?.status?.type?.state || 'scheduled',
      detail: event?.status?.type?.shortDetail || event?.status?.type?.detail || '',
      podium,
    },
    raw: data,
  };
}
