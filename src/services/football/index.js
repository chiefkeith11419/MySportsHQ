export {
  fetchFootballScoreboard,
  fetchFootballScoreboards,
  fetchFootballMatchSummary,
  fetchFootballStandings,
  fetchFootballTeams,
  footballDateRange,
} from './espn.js';


export {
  normalizeFootballEvent,
  normalizeFootballScoreboard,
  normalizeFootballLeagues,
} from './normalize.js';


export {
  getLiveFootballEvents,
  getUpcomingFootballEvents,
  getFootballEventsForDay,
  eventMatchesTeam,
  eventMatchesAnyTeam,
  getFollowedFootballEvents,
  getFootballPriority,
  sortFootballByPriority,
  groupFootballByCompetition,
  getFootballCompetitionGroups,
  groupFootballByDay,
  buildFootballDashboard,
} from './selectors.js';


export {
  toLegacyFootballEvent,
  toLegacyFootballEvents,
  fromLegacyFootballEvent,
  fromLegacyFootballEvents,
} from './legacy.js';