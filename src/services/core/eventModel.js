/* -------------------------------------------------------
   SPORTS HQ UNIVERSAL EVENT MODEL

   Every sport provider is converted into this shape
   before being sent to Home, Watch or shared schedules.

   Sport-specific data is preserved inside `details`.
------------------------------------------------------- */

export const SPORTS = {
  FOOTBALL: 'football',
  F1: 'f1',
  CRICKET: 'cricket',
  WWE: 'wwe',
};

export const EVENT_KINDS = {
  MATCH: 'match',
  SESSION: 'session',
  RACE: 'race',
  SHOW: 'show',
};

export const EVENT_STATES = {
  PRE: 'pre',
  LIVE: 'live',
  POST: 'post',
  DELAYED: 'delayed',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown',
};

function cleanString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const result = String(value).trim();

  return result || null;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeParticipant(participant = {}) {
  return {
    id: cleanString(participant.id),

    name:
      cleanString(participant.name) ||
      'Unknown',

    shortName:
      cleanString(participant.shortName),

    abbreviation:
      cleanString(participant.abbreviation),

    role:
      cleanString(participant.role),

    logo:
      cleanString(participant.logo),

    score:
      participant.score ?? null,

    winner:
      participant.winner ?? null,

    metadata:
      participant.metadata || {},
  };
}

export function createSportsEvent({
  id,
  sport,
  eventKind,
  title,
  shortTitle,
  startTime,
  endTime = null,
  status = {},
  competition = {},
  participants = [],
  venue = null,
  result = null,
  followed = false,
  priority = false,
  details = {},
  source = {},
}) {
  if (!id) {
    throw new Error(
      'Sports HQ event requires an id.'
    );
  }

  if (!sport) {
    throw new Error(
      `Sports HQ event ${id} requires a sport.`
    );
  }

  if (!startTime) {
    throw new Error(
      `Sports HQ event ${id} requires a startTime.`
    );
  }

  return {
    id: String(id),

    sport: String(sport),

    eventKind:
      eventKind || EVENT_KINDS.MATCH,

    title:
      cleanString(title) ||
      'Untitled event',

    shortTitle:
      cleanString(shortTitle),

    startTime:
      normalizeDate(startTime),

    endTime:
      normalizeDate(endTime),

    status: {
      state:
        status.state ||
        EVENT_STATES.UNKNOWN,

      detail:
        cleanString(status.detail),

      clock:
        cleanString(status.clock),

      period:
        status.period ?? null,

      completed:
        Boolean(status.completed),
    },

    competition: {
      id:
        cleanString(competition.id),

      name:
        cleanString(competition.name),

      shortName:
        cleanString(
          competition.shortName
        ),

      country:
        cleanString(
          competition.country
        ),

      season:
        competition.season ?? null,

      round:
        competition.round ?? null,

      logo:
        cleanString(
          competition.logo
        ),
    },

    participants:
      participants.map(
        normalizeParticipant
      ),

    venue: venue
      ? {
          id:
            cleanString(venue.id),

          name:
            cleanString(venue.name),

          city:
            cleanString(venue.city),

          country:
            cleanString(venue.country),

          latitude:
            venue.latitude ?? null,

          longitude:
            venue.longitude ?? null,
        }
      : null,

    result:
      result || null,

    followed:
      Boolean(followed),

    priority:
      Boolean(priority),

    details:
      details || {},

    source: {
      provider:
        cleanString(
          source.provider
        ),

      providerId:
        cleanString(
          source.providerId
        ),

      url:
        cleanString(source.url),

      fetchedAt:
        normalizeDate(
          source.fetchedAt ||
          new Date()
        ),
    },
  };
}

export function isSportsEvent(event) {
  return Boolean(
    event &&
      event.id &&
      event.sport &&
      event.eventKind &&
      event.startTime
  );
}

export function sortEventsByTime(
  events = []
) {
  return [...events].sort(
    (a, b) =>
      new Date(
        a.startTime
      ).getTime() -
      new Date(
        b.startTime
      ).getTime()
  );
}

export function getEventDate(event) {
  if (!event?.startTime) {
    return null;
  }

  return new Date(
    event.startTime
  );
}

export function isEventToday(
  event,
  reference = new Date()
) {
  const eventDate =
    getEventDate(event);

  if (!eventDate) {
    return false;
  }

  return (
    eventDate.getFullYear() ===
      reference.getFullYear() &&
    eventDate.getMonth() ===
      reference.getMonth() &&
    eventDate.getDate() ===
      reference.getDate()
  );
}

export function eventContainsTeam(
  event,
  aliases = []
) {
  if (
    !event?.participants?.length
  ) {
    return false;
  }

  const normalizedAliases =
    aliases.map((alias) =>
      String(alias)
        .toLowerCase()
        .trim()
    );

  return event.participants.some(
    (participant) => {
      const values = [
        participant.name,
        participant.shortName,
        participant.abbreviation,
      ]
        .filter(Boolean)
        .map((value) =>
          value.toLowerCase()
        );

      return normalizedAliases.some(
        (alias) =>
          values.some(
            (value) =>
              value.includes(alias) ||
              alias.includes(value)
          )
      );
    }
  );
}