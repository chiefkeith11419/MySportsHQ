export const SPORTS_CONFIG = {
  personal: {
    clubs: [
      {
        key: 'barcelona',
        name: 'Barcelona',
        aliases: ['Barcelona', 'FC Barcelona'],
        league: 'esp.1',
        accent: '#a50044',
        secondary: '#004d98',
        mark: 'BAR',
      },
      {
        key: 'nycfc',
        name: 'New York City FC',
        aliases: ['New York City FC', 'New York City', 'NYCFC'],
        league: 'usa.1',
        accent: '#6cace4',
        secondary: '#041e42',
        mark: 'NYC',
      },
    ],
    fandoms: ['WWE'],
  },
  soccerLeagues: [
    { id: 'esp.1', name: 'La Liga', short: 'LALIGA', icon: '🇪🇸' },
    { id: 'eng.1', name: 'Premier League', short: 'EPL', icon: '🏴' },
    { id: 'usa.1', name: 'MLS', short: 'MLS', icon: '🇺🇸' },
    { id: 'ita.1', name: 'Serie A', short: 'SERIE A', icon: '🇮🇹' },
    { id: 'uefa.champions', name: 'Champions League', short: 'UCL', icon: '⭐' },
  ],
  drawer: [
    { route: 'home', label: 'Home', icon: '🏠' },
    { route: 'football', label: 'Football', icon: '⚽' },
    { route: 'f1', label: 'Formula 1', icon: '🏎️' },
    { route: 'wwe', label: 'WWE', icon: '🤼' },
    { route: 'fpl', label: 'Fantasy PL', icon: '🟣' },
  ],
};
