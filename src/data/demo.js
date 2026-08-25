const isoAt = (offsetDays, hour = 15) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

export const DEMO_FOOTBALL = [
  {
    id: 'demo-barca',
    sport: 'football',
    leagueId: 'esp.1',
    leagueName: 'La Liga',
    date: isoAt(0, 15),
    status: 'scheduled',
    detail: '3:00 PM',
    home: { id: 'demo-home-1', name: 'Barcelona', short: 'BAR', score: null, logo: null },
    away: { id: 'demo-away-1', name: 'Real Betis', short: 'BET', score: null, logo: null },
  },
  {
    id: 'demo-nycfc',
    sport: 'football',
    leagueId: 'usa.1',
    leagueName: 'MLS',
    date: isoAt(0, 19),
    status: 'scheduled',
    detail: '7:30 PM',
    home: { id: 'demo-home-2', name: 'New York City FC', short: 'NYC', score: null, logo: null },
    away: { id: 'demo-away-2', name: 'Columbus Crew', short: 'CLB', score: null, logo: null },
  },
  {
    id: 'demo-epl',
    sport: 'football',
    leagueId: 'eng.1',
    leagueName: 'Premier League',
    date: isoAt(0, 12),
    status: 'scheduled',
    detail: '12:30 PM',
    home: { id: 'demo-home-3', name: 'Arsenal', short: 'ARS', score: null, logo: null },
    away: { id: 'demo-away-3', name: 'Chelsea', short: 'CHE', score: null, logo: null },
  },
  {
    id: 'demo-serie-a',
    sport: 'football',
    leagueId: 'ita.1',
    leagueName: 'Serie A',
    date: isoAt(1, 14),
    status: 'scheduled',
    detail: '2:45 PM',
    home: { id: 'demo-home-4', name: 'Milan', short: 'MIL', score: null, logo: null },
    away: { id: 'demo-away-4', name: 'Juventus', short: 'JUV', score: null, logo: null },
  },
];

export const DEMO_F1 = {
  sourceMode: 'demo',
  event: {
    id: 'demo-f1',
    name: 'Formula 1 Weekend',
    date: isoAt(2, 9),
    status: 'scheduled',
    detail: 'Upcoming race weekend',
    podium: [],
  },
};
