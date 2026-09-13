import {
  createSportsEvent,
  EVENT_KINDS,
  EVENT_STATES,
  SPORTS,
} from '../core/eventModel.js';


/* -------------------------------------------------------
   STATUS
------------------------------------------------------- */

function normalizeState(
  state
) {
  switch (
    String(
      state || ''
    ).toLowerCase()
  ) {
    case 'pre':
    case 'scheduled':
      return EVENT_STATES.PRE;

    case 'in':
    case 'live':
      return EVENT_STATES.LIVE;

    case 'post':
    case 'final':
      return EVENT_STATES.POST;

    case 'postponed':
      return EVENT_STATES.POSTPONED;

    case 'cancelled':
    case 'canceled':
      return EVENT_STATES.CANCELLED;

    case 'delayed':
      return EVENT_STATES.DELAYED;

    default:
      return EVENT_STATES.UNKNOWN;
  }
}


/* -------------------------------------------------------
   TEAM
------------------------------------------------------- */

function normalizeTeam(
  competitor,
  role
) {
  const team =
    competitor?.team ||
    {};

  return {
    id:
      team.id ||
      competitor?.id ||
      null,

    name:
      team.displayName ||
      team.name ||
      team.shortDisplayName ||
      'TBD',

    shortName:
      team.shortDisplayName ||
      team.name ||
      null,

    abbreviation:
      team.abbreviation ||
      null,

    role,

    logo:
      team.logo ||
      team.logos?.[0]?.href ||
      null,

    score:
      competitor?.score ??
      null,

    winner:
      competitor?.winner ??
      null,

    metadata: {
      color:
        team.color ||
        null,

      alternateColor:
        team.alternateColor ||
        null,

      record:
        competitor?.records ||
        null,
    },
  };
}


/* -------------------------------------------------------
   VENUE
------------------------------------------------------- */

function normalizeVenue(
  competition
) {
  const venue =
    competition?.venue;

  if (!venue) {
    return null;
  }


  return {
    id:
      venue.id ||
      null,

    name:
      venue.fullName ||
      venue.name ||
      null,

    city:
      venue.address?.city ||
      null,

    country:
      venue.address?.country ||
      null,

    latitude:
      venue.latitude ??
      null,

    longitude:
      venue.longitude ??
      null,
  };
}


/* -------------------------------------------------------
   SCOREBOARD EVENT
------------------------------------------------------- */

export function normalizeFootballEvent(
  event,
  league
) {
  const competition =
    event?.competitions?.[0] ||
    {};

  const competitors =
    competition.competitors ||
    [];


  const home =
    competitors.find(
      (item) =>
        item.homeAway ===
        'home'
    ) ||
    competitors[0];


  const away =
    competitors.find(
      (item) =>
        item.homeAway ===
        'away'
    ) ||
    competitors[1];


  const statusType =
    event?.status?.type ||
    competition?.status?.type ||
    {};


  const homeTeam =
    normalizeTeam(
      home,
      'home'
    );

  const awayTeam =
    normalizeTeam(
      away,
      'away'
    );


  const title =
    event?.name ||
    `${homeTeam.name} vs ${awayTeam.name}`;


  return createSportsEvent({
    id:
      `espn-football-${event.id}`,

    sport:
      SPORTS.FOOTBALL,

    eventKind:
      EVENT_KINDS.MATCH,

    title,

    shortTitle:
      event?.shortName ||
      null,

    startTime:
      event?.date ||
      competition?.date,

    status: {
      state:
        normalizeState(
          statusType.state
        ),

      detail:
        statusType.shortDetail ||
        statusType.detail ||
        statusType.description ||
        null,

      clock:
        competition?.status
          ?.displayClock ||
        event?.status
          ?.displayClock ||
        null,

      period:
        competition?.status
          ?.period ??
        event?.status
          ?.period ??
        null,

      completed:
        Boolean(
          statusType.completed
        ),
    },

    competition: {
      id:
        league?.id ||
        event?.league?.id ||
        null,

      name:
        event?.league?.name ||
        league?.name ||
        null,

      shortName:
        event?.league
          ?.abbreviation ||
        league?.short ||
        null,

      country:
        league?.country ||
        null,

      season:
        event?.season?.year ||
        null,

      round:
        competition?.week?.number ||
        event?.week?.number ||
        null,
    },

    participants: [
      homeTeam,
      awayTeam,
    ],

    venue:
      normalizeVenue(
        competition
      ),

    result: {
      homeScore:
        home?.score ??
        null,

      awayScore:
        away?.score ??
        null,

      winnerId:
        home?.winner
          ? homeTeam.id
          : away?.winner
            ? awayTeam.id
            : null,
    },

    details: {
      attendance:
        competition?.attendance ??
        null,

      neutralSite:
        Boolean(
          competition?.neutralSite
        ),

      conferenceCompetition:
        Boolean(
          competition
            ?.conferenceCompetition
        ),

      broadcasts:
        competition?.broadcasts ||
        [],

      notes:
        competition?.notes ||
        [],

      links:
        event?.links ||
        competition?.links ||
        [],
    },

    source: {
      provider:
        'espn',

      providerId:
        event?.id ||
        null,

      fetchedAt:
        new Date(),
    },
  });
}


/* -------------------------------------------------------
   ENTIRE SCOREBOARD
------------------------------------------------------- */

export function normalizeFootballScoreboard(
  payload,
  league
) {
  const events =
    payload?.events ||
    [];


  return events
    .map(
      (event) => {
        try {
          return normalizeFootballEvent(
            event,
            league
          );
        }

        catch (error) {
          console.warn(
            '[Sports HQ Football] Unable to normalize event:',
            event?.id,
            error
          );

          return null;
        }
      }
    )
    .filter(Boolean);
}


/* -------------------------------------------------------
   MULTI-LEAGUE PROVIDER RESULT
------------------------------------------------------- */

export function normalizeFootballLeagues(
  providerResult
) {
  const events = [];


  for (
    const item
    of providerResult?.leagues ||
      []
  ) {
    const normalized =
      normalizeFootballScoreboard(
        item.result.data,
        item.league
      );

    events.push(
      ...normalized
    );
  }


  return events.sort(
    (a, b) =>
      new Date(
        a.startTime
      ).getTime() -
      new Date(
        b.startTime
      ).getTime()
  );
}