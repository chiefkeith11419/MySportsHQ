import { SPORTS_CONFIG } from '../data/config.js';

export const sameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
};

export const isTeamMatch = (event, club) => {
  const names = [event?.home?.name, event?.away?.name].filter(Boolean);
  return club.aliases.some((alias) => names.some((name) => name.toLowerCase() === alias.toLowerCase()));
};

export const clubSide = (event, club) => {
  if (!event) return null;
  const home = club.aliases.some((alias) => event.home?.name?.toLowerCase() === alias.toLowerCase());
  const away = club.aliases.some((alias) => event.away?.name?.toLowerCase() === alias.toLowerCase());
  return home ? 'home' : away ? 'away' : null;
};

export function getClubEvent(events, club) {
  const clubEvents = events.filter((event) => isTeamMatch(event, club));
  const now = Date.now();
  const live = clubEvents.find((event) => event.status === 'in');
  if (live) return live;
  const next = clubEvents.find((event) => new Date(event.date).getTime() >= now - 3 * 60 * 60 * 1000);
  return next || clubEvents.at(-1) || null;
}

export function leagueMeta(id) {
  return SPORTS_CONFIG.soccerLeagues.find((league) => league.id === id) || { id, name: id, icon: '⚽' };
}

export function formatLocalDateTime(value, options = {}) {
  if (!value) return 'TBD';
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    weekday: options.weekday || 'short',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(date);
}
