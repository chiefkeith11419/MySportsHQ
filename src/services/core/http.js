/* -------------------------------------------------------
   SPORTS HQ HTTP CLIENT

   Shared request layer for every sport/provider.

   Features:
   - timeout
   - retry
   - JSON/text parsing
   - consistent errors
   - Retry-After support
   - external AbortSignal support
------------------------------------------------------- */

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 600;

const RETRYABLE_STATUS_CODES = new Set([
  408,
  425,
  429,
  500,
  502,
  503,
  504,
]);


/* -------------------------------------------------------
   ERROR TYPE
------------------------------------------------------- */

export class SportsHttpError extends Error {
  constructor(
    message,
    {
      url = null,
      status = null,
      statusText = null,
      attempt = null,
      cause = null,
    } = {}
  ) {
    super(message);

    this.name = 'SportsHttpError';

    this.url = url;
    this.status = status;
    this.statusText = statusText;
    this.attempt = attempt;
    this.cause = cause;
  }
}


/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}


function shouldRetryStatus(
  status
) {
  return RETRYABLE_STATUS_CODES.has(
    status
  );
}


function parseRetryAfter(
  value
) {
  if (!value) {
    return null;
  }

  const seconds =
    Number(value);

  if (
    Number.isFinite(seconds)
  ) {
    return Math.max(
      0,
      seconds * 1000
    );
  }


  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }


  return Math.max(
    0,
    date.getTime() -
      Date.now()
  );
}


function retryDelay(
  attempt,
  response = null,
  baseDelay =
    DEFAULT_RETRY_DELAY_MS
) {
  const retryAfter =
    response
      ? parseRetryAfter(
          response.headers.get(
            'Retry-After'
          )
        )
      : null;


  if (
    retryAfter !== null
  ) {
    return retryAfter;
  }


  /*
    Basic exponential backoff.

    attempt 0 = 600ms
    attempt 1 = 1200ms
    attempt 2 = 2400ms
  */

  return (
    baseDelay *
    Math.pow(
      2,
      attempt
    )
  );
}


/* -------------------------------------------------------
   REQUEST
------------------------------------------------------- */

export async function request(
  url,
  {
    method = 'GET',

    headers = {},

    body = undefined,

    timeout =
      DEFAULT_TIMEOUT_MS,

    retries =
      DEFAULT_RETRIES,

    retryDelayMs =
      DEFAULT_RETRY_DELAY_MS,

    signal = null,

    parseAs = 'json',

    credentials,

    cache,

    mode,

    redirect,

    referrerPolicy,
  } = {}
) {
  if (!url) {
    throw new SportsHttpError(
      'Request URL is required.'
    );
  }


  let lastError = null;


  for (
    let attempt = 0;
    attempt <= retries;
    attempt += 1
  ) {
    const controller =
      new AbortController();


    let timedOut = false;


    const timeoutId =
      setTimeout(
        () => {
          timedOut = true;

          controller.abort();
        },
        timeout
      );


    const handleExternalAbort =
      () => {
        controller.abort();
      };


    if (signal) {
      if (signal.aborted) {
        clearTimeout(
          timeoutId
        );

        throw new SportsHttpError(
          'Request was aborted.',
          {
            url,
            attempt,
          }
        );
      }


      signal.addEventListener(
        'abort',
        handleExternalAbort,
        {
          once: true,
        }
      );
    }


    try {
      const response =
        await fetch(
          url,
          {
            method,

            headers,

            body,

            signal:
              controller.signal,

            credentials,

            cache,

            mode,

            redirect,

            referrerPolicy,
          }
        );


      clearTimeout(
        timeoutId
      );


      if (signal) {
        signal.removeEventListener(
          'abort',
          handleExternalAbort
        );
      }


      if (!response.ok) {
        const error =
          new SportsHttpError(
            `HTTP ${response.status}: ${response.statusText}`,
            {
              url,

              status:
                response.status,

              statusText:
                response.statusText,

              attempt,
            }
          );


        lastError = error;


        if (
          attempt < retries &&
          shouldRetryStatus(
            response.status
          )
        ) {
          await sleep(
            retryDelay(
              attempt,
              response,
              retryDelayMs
            )
          );

          continue;
        }


        throw error;
      }


      if (
        parseAs === 'response'
      ) {
        return response;
      }


      if (
        parseAs === 'text'
      ) {
        return await response.text();
      }


      if (
        parseAs === 'blob'
      ) {
        return await response.blob();
      }


      if (
        parseAs === 'arrayBuffer'
      ) {
        return await response.arrayBuffer();
      }


      /*
        Default: JSON
      */

      if (
        response.status === 204
      ) {
        return null;
      }


      return await response.json();
    }

    catch (error) {
      clearTimeout(
        timeoutId
      );


      if (signal) {
        signal.removeEventListener(
          'abort',
          handleExternalAbort
        );
      }


      /*
        User/app intentionally aborted request.
      */

      if (
        signal?.aborted
      ) {
        throw new SportsHttpError(
          'Request was aborted.',
          {
            url,
            attempt,
            cause: error,
          }
        );
      }


      /*
        Timeout.
      */

      if (timedOut) {
        lastError =
          new SportsHttpError(
            `Request timed out after ${timeout}ms.`,
            {
              url,
              attempt,
              cause: error,
            }
          );
      }

      else if (
        error instanceof
        SportsHttpError
      ) {
        lastError =
          error;
      }

      else {
        lastError =
          new SportsHttpError(
            'Network request failed.',
            {
              url,
              attempt,
              cause: error,
            }
          );
      }


      if (
        attempt < retries
      ) {
        await sleep(
          retryDelay(
            attempt,
            null,
            retryDelayMs
          )
        );

        continue;
      }


      throw lastError;
    }
  }


  throw (
    lastError ||
    new SportsHttpError(
      'Request failed.',
      {
        url,
      }
    )
  );
}


/* -------------------------------------------------------
   CONVENIENCE HELPERS
------------------------------------------------------- */

export function requestJson(
  url,
  options = {}
) {
  return request(
    url,
    {
      ...options,
      parseAs: 'json',
    }
  );
}


export function requestText(
  url,
  options = {}
) {
  return request(
    url,
    {
      ...options,
      parseAs: 'text',
    }
  );
}


/* -------------------------------------------------------
   PROVIDER RESPONSE WRAPPER

   Providers can use this so pages know:
   - where data came from
   - when it was fetched
   - whether it is live/cached/demo
------------------------------------------------------- */

export function createDataEnvelope({
  data,
  provider,
  mode = 'live',
  fetchedAt = new Date(),
  stale = false,
  error = null,
}) {
  return {
    data,

    meta: {
      provider:
        provider || null,

      mode,

      fetchedAt:
        new Date(
          fetchedAt
        ).toISOString(),

      stale:
        Boolean(stale),

      error:
        error
          ? {
              name:
                error.name ||
                'Error',

              message:
                error.message ||
                String(error),

              status:
                error.status ??
                null,
            }
          : null,
    },
  };
}