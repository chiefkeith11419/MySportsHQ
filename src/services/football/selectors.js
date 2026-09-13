import {
  eventContainsTeam,
  EVENT_STATES,
} from '../core/eventModel.js';


/* -------------------------------------------------------
   BASIC FILTERS
------------------------------------------------------- */

export function getLiveFootballEvents(
  events = []
) {
  return events.filter(
    (event) =>
      event?.sport ===
        'football' &&
      event?.status?.state ===
        EVENT_STATES.LIVE
  );
}


export function getUpcomingFootballEvents(
  events = [],
  reference = new Date()
) {
  const now =
    reference.getTime();

  return events
    .filter(
      (event) => {
        if (
          event?.sport !==
          'football'
        ) {
          return false;
        }

        const start =
          new Date(
            event.startTime
          ).getTime();

        return (
          event.status?.state ===
            EVENT_STATES.LIVE ||
          start >= now
        );
      }
    )
    .sort(
      (a, b) =>
        new Date(
          a.startTime
        ).getTime() -
        new Date(
          b.startTime
        ).getTime()
    );
}


/* -------------------------------------------------------
   DATE FILTERS
------------------------------------------------------- */

function sameDay(
  a,
  b
) {
  return (
    a.getFullYear() ===
      b.getFullYear() &&
    a.getMonth() ===
      b.getMonth() &&
    a.getDate() ===
      b.getDate()
  );
}


export function getFootballEventsForDay(
  events = [],
  date = new Date()
) {
  return events
    .filter(
      (event) => {
        if (
          event?.sport !==
          'football'
        ) {
          return false;
        }

        const eventDate =
          new Date(
            event.startTime
          );

        return sameDay(
          eventDate,
          date
        );
      }
    )
    .sort(
      (a, b) =>
        new Date(
          a.startTime
        ).getTime() -
        new Date(
          b.startTime
        ).getTime()
    );
}


/* -------------------------------------------------------
   FOLLOWING
------------------------------------------------------- */

function getTeamAliases(
  team
) {
  if (!team) {
    return [];
  }

  if (
    Array.isArray(
      team.aliases
    )
  ) {
    return team.aliases;
  }

  return [
    team.name,
  ].filter(Boolean);
}


export function eventMatchesTeam(
  event,
  team
) {
  return eventContainsTeam(
    event,
    getTeamAliases(team)
  );
}


export function eventMatchesAnyTeam(
  event,
  teams = []
) {
  return teams.some(
    (team) =>
      eventMatchesTeam(
        event,
        team
      )
  );
}


export function getFollowedFootballEvents(
  events = [],
  teams = []
) {
  return events.filter(
    (event) =>
      event?.sport ===
        'football' &&
      eventMatchesAnyTeam(
        event,
        teams
      )
  );
}


/* -------------------------------------------------------
   PRIORITY

   Personal clubs can be ranked above normal followed
   teams without changing the event data itself.
------------------------------------------------------- */

export function getFootballPriority(
  event,
  {
    personalClubs = [],
    followedClubs = [],
  } = {}
) {
  if (
    eventMatchesAnyTeam(
      event,
      personalClubs
    )
  ) {
    return 100;
  }

  if (
    eventMatchesAnyTeam(
      event,
      followedClubs
    )
  ) {
    return 50;
  }

  if (
    event?.status?.state ===
    EVENT_STATES.LIVE
  ) {
    return 25;
  }

  return 0;
}


export function sortFootballByPriority(
  events = [],
  preferences = {}
) {
  return [...events].sort(
    (a, b) => {
      const priorityDifference =
        getFootballPriority(
          b,
          preferences
        ) -
        getFootballPriority(
          a,
          preferences
        );

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference;
      }

      return (
        new Date(
          a.startTime
        ).getTime() -
        new Date(
          b.startTime
        ).getTime()
      );
    }
  );
}


/* -------------------------------------------------------
   COMPETITION GROUPING
------------------------------------------------------- */

export function groupFootballByCompetition(
  events = []
) {
  return events.reduce(
    (groups, event) => {
      const id =
        event?.competition?.id ||
        'unknown';

      const name =
        event?.competition?.name ||
        'Other Football';

      if (!groups[id]) {
        groups[id] = {
          id,
          name,

          shortName:
            event?.competition
              ?.shortName ||
            null,

          country:
            event?.competition
              ?.country ||
            null,

          events: [],
        };
      }

      groups[id].events.push(
        event
      );

      return groups;
    },
    {}
  );
}


export function getFootballCompetitionGroups(
  events = []
) {
  const grouped =
    groupFootballByCompetition(
      events
    );

  return Object.values(
    grouped
  )
    .map(
      (group) => ({
        ...group,

        events:
          [...group.events].sort(
            (a, b) =>
              new Date(
                a.startTime
              ).getTime() -
              new Date(
                b.startTime
              ).getTime()
          ),
      })
    )
    .sort(
      (a, b) => {
        const firstA =
          a.events[0]
            ?.startTime;

        const firstB =
          b.events[0]
            ?.startTime;

        return (
          new Date(
            firstA
          ).getTime() -
          new Date(
            firstB
          ).getTime()
        );
      }
    );
}


/* -------------------------------------------------------
   DATE GROUPING
------------------------------------------------------- */

function dateKey(
  value
) {
  const date =
    new Date(value);

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return (
    `${year}-${month}-${day}`
  );
}


export function groupFootballByDay(
  events = []
) {
  return events.reduce(
    (groups, event) => {
      if (
        !event?.startTime
      ) {
        return groups;
      }

      const key =
        dateKey(
          event.startTime
        );

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(
        event
      );

      return groups;
    },
    {}
  );
}


/* -------------------------------------------------------
   DASHBOARD SELECTOR

   Designed for FootballPage/Home.
------------------------------------------------------- */

export function buildFootballDashboard(
  events = [],
  {
    personalClubs = [],
    followedClubs = [],
    reference = new Date(),
  } = {}
) {
  const upcoming =
    getUpcomingFootballEvents(
      events,
      reference
    );

  const allFollowing = [
    ...personalClubs,
    ...followedClubs,
  ];

  const followed =
    getFollowedFootballEvents(
      upcoming,
      allFollowing
    );

  const today =
    getFootballEventsForDay(
      upcoming,
      reference
    );

  const live =
    getLiveFootballEvents(
      events
    );

  return {
    live,

    today:
      sortFootballByPriority(
        today,
        {
          personalClubs,
          followedClubs,
        }
      ),

    followed:
      sortFootballByPriority(
        followed,
        {
          personalClubs,
          followedClubs,
        }
      ),

    competitions:
      getFootballCompetitionGroups(
        upcoming
      ),

    upcoming,
  };
}