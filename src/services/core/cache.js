/* -------------------------------------------------------
   SPORTS HQ DATA CACHE

   Shared browser cache for all sports/providers.

   Flow:

   fresh cache
       ↓
   network
       ↓ failure
   stale / last-known cache
       ↓ failure
   provider decides whether to use demo/unavailable state
------------------------------------------------------- */

import {
  createDataEnvelope,
} from './http.js';


const CACHE_PREFIX =
  'sportsHQ.data.';

const CACHE_VERSION = 1;

const DEFAULT_TTL_MS =
  5 * 60 * 1000;

const DEFAULT_MAX_STALE_MS =
  7 * 24 * 60 * 60 * 1000;


/* -------------------------------------------------------
   STORAGE
------------------------------------------------------- */

function getStorage() {
  try {
    if (
      typeof window ===
        'undefined' ||
      !window.localStorage
    ) {
      return null;
    }

    return window.localStorage;
  }

  catch {
    return null;
  }
}


/* -------------------------------------------------------
   CACHE KEY
------------------------------------------------------- */

export function createCacheKey(
  ...parts
) {
  return (
    CACHE_PREFIX +
    parts
      .filter(
        (part) =>
          part !== null &&
          part !== undefined &&
          part !== ''
      )
      .map(
        (part) =>
          String(part)
            .trim()
            .toLowerCase()
            .replace(
              /[^a-z0-9._-]+/g,
              '-'
            )
      )
      .join('.')
  );
}


/* -------------------------------------------------------
   WRITE
------------------------------------------------------- */

export function writeCache(
  key,
  data,
  {
    ttlMs =
      DEFAULT_TTL_MS,

    metadata = {},
  } = {}
) {
  const storage =
    getStorage();

  if (!storage || !key) {
    return false;
  }


  const now =
    Date.now();


  const record = {
    version:
      CACHE_VERSION,

    storedAt:
      now,

    expiresAt:
      now + ttlMs,

    metadata,

    data,
  };


  try {
    storage.setItem(
      key,
      JSON.stringify(
        record
      )
    );

    return true;
  }

  catch (error) {
    console.warn(
      '[Sports HQ Cache] Unable to write cache:',
      key,
      error
    );

    return false;
  }
}


/* -------------------------------------------------------
   READ
------------------------------------------------------- */

export function readCache(
  key,
  {
    allowStale = true,

    maxStaleMs =
      DEFAULT_MAX_STALE_MS,
  } = {}
) {
  const storage =
    getStorage();


  if (!storage || !key) {
    return {
      hit: false,
      data: null,
    };
  }


  try {
    const raw =
      storage.getItem(key);


    if (!raw) {
      return {
        hit: false,
        data: null,
      };
    }


    const record =
      JSON.parse(raw);


    if (
      record?.version !==
      CACHE_VERSION
    ) {
      storage.removeItem(
        key
      );

      return {
        hit: false,
        data: null,
      };
    }


    const now =
      Date.now();

    const storedAt =
      Number(
        record.storedAt
      );

    const expiresAt =
      Number(
        record.expiresAt
      );


    const ageMs =
      now - storedAt;

    const stale =
      now > expiresAt;


    if (
      stale &&
      !allowStale
    ) {
      return {
        hit: false,
        stale: true,
        data: null,
      };
    }


    if (
      stale &&
      ageMs >
        maxStaleMs
    ) {
      return {
        hit: false,
        stale: true,
        tooOld: true,
        data: null,
      };
    }


    return {
      hit: true,

      stale,

      ageMs,

      storedAt:
        new Date(
          storedAt
        ).toISOString(),

      expiresAt:
        new Date(
          expiresAt
        ).toISOString(),

      metadata:
        record.metadata ||
        {},

      data:
        record.data,
    };
  }

  catch (error) {
    console.warn(
      '[Sports HQ Cache] Unable to read cache:',
      key,
      error
    );


    try {
      storage.removeItem(
        key
      );
    }

    catch {
      // Ignore cleanup failures.
    }


    return {
      hit: false,
      data: null,
    };
  }
}


/* -------------------------------------------------------
   REMOVE
------------------------------------------------------- */

export function removeCache(
  key
) {
  const storage =
    getStorage();

  if (!storage || !key) {
    return false;
  }


  try {
    storage.removeItem(
      key
    );

    return true;
  }

  catch {
    return false;
  }
}


/* -------------------------------------------------------
   CLEAR SPORTS HQ DATA CACHE
------------------------------------------------------- */

export function clearSportsCache() {
  const storage =
    getStorage();

  if (!storage) {
    return 0;
  }


  let removed = 0;


  const keys = [];


  for (
    let index = 0;
    index <
      storage.length;
    index += 1
  ) {
    const key =
      storage.key(index);

    if (
      key?.startsWith(
        CACHE_PREFIX
      )
    ) {
      keys.push(key);
    }
  }


  keys.forEach(
    (key) => {
      storage.removeItem(
        key
      );

      removed += 1;
    }
  );


  return removed;
}


/* -------------------------------------------------------
   FETCH + CACHE

   Main helper providers will use.

   1. Use fresh cache if available.
   2. Otherwise try network.
   3. Save successful network data.
   4. If network fails, use stale cache if available.
   5. Otherwise throw the original network error.
------------------------------------------------------- */

export async function fetchWithCache({
  key,

  fetcher,

  provider,

  ttlMs =
    DEFAULT_TTL_MS,

  maxStaleMs =
    DEFAULT_MAX_STALE_MS,

  forceRefresh = false,

  allowStaleOnError = true,

  validate = null,

  metadata = {},
}) {
  if (!key) {
    throw new Error(
      'fetchWithCache requires a cache key.'
    );
  }


  if (
    typeof fetcher !==
    'function'
  ) {
    throw new Error(
      'fetchWithCache requires a fetcher function.'
    );
  }


  /* -----------------------------------------------------
     FRESH CACHE
  ----------------------------------------------------- */

  if (!forceRefresh) {
    const fresh =
      readCache(
        key,
        {
          allowStale:
            false,
        }
      );


    if (fresh.hit) {
      return createDataEnvelope({
        data:
          fresh.data,

        provider,

        mode:
          'cache',

        fetchedAt:
          fresh.storedAt,

        stale:
          false,
      });
    }
  }


  /* -----------------------------------------------------
     NETWORK
  ----------------------------------------------------- */

  try {
    const data =
      await fetcher();


    if (
      validate &&
      !validate(data)
    ) {
      throw new Error(
        `Invalid data returned by ${provider || 'provider'}.`
      );
    }


    writeCache(
      key,
      data,
      {
        ttlMs,

        metadata: {
          provider,
          ...metadata,
        },
      }
    );


    return createDataEnvelope({
      data,

      provider,

      mode:
        'live',

      fetchedAt:
        new Date(),

      stale:
        false,
    });
  }


  /* -----------------------------------------------------
     NETWORK FAILURE
  ----------------------------------------------------- */

  catch (error) {
    if (
      allowStaleOnError
    ) {
      const stale =
        readCache(
          key,
          {
            allowStale:
              true,

            maxStaleMs,
          }
        );


      if (stale.hit) {
        return createDataEnvelope({
          data:
            stale.data,

          provider,

          mode:
            'stale',

          fetchedAt:
            stale.storedAt,

          stale:
            true,

          error,
        });
      }
    }


    throw error;
  }
}


/* -------------------------------------------------------
   INSPECT CACHE

   Useful later for Settings / diagnostics.
------------------------------------------------------- */

export function getSportsCacheSummary() {
  const storage =
    getStorage();

  if (!storage) {
    return [];
  }


  const entries = [];


  for (
    let index = 0;
    index <
      storage.length;
    index += 1
  ) {
    const key =
      storage.key(index);


    if (
      !key?.startsWith(
        CACHE_PREFIX
      )
    ) {
      continue;
    }


    const cached =
      readCache(
        key,
        {
          allowStale:
            true,

          maxStaleMs:
            Number.MAX_SAFE_INTEGER,
        }
      );


    entries.push({
      key,

      hit:
        cached.hit,

      stale:
        cached.stale ||
        false,

      ageMs:
        cached.ageMs ||
        null,

      storedAt:
        cached.storedAt ||
        null,

      expiresAt:
        cached.expiresAt ||
        null,

      metadata:
        cached.metadata ||
        {},
    });
  }


  return entries;
}