import {
  useMemo,
  useState,
} from 'react';

import MatchCard from '../components/MatchCard.jsx';
import ScheduleEventCard from '../components/ScheduleEventCard.jsx';
import Section from '../components/Section.jsx';

import {
  SPORTS_CONFIG,
} from '../data/config.js';

import {
  eventMatchesAnyTeam,
  getFootballCompetitionGroups,
} from '../services/football/index.js';

import {
  formatLocalDateTime,
} from '../services/sports.js';


/* -------------------------------------------------------
   SPORT ORDER
------------------------------------------------------- */

const SPORT_ORDER = [
  'football',
  'cricket',
  'f1',
  'wwe',
];


/* -------------------------------------------------------
   EVENT HELPERS

   Universal Sports HQ events use startTime.

   F1 / Cricket / WWE can temporarily still use date
   until their v0.3 providers are migrated.
------------------------------------------------------- */

function getEventDate(event) {
  return (
    event?.startTime ||
    event?.date ||
    null
  );
}


function getWatchlistId(event) {
  return (
    event?.source
      ?.providerId ||
    event?.id ||
    null
  );
}


function isStarred(
  event,
  watchlist
) {
  const id =
    getWatchlistId(event);

  return Boolean(
    id &&
    watchlist.includes(id)
  );
}


/* -------------------------------------------------------
   DATE HELPERS
------------------------------------------------------- */

function startOfDay(value) {
  const date =
    new Date(value);

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}


function sameCalendarDay(
  first,
  second
) {
  return (
    startOfDay(first)
      .getTime() ===
    startOfDay(second)
      .getTime()
  );
}


function getWeekendRange(
  referenceDate
) {
  const today =
    startOfDay(
      referenceDate
    );

  const day =
    today.getDay();

  let daysUntilSaturday =
    6 - day;


  /*
    Sunday belongs to the current weekend.
  */

  if (day === 0) {
    daysUntilSaturday =
      -1;
  }


  const saturday =
    new Date(today);

  saturday.setDate(
    today.getDate() +
      daysUntilSaturday
  );


  const monday =
    new Date(
      saturday
    );

  monday.setDate(
    saturday.getDate() +
      2
  );


  return {
    start:
      saturday,

    end:
      monday,
  };
}


function eventMatchesTab(
  event,
  tab,
  today
) {
  const rawDate =
    getEventDate(
      event
    );


  if (!rawDate) {
    return false;
  }


  const eventDate =
    new Date(
      rawDate
    );


  if (
    Number.isNaN(
      eventDate.getTime()
    )
  ) {
    return false;
  }


  if (
    tab ===
    'yesterday'
  ) {
    const yesterday =
      new Date(today);

    yesterday.setDate(
      today.getDate() -
        1
    );

    return sameCalendarDay(
      eventDate,
      yesterday
    );
  }


  if (
    tab ===
    'today'
  ) {
    return sameCalendarDay(
      eventDate,
      today
    );
  }


  if (
    tab ===
    'tomorrow'
  ) {
    const tomorrow =
      new Date(today);

    tomorrow.setDate(
      today.getDate() +
        1
    );

    return sameCalendarDay(
      eventDate,
      tomorrow
    );
  }


  if (
    tab ===
    'weekend'
  ) {
    const weekend =
      getWeekendRange(
        today
      );

    const time =
      eventDate.getTime();

    return (
      time >=
        weekend.start
          .getTime() &&
      time <
        weekend.end
          .getTime()
    );
  }


  return false;
}


/* -------------------------------------------------------
   SPORT HELPERS
------------------------------------------------------- */

function getSport(event) {
  const value =
    String(
      event?.sport ||
      event?.sportType ||
      'football'
    )
      .toLowerCase()
      .trim();


  if (
    value ===
      'football' ||
    value.includes(
      'soccer'
    )
  ) {
    return 'football';
  }


  if (
    value ===
      'f1' ||
    value.includes(
      'formula'
    )
  ) {
    return 'f1';
  }


  if (
    value ===
      'wwe' ||
    value.includes(
      'wrestling'
    )
  ) {
    return 'wwe';
  }


  if (
    value.includes(
      'cricket'
    )
  ) {
    return 'cricket';
  }


  return value;
}


function sportLabel(sport) {
  const labels = {
    football:
      'Football',

    cricket:
      'Cricket',

    f1:
      'Formula 1',

    wwe:
      'WWE',
  };

  return (
    labels[sport] ||
    sport
  );
}


function sportIcon(sport) {
  const icons = {
    football:
      '⚽',

    cricket:
      '🏏',

    f1:
      '🏎️',

    wwe:
      '🤼',
  };

  return (
    icons[sport] ||
    '●'
  );
}


/* -------------------------------------------------------
   GENERIC SEARCH HELPERS

   Used temporarily by Cricket until its own selectors
   are implemented.
------------------------------------------------------- */

function getParticipantNames(
  event
) {
  if (
    Array.isArray(
      event?.participants
    )
  ) {
    return event.participants
      .flatMap(
        (participant) => [
          participant?.name,
          participant?.shortName,
          participant?.abbreviation,
        ]
      )
      .filter(Boolean);
  }


  return [
    event?.home?.name,
    event?.away?.name,
    event?.team?.name,
  ].filter(Boolean);
}


function eventSearchText(event) {
  return [
    ...getParticipantNames(
      event
    ),

    event?.title,
    event?.name,
    event?.detail,

    event?.competition
      ?.name,

    event?.leagueName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}


function matchesAliases(
  event,
  aliases = []
) {
  const text =
    eventSearchText(
      event
    );


  return aliases.some(
    (alias) =>
      text.includes(
        String(alias)
          .toLowerCase()
          .trim()
      )
  );
}


/* -------------------------------------------------------
   FOLLOWING
------------------------------------------------------- */

function getFootballTeams() {
  return [
    ...(
      SPORTS_CONFIG
        .personal
        ?.clubs ||
      []
    ),

    ...(
      SPORTS_CONFIG
        .following
        ?.clubs ||
      []
    ),
  ];
}


function isFollowedFootballEvent(
  event
) {
  return eventMatchesAnyTeam(
    event,
    getFootballTeams()
  );
}


function isFollowedCricketEvent(
  event
) {
  const configuredTeams = [
    ...(
      SPORTS_CONFIG
        .cricket
        ?.following ||
      []
    ),

    ...(
      SPORTS_CONFIG
        .cricket
        ?.teams ||
      []
    ),
  ];


  if (
    configuredTeams.length
  ) {
    return configuredTeams.some(
      (team) => {
        if (
          typeof team ===
          'string'
        ) {
          return matchesAliases(
            event,
            [team]
          );
        }


        return matchesAliases(
          event,
          team.aliases ||
          [team.name]
        );
      }
    );
  }


  /*
    Temporary CPL defaults.
  */

  return matchesAliases(
    event,
    [
      'Trinbago Knight Riders',
      'TKR',
      'St Lucia Kings',
      'Saint Lucia Kings',
    ]
  );
}


function isFollowedEvent(
  event,
  watchlist
) {
  /*
    Manually starred event.
  */

  if (
    isStarred(
      event,
      watchlist
    )
  ) {
    return true;
  }


  /*
    Provider/selector explicitly marks it.
  */

  if (
    event?.followed ===
      true ||
    event?.isFollowed ===
      true ||
    event?.priority ===
      true
  ) {
    return true;
  }


  const sport =
    getSport(
      event
    );


  if (
    sport ===
    'football'
  ) {
    return isFollowedFootballEvent(
      event
    );
  }


  /*
    F1 is followed globally.
  */

  if (
    sport ===
    'f1'
  ) {
    return true;
  }


  /*
    Raw, SmackDown and PLEs will all be followed once
    WWE data is connected.
  */

  if (
    sport ===
    'wwe'
  ) {
    return true;
  }


  if (
    sport ===
    'cricket'
  ) {
    return isFollowedCricketEvent(
      event
    );
  }


  return false;
}


/* -------------------------------------------------------
   GROUP BY DATE
------------------------------------------------------- */

function localDateKey(value) {
  const date =
    new Date(value);

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1
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


function groupByDate(events) {
  return events.reduce(
    (
      groups,
      event
    ) => {
      const date =
        getEventDate(
          event
        );


      if (!date) {
        return groups;
      }


      const key =
        localDateKey(
          date
        );


      if (!groups[key]) {
        groups[key] =
          [];
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
   GROUP BY SPORT
------------------------------------------------------- */

function groupBySport(events) {
  return events.reduce(
    (
      groups,
      event
    ) => {
      const sport =
        getSport(
          event
        );


      if (!groups[sport]) {
        groups[sport] =
          [];
      }


      groups[sport].push(
        event
      );


      return groups;
    },
    {}
  );
}


/* -------------------------------------------------------
   TEMPORARY SCHEDULE CARD ADAPTER

   ScheduleEventCard itself will become universal during
   the F1 / Cricket / WWE migration.
------------------------------------------------------- */

function toScheduleCardEvent(
  event
) {
  const date =
    getEventDate(
      event
    );


  return {
    ...event,

    id:
      getWatchlistId(
        event
      ),

    date,

    title:
      event?.title ||
      event?.name ||
      event?.competition
        ?.name ||
      sportLabel(
        getSport(event)
      ),

    leagueName:
      event?.competition
        ?.name ||
      event?.leagueName ||
      sportLabel(
        getSport(event)
      ),

    detail:
      event?.status
        ?.detail ||
      event?.detail ||
      '',
  };
}


/* -------------------------------------------------------
   EVENT CARD
------------------------------------------------------- */

function EventCard({
  event,
  watchlist,
  onToggleStar,
  onSaveNote,
}) {
  const sport =
    getSport(
      event
    );


  if (
    sport ===
    'football'
  ) {
    return (
      <MatchCard
        event={
          event
        }

        starred={
          isStarred(
            event,
            watchlist
          )
        }

        onToggleStar={
          onToggleStar
        }

        onSaveNote={
          onSaveNote
        }

        compact
      />
    );
  }


  return (
    <ScheduleEventCard
      event={
        toScheduleCardEvent(
          event
        )
      }

      starred={
        isStarred(
          event,
          watchlist
        )
      }

      onToggleStar={() =>
        onToggleStar?.(
          event
        )
      }
    />
  );
}


/* -------------------------------------------------------
   WATCH
------------------------------------------------------- */

export default function WatchPage({
  events = [],
  watchlist = [],
  onToggleStar,
  onSaveNote,
}) {
  const [
    activeTab,
    setActiveTab,
  ] = useState(
    'today'
  );


  const today =
    startOfDay(
      new Date()
    );


  /* -----------------------------------------------------
     FOLLOWED / STARRED EVENTS
  ----------------------------------------------------- */

  const followedEvents =
    useMemo(
      () =>
        events
          .filter(
            (event) =>
              event?.id &&
              getEventDate(
                event
              )
          )
          .filter(
            (event) =>
              isFollowedEvent(
                event,
                watchlist
              )
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                getEventDate(
                  first
                )
              ).getTime() -
              new Date(
                getEventDate(
                  second
                )
              ).getTime()
          ),
      [
        events,
        watchlist,
      ]
    );


  /* -----------------------------------------------------
     ACTIVE DATE
  ----------------------------------------------------- */

  const visibleEvents =
    useMemo(
      () =>
        followedEvents.filter(
          (event) =>
            eventMatchesTab(
              event,
              activeTab,
              today
            )
        ),
      [
        followedEvents,
        activeTab,
      ]
    );


  const dayGroups =
    useMemo(
      () =>
        groupByDate(
          visibleEvents
        ),
      [
        visibleEvents,
      ]
    );


  const tabs = [
    [
      'yesterday',
      'Yesterday',
    ],

    [
      'today',
      'Today',
    ],

    [
      'tomorrow',
      'Tomorrow',
    ],

    [
      'weekend',
      'Weekend',
    ],
  ];


  return (
    <div className="page-stack">

      {/* HEADER */}

      <div className="page-heading">

        <p className="eyebrow">
          MY SPORTS
        </p>


        <h1>
          Watch
        </h1>


        <p>
          Your followed teams, sports and starred events
          organized by day.
        </p>

      </div>


      {/* DATE TABS */}

      <div className="watch-tabs">

        {tabs.map(
          ([
            key,
            label,
          ]) => (

            <button
              key={
                key
              }

              className={
                `watch-tab ${
                  activeTab ===
                    key
                    ? 'is-active'
                    : ''
                }`
              }

              onClick={() =>
                setActiveTab(
                  key
                )
              }
            >
              {label}
            </button>

          )
        )}

      </div>


      {/* EMPTY */}

      {!visibleEvents.length && (

        <div className="empty-state">
          Nothing you follow is scheduled for this day.
        </div>

      )}


      {/* DAYS */}

      {Object.entries(
        dayGroups
      )
        .sort(
          (
            [first],
            [second]
          ) =>
            first.localeCompare(
              second
            )
        )
        .map(
          ([
            day,
            dayEvents,
          ]) => {

            const sports =
              groupBySport(
                dayEvents
              );


            return (
              <div
                className="watch-day"

                key={
                  day
                }
              >

                {/* DATE */}

                <div className="watch-day-heading">

                  <p className="eyebrow">

                    {formatLocalDateTime(
                      getEventDate(
                        dayEvents[0]
                      ),
                      {
                        weekday:
                          'long',

                        month:
                          'short',

                        day:
                          'numeric',

                        hour:
                          undefined,

                        minute:
                          undefined,
                      }
                    )}

                  </p>


                  <h2>

                    {dayEvents.length}{' '}

                    {dayEvents.length ===
                    1
                      ? 'to watch'
                      : 'to watch'}

                  </h2>

                </div>


                {/* SPORTS */}

                {SPORT_ORDER
                  .filter(
                    (sport) =>
                      sports[sport]
                        ?.length
                  )
                  .map(
                    (sport) => {
                      const sportEvents =
                        sports[sport];


                      /* -------------------------------
                         FOOTBALL
                      ------------------------------- */

                      if (
                        sport ===
                        'football'
                      ) {
                        const competitions =
                          getFootballCompetitionGroups(
                            sportEvents
                          );


                        return (
                          <Section
                            key={
                              sport
                            }

                            eyebrow="FOOTBALL"

                            title="⚽ Football"
                          >

                            <div className="watch-league-stack">

                              {competitions.map(
                                (competition) => (

                                  <div
                                    className="watch-league"

                                    key={
                                      competition.id
                                    }
                                  >

                                    <div className="watch-league-heading">

                                      <strong>
                                        {competition.name}
                                      </strong>


                                      <span className="watch-league-count">
                                        {
                                          competition.events.length
                                        }
                                      </span>

                                    </div>


                                    <div className="card-list">

                                      {competition.events.map(
                                        (event) => (

                                          <EventCard
                                            key={
                                              event.id
                                            }

                                            event={
                                              event
                                            }

                                            watchlist={
                                              watchlist
                                            }

                                            onToggleStar={
                                              onToggleStar
                                            }

                                            onSaveNote={
                                              onSaveNote
                                            }
                                          />

                                        )
                                      )}

                                    </div>

                                  </div>

                                )
                              )}

                            </div>

                          </Section>
                        );
                      }


                      /* -------------------------------
                         OTHER SPORTS
                      ------------------------------- */

                      return (
                        <Section
                          key={
                            sport
                          }

                          eyebrow={
                            sportLabel(
                              sport
                            )
                              .toUpperCase()
                          }

                          title={
                            `${sportIcon(
                              sport
                            )} ${sportLabel(
                              sport
                            )}`
                          }
                        >

                          <div className="card-list">

                            {sportEvents
                              .sort(
                                (
                                  first,
                                  second
                                ) =>
                                  new Date(
                                    getEventDate(
                                      first
                                    )
                                  ).getTime() -
                                  new Date(
                                    getEventDate(
                                      second
                                    )
                                  ).getTime()
                              )
                              .map(
                                (event) => (

                                  <EventCard
                                    key={
                                      event.id
                                    }

                                    event={
                                      event
                                    }

                                    watchlist={
                                      watchlist
                                    }

                                    onToggleStar={
                                      onToggleStar
                                    }

                                    onSaveNote={
                                      onSaveNote
                                    }
                                  />

                                )
                              )}

                          </div>

                        </Section>
                      );
                    }
                  )}

              </div>
            );
          }
        )}

    </div>
  );
}