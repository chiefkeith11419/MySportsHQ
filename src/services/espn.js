const ESPN_SITE =
  'https://site.api.espn.com/apis/site/v2/sports';


/* -------------------------------------------------------
   DATE HELPERS
------------------------------------------------------- */

const ymd = (date) => {
  const y =
    date.getFullYear();

  const m =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const d =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${y}${m}${d}`;
};


export function dateRange(
  startOffset = -1,
  endOffset = 7
) {
  const start =
    new Date();

  start.setDate(
    start.getDate() +
      startOffset
  );


  const end =
    new Date();

  end.setDate(
    end.getDate() +
      endOffset
  );


  return `${ymd(start)}-${ymd(end)}`;
}


/* -------------------------------------------------------
   FOOTBALL
------------------------------------------------------- */

function normalizeSoccerEvent(
  event,
  fallbackLeague
) {
  const competition =
    event?.competitions?.[0];

  const competitors =
    competition?.competitors ||
    [];

  const home =
    competitors.find(
      (c) =>
        c.homeAway ===
        'home'
    ) ||
    competitors[0];

  const away =
    competitors.find(
      (c) =>
        c.homeAway ===
        'away'
    ) ||
    competitors[1];


  const statusType =
    event?.status?.type ||
    competition?.status?.type ||
    {};


  const state =
    statusType.state ||
    'scheduled';


  const team = (entry) => ({
    id:
      entry?.team?.id ||
      entry?.id ||
      '',

    name:
      entry?.team?.displayName ||
      entry?.team?.shortDisplayName ||
      'TBD',

    short:
      entry?.team?.abbreviation ||
      entry?.team?.shortDisplayName ||
      'TBD',

    score:
      entry?.score ??
      null,

    logo:
      entry?.team?.logo ||
      null,
  });


  return {
    id:
      event?.id ||
      crypto.randomUUID(),

    sport:
      'football',

    leagueId:
      fallbackLeague.id,

    leagueName:
      event?.league?.name ||
      fallbackLeague.name,

    date:
      event?.date ||
      competition?.date ||
      new Date().toISOString(),

    status:
      state,

    detail:
      statusType.shortDetail ||
      statusType.detail ||
      event?.status?.type
        ?.description ||
      '',

    home:
      team(home),

    away:
      team(away),

    raw:
      event,
  };
}


export async function fetchSoccerScoreboards(
  leagues,
  range = dateRange()
) {
  const requests =
    leagues.map(
      async (league) => {

        const url =
          `${ESPN_SITE}/soccer/${league.id}/scoreboard?dates=${range}`;


        const response =
          await fetch(
            url,
            {
              cache:
                'no-store',
            }
          );


        if (!response.ok) {
          throw new Error(
            `${league.name}: ${response.status}`
          );
        }


        const data =
          await response.json();


        return (
          data.events ||
          []
        ).map(
          (event) =>
            normalizeSoccerEvent(
              event,
              league
            )
        );
      }
    );


  const results =
    await Promise.allSettled(
      requests
    );


  const events = [];
  const errors = [];


  results.forEach(
    (
      result,
      index
    ) => {

      if (
        result.status ===
        'fulfilled'
      ) {
        events.push(
          ...result.value
        );
      } else {
        errors.push(
          `${leagues[index].name}: ${
            result.reason?.message ||
            'unavailable'
          }`
        );
      }
    }
  );


  if (
    !events.length &&
    errors.length ===
      leagues.length
  ) {
    throw new Error(
      'Football data is unavailable from the browser right now.'
    );
  }


  return {
    events:
      events.sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      ),

    partialErrors:
      errors,
  };
}


/* -------------------------------------------------------
   FORMULA 1 HELPERS
------------------------------------------------------- */

function getF1SessionName(
  competition
) {
  const abbreviation =
    String(
      competition?.type
        ?.abbreviation ||
        ''
    ).toLowerCase();


  const names = {
    fp1: 'Practice 1',
    fp2: 'Practice 2',
    fp3: 'Practice 3',

    qual: 'Qualifying',
    q: 'Qualifying',

    sprint: 'Sprint',
    spr: 'Sprint',

    sq: 'Sprint Qualifying',
    sprintq:
      'Sprint Qualifying',

    race: 'Race',
  };


  return (
    names[abbreviation] ||
    competition?.type
      ?.abbreviation ||
    'Session'
  );
}


function normalizeF1Driver(
  competitor
) {
  return {
    id:
      competitor?.id ||
      competitor?.athlete?.id ||
      '',

    position:
      Number(
        competitor?.order ||
        competitor?.place ||
        competitor?.rank ||
        999
      ),

    name:
      competitor?.athlete
        ?.displayName ||
      competitor?.athlete
        ?.fullName ||
      competitor?.displayName ||
      'Driver',

    short:
      competitor?.athlete
        ?.shortName ||
      '',

    winner:
      Boolean(
        competitor?.winner
      ),

    flag:
      competitor?.athlete
        ?.flag?.href ||
      null,

    country:
      competitor?.athlete
        ?.flag?.alt ||
      '',

    statistics:
      competitor?.statistics ||
      [],
  };
}


function normalizeF1Session(
  competition
) {
  const status =
    competition?.status?.type ||
    {};


  const results =
    (
      competition
        ?.competitors ||
      []
    )
      .map(
        normalizeF1Driver
      )
      .sort(
        (a, b) =>
          a.position -
          b.position
      );


  return {
    id:
      competition?.id ||
      crypto.randomUUID(),

    name:
      getF1SessionName(
        competition
      ),

    abbreviation:
      competition?.type
        ?.abbreviation ||
      '',

    date:
      competition?.date ||
      competition?.startDate ||
      null,

    status:
      status.state ||
      'pre',

    completed:
      Boolean(
        status.completed
      ),

    detail:
      status.shortDetail ||
      status.detail ||
      status.description ||
      '',

    broadcast:
      competition?.broadcast ||
      competition?.broadcasts
        ?.[0]?.names?.[0] ||
      '',

    results,

    top3:
      results.slice(
        0,
        3
      ),

    raw:
      competition,
  };
}


function getEventIdFromRef(
  ref
) {
  if (!ref) return null;

  const match =
    String(ref).match(
      /events\/(\d+)/
    );

  return match?.[1] ||
    null;
}


function normalizeF1Calendar(
  data
) {
  const calendar =
    data?.leagues?.[0]
      ?.calendar ||
    [];


  return calendar.map(
    (
      item,
      index
    ) => ({
      round:
        index + 1,

      name:
        item.label ||
        `Round ${index + 1}`,

      startDate:
        item.startDate ||
        null,

      endDate:
        item.endDate ||
        null,

      eventId:
        getEventIdFromRef(
          item?.event?.$ref
        ),
    })
  );
}


function chooseF1Weekend(
  calendar
) {
  if (!calendar.length) {
    return null;
  }


  const now =
    Date.now();


  /*
    A weekend stays "current"
    until several hours after
    its listed end time.
  */

  const currentOrNext =
    calendar.find(
      (round) => {
        const end =
          new Date(
            round.endDate ||
            round.startDate
          ).getTime();

        return (
          end >=
          now -
            6 *
              60 *
              60 *
              1000
        );
      }
    );


  return (
    currentOrNext ||
    calendar.at(-1)
  );
}


function chooseF1Event(
  events,
  targetWeekend
) {
  if (!events.length) {
    return null;
  }


  /*
    Best case:
    match the event ID
    from the ESPN calendar.
  */

  if (
    targetWeekend?.eventId
  ) {
    const exact =
      events.find(
        (event) =>
          String(event.id) ===
          String(
            targetWeekend.eventId
          )
      );

    if (exact) {
      return exact;
    }
  }


  /*
    Second choice:
    event whose weekend
    overlaps target start date.
  */

  if (
    targetWeekend
      ?.startDate
  ) {
    const target =
      new Date(
        targetWeekend.startDate
      ).getTime();


    const ordered =
      [...events].sort(
        (a, b) =>
          Math.abs(
            new Date(a.date) -
              target
          ) -
          Math.abs(
            new Date(b.date) -
              target
          )
      );


    if (ordered.length) {
      return ordered[0];
    }
  }


  /*
    Final fallback:
    closest upcoming event.
  */

  const now =
    Date.now();


  const ordered =
    [...events].sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );


  return (
    ordered.find(
      (event) =>
        new Date(
          event.endDate ||
            event.date
        ).getTime() >=
        now -
          6 *
            60 *
            60 *
            1000
    ) ||
    ordered.at(-1)
  );
}


function normalizeF1Event(
  event,
  calendar,
  targetWeekend
) {
  if (!event) {
    return null;
  }


  const sessions =
    (
      event.competitions ||
      []
    )
      .map(
        normalizeF1Session
      )
      .filter(
        (session) =>
          session.date
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


  const now =
    Date.now();


  /*
    Find the first session
    that is live or hasn't
    started yet.
  */

  const nextSession =
    sessions.find(
      (session) => {

        if (
          session.status ===
          'in'
        ) {
          return true;
        }

        return (
          !session.completed &&
          new Date(
            session.date
          ).getTime() >=
            now -
              30 *
                60 *
                1000
        );
      }
    ) ||
    null;


  const raceSession =
    sessions.find(
      (session) =>
        session.name ===
        'Race'
    );


  const status =
    event?.status?.type ||
    {};


  const circuit =
    event?.circuit ||
    {};


  const round =
    calendar.find(
      (item) =>
        String(item.eventId) ===
        String(event.id)
    ) ||
    targetWeekend ||
    null;


  return {
    id:
      event.id,

    name:
      event.name ||
      event.shortName ||
      'Formula 1',

    shortName:
      event.shortName ||
      event.name ||
      'Formula 1',

    round:
      round?.round ||
      null,

    season:
      event?.season?.year ||
      new Date().getFullYear(),

    startDate:
      event.date ||
      round?.startDate ||
      null,

    endDate:
      event.endDate ||
      round?.endDate ||
      null,

    /*
      Keep date because App.jsx
      currently expects it.
    */

    date:
      nextSession?.date ||
      event.date ||
      round?.startDate ||
      null,

    status:
      status.state ||
      (
        nextSession
          ? 'pre'
          : 'post'
      ),

    detail:
      status.shortDetail ||
      status.detail ||
      '',

    circuit: {
      id:
        circuit.id ||
        '',

      name:
        circuit.fullName ||
        circuit.name ||
        '',

      city:
        circuit?.address?.city ||
        '',

      country:
        circuit?.address?.country ||
        '',
    },

    sessions,

    nextSession,

    raceResult:
      raceSession?.results ||
      [],

    podium:
      raceSession
        ?.completed
        ? raceSession.top3
        : [],

    links:
      event.links ||
      [],

    raw:
      event,
  };
}


/* -------------------------------------------------------
   FORMULA 1 FETCH
------------------------------------------------------- */

export async function fetchF1Scoreboard() {
  const baseUrl =
    `${ESPN_SITE}/racing/f1/scoreboard`;


  /*
    First request gives us ESPN's
    season calendar.

    ESPN's default event can still
    be the previous race after a
    weekend has ended, so we use
    the calendar to identify the
    actual current/next weekend.
  */

  const baseResponse =
    await fetch(
      baseUrl,
      {
        cache:
          'no-store',
      }
    );


  if (!baseResponse.ok) {
    throw new Error(
      `F1: ${baseResponse.status}`
    );
  }


  const baseData =
    await baseResponse.json();


  const calendar =
    normalizeF1Calendar(
      baseData
    );


  const targetWeekend =
    chooseF1Weekend(
      calendar
    );


  let data =
    baseData;


  /*
    Request the dates for the
    current/next Grand Prix.

    This is what allows Sports HQ
    to move on from last weekend's
    race instead of waiting for the
    default ESPN scoreboard to move.
  */

  if (
    targetWeekend
      ?.startDate
  ) {
    const start =
      new Date(
        targetWeekend.startDate
      );

    const end =
      new Date(
        targetWeekend.endDate ||
        targetWeekend.startDate
      );


    const range =
      `${ymd(start)}-${ymd(end)}`;


    try {
      const targetResponse =
        await fetch(
          `${baseUrl}?dates=${range}`,
          {
            cache:
              'no-store',
          }
        );


      if (
        targetResponse.ok
      ) {
        const targetData =
          await targetResponse.json();


        if (
          targetData?.events
            ?.length
        ) {
          data =
            targetData;
        }
      }
    } catch {
      /*
        Keep baseData as fallback.
      */
    }
  }


  const events =
    data.events ||
    [];


  const selectedEvent =
    chooseF1Event(
      events,
      targetWeekend
    );


  /*
    If date-specific data did not
    return the desired event,
    check the original response too.
  */

  const fallbackEvent =
    selectedEvent ||
    chooseF1Event(
      baseData.events ||
        [],
      targetWeekend
    );


  const normalizedEvent =
    normalizeF1Event(
      fallbackEvent,
      calendar,
      targetWeekend
    );


  return {
    event:
      normalizedEvent,

    calendar,

    targetWeekend,

    raw:
      data,
  };
}