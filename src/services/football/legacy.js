import {
  createSportsEvent,
  EVENT_KINDS,
  EVENT_STATES,
  SPORTS,
} from '../core/eventModel.js';


/* -------------------------------------------------------
   STATUS
------------------------------------------------------- */

function legacyStateToUniversal(
  state
) {
  switch (
    String(
      state || ''
    ).toLowerCase()
  ) {
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

    case 'pre':
    case 'scheduled':
    default:
      return EVENT_STATES.PRE;
  }
}


/* -------------------------------------------------------
   UNIVERSAL → LEGACY

   Temporary adapter for Home / Watch.
------------------------------------------------------- */

function participantByRole(
  event,
  role
) {
  return (
    event?.participants?.find(
      (participant) =>
        participant.role === role
    ) ||
    null
  );
}


function legacyTeam(
  participant
) {
  if (!participant) {
    return {
      id: '',
      name: 'TBD',
      short: 'TBD',
      score: null,
      logo: null,
    };
  }


  return {
    id:
      participant.id ||
      '',

    name:
      participant.name ||
      'TBD',

    short:
      participant.abbreviation ||
      participant.shortName ||
      participant.name ||
      'TBD',

    score:
      participant.score ??
      null,

    logo:
      participant.logo ||
      null,
  };
}


export function toLegacyFootballEvent(
  event
) {
  const home =
    participantByRole(
      event,
      'home'
    );


  const away =
    participantByRole(
      event,
      'away'
    );


  return {
    /*
      Preserve the original ESPN ID.

      This keeps existing watchlist entries
      compatible during migration.
    */
    id:
      event?.source?.providerId ||
      event.id,

    sport:
      'football',

    leagueId:
      event?.competition?.id ||
      '',

    leagueName:
      event?.competition?.name ||
      'Football',

    date:
      event.startTime,

    status:
      event?.status?.state ||
      'pre',

    detail:
      event?.status?.detail ||
      '',

    home:
      legacyTeam(
        home
      ),

    away:
      legacyTeam(
        away
      ),

    venue:
      event.venue,

    /*
      Keep the full universal event available
      during migration.
    */
    universal:
      event,
  };
}


export function toLegacyFootballEvents(
  events = []
) {
  return events.map(
    toLegacyFootballEvent
  );
}


/* -------------------------------------------------------
   LEGACY → UNIVERSAL

   Mainly used so DEMO_FOOTBALL can still power the
   new Football page if every provider/cache fails.
------------------------------------------------------- */

export function fromLegacyFootballEvent(
  event
) {
  /*
    If this legacy object came from the adapter above,
    simply recover its original universal event.
  */

  if (
    event?.universal
  ) {
    return event.universal;
  }


  const home =
    event?.home ||
    {};


  const away =
    event?.away ||
    {};


  return createSportsEvent({
    id:
      `demo-football-${event.id}`,

    sport:
      SPORTS.FOOTBALL,

    eventKind:
      EVENT_KINDS.MATCH,

    title:
      `${home.name || 'TBD'} vs ${away.name || 'TBD'}`,

    startTime:
      event.date,

    status: {
      state:
        legacyStateToUniversal(
          event.status
        ),

      detail:
        event.detail ||
        null,

      completed:
        [
          'post',
          'final',
        ].includes(
          String(
            event.status
          ).toLowerCase()
        ),
    },

    competition: {
      id:
        event.leagueId ||
        null,

      name:
        event.leagueName ||
        'Football',
    },

    participants: [
      {
        id:
          home.id ||
          null,

        name:
          home.name ||
          'TBD',

        abbreviation:
          home.short ||
          null,

        role:
          'home',

        logo:
          home.logo ||
          null,

        score:
          home.score ??
          null,
      },

      {
        id:
          away.id ||
          null,

        name:
          away.name ||
          'TBD',

        abbreviation:
          away.short ||
          null,

        role:
          'away',

        logo:
          away.logo ||
          null,

        score:
          away.score ??
          null,
      },
    ],

    result: {
      homeScore:
        home.score ??
        null,

      awayScore:
        away.score ??
        null,
    },

    details: {
      demo:
        true,
    },

    source: {
      provider:
        'demo',

      providerId:
        event.id ||
        null,

      fetchedAt:
        new Date(),
    },
  });
}


export function fromLegacyFootballEvents(
  events = []
) {
  return events
    .map(
      (event) => {
        try {
          return fromLegacyFootballEvent(
            event
          );
        }

        catch (error) {
          console.warn(
            '[Sports HQ Football] Unable to migrate legacy event:',
            event?.id,
            error
          );

          return null;
        }
      }
    )
    .filter(Boolean);
}