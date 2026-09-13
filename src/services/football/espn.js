import {
  createCacheKey,
  fetchWithCache,
} from '../core/cache.js';

import {
  requestJson,
} from '../core/http.js';


const ESPN_SITE =
  'https://site.api.espn.com/apis/site/v2/sports';

const ESPN_STANDINGS =
  'https://site.api.espn.com/apis/v2/sports';


/* -------------------------------------------------------
   DATE HELPERS
------------------------------------------------------- */

function ymd(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  return `${year}${month}${day}`;
}


export function footballDateRange(
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
   URLS
------------------------------------------------------- */

function scoreboardUrl(
  leagueId,
  range
) {
  return (
    `${ESPN_SITE}/soccer/` +
    `${leagueId}/scoreboard` +
    `?dates=${range}`
  );
}


function summaryUrl(
  leagueId,
  eventId
) {
  return (
    `${ESPN_SITE}/soccer/` +
    `${leagueId}/summary` +
    `?event=${eventId}`
  );
}


function teamsUrl(
  leagueId
) {
  return (
    `${ESPN_SITE}/soccer/` +
    `${leagueId}/teams`
  );
}


function standingsUrl(
  leagueId,
  season = null
) {
  const base =
    `${ESPN_STANDINGS}/soccer/` +
    `${leagueId}/standings`;

  return season
    ? `${base}?season=${season}`
    : base;
}


/* -------------------------------------------------------
   SCOREBOARD
------------------------------------------------------- */

export async function fetchFootballScoreboard(
  leagueId,
  {
    range =
      footballDateRange(),

    forceRefresh = false,
  } = {}
) {
  const url =
    scoreboardUrl(
      leagueId,
      range
    );

  const key =
    createCacheKey(
      'football',
      'scoreboard',
      leagueId,
      range
    );


  return fetchWithCache({
    key,

    provider:
      'espn-football',

    ttlMs:
      60 * 1000,

    maxStaleMs:
      12 *
      60 *
      60 *
      1000,

    forceRefresh,

    fetcher: () =>
      requestJson(
        url,
        {
          cache:
            'no-store',
        }
      ),

    validate: (data) =>
      Array.isArray(
        data?.events
      ),

    metadata: {
      leagueId,
      range,
      resource:
        'scoreboard',
    },
  });
}


/* -------------------------------------------------------
   MULTIPLE LEAGUES
------------------------------------------------------- */

export async function fetchFootballScoreboards(
  leagues,
  {
    range =
      footballDateRange(),

    forceRefresh = false,
  } = {}
) {
  const requests =
    leagues.map(
      async (league) => {
        try {
          const result =
            await fetchFootballScoreboard(
              league.id,
              {
                range,
                forceRefresh,
              }
            );

          return {
            league,
            result,
            error: null,
          };
        }

        catch (error) {
          return {
            league,
            result: null,
            error,
          };
        }
      }
    );


  const results =
    await Promise.all(
      requests
    );


  const successful =
    results.filter(
      (item) =>
        item.result
    );

  const failed =
    results.filter(
      (item) =>
        item.error
    );


  if (!successful.length) {
    throw new Error(
      'Football scoreboards are unavailable.'
    );
  }


  return {
    leagues:
      successful,

    errors:
      failed.map(
        (item) => ({
          leagueId:
            item.league.id,

          leagueName:
            item.league.name,

          message:
            item.error?.message ||
            'Unavailable',
        })
      ),
  };
}


/* -------------------------------------------------------
   MATCH SUMMARY

   Used only when a user opens a match or when
   Sports HQ needs richer live/post-match details.
------------------------------------------------------- */

export async function fetchFootballMatchSummary(
  leagueId,
  eventId,
  {
    forceRefresh = false,
  } = {}
) {
  const url =
    summaryUrl(
      leagueId,
      eventId
    );

  const key =
    createCacheKey(
      'football',
      'summary',
      leagueId,
      eventId
    );


  return fetchWithCache({
    key,

    provider:
      'espn-football',

    ttlMs:
      2 * 60 * 1000,

    maxStaleMs:
      24 *
      60 *
      60 *
      1000,

    forceRefresh,

    fetcher: () =>
      requestJson(
        url,
        {
          cache:
            'no-store',
        }
      ),

    validate: (data) =>
      Boolean(data),

    metadata: {
      leagueId,
      eventId,
      resource:
        'summary',
    },
  });
}


/* -------------------------------------------------------
   STANDINGS
------------------------------------------------------- */

export async function fetchFootballStandings(
  leagueId,
  {
    season = null,
    forceRefresh = false,
  } = {}
) {
  const url =
    standingsUrl(
      leagueId,
      season
    );

  const key =
    createCacheKey(
      'football',
      'standings',
      leagueId,
      season || 'current'
    );


  return fetchWithCache({
    key,

    provider:
      'espn-football',

    ttlMs:
      30 *
      60 *
      1000,

    maxStaleMs:
      48 *
      60 *
      60 *
      1000,

    forceRefresh,

    fetcher: () =>
      requestJson(url),

    validate: (data) =>
      Boolean(data),

    metadata: {
      leagueId,
      season,
      resource:
        'standings',
    },
  });
}


/* -------------------------------------------------------
   TEAMS
------------------------------------------------------- */

export async function fetchFootballTeams(
  leagueId,
  {
    forceRefresh = false,
  } = {}
) {
  const url =
    teamsUrl(
      leagueId
    );

  const key =
    createCacheKey(
      'football',
      'teams',
      leagueId
    );


  return fetchWithCache({
    key,

    provider:
      'espn-football',

    ttlMs:
      24 *
      60 *
      60 *
      1000,

    maxStaleMs:
      30 *
      24 *
      60 *
      60 *
      1000,

    forceRefresh,

    fetcher: () =>
      requestJson(url),

    validate: (data) =>
      Boolean(
        data?.sports ||
        data?.teams
      ),

    metadata: {
      leagueId,
      resource:
        'teams',
    },
  });
}