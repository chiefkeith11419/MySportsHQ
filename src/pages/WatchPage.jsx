import { useMemo, useState } from 'react';

import MatchCard from '../components/MatchCard.jsx';
import ScheduleEventCard from '../components/ScheduleEventCard.jsx';
import Section from '../components/Section.jsx';

import { SPORTS_CONFIG } from '../data/config.js';
import { formatLocalDateTime } from '../services/sports.js';


/* -------------------------------------------------------
   DATE HELPERS
------------------------------------------------------- */

function startOfDay(value) {
  const date = new Date(value);

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}


function sameCalendarDay(a, b) {
  return (
    startOfDay(a).getTime() ===
    startOfDay(b).getTime()
  );
}


function getWeekendRange(referenceDate) {
  const today =
    startOfDay(referenceDate);

  const day =
    today.getDay();


  /*
    Saturday = 6
    Sunday = 0

    If we're already on Sunday,
    use the current weekend.

    Otherwise use the next Saturday.
  */

  let daysUntilSaturday =
    6 - day;

  if (day === 0) {
    daysUntilSaturday = -1;
  }


  const saturday =
    new Date(today);

  saturday.setDate(
    today.getDate() +
      daysUntilSaturday
  );


  const monday =
    new Date(saturday);

  monday.setDate(
    saturday.getDate() + 2
  );


  return {
    start: saturday,
    end: monday,
  };
}


function eventMatchesTab(
  event,
  tab,
  today
) {
  const eventDate =
    new Date(event.date);


  if (tab === 'yesterday') {
    const yesterday =
      new Date(today);

    yesterday.setDate(
      today.getDate() - 1
    );

    return sameCalendarDay(
      eventDate,
      yesterday
    );
  }


  if (tab === 'today') {
    return sameCalendarDay(
      eventDate,
      today
    );
  }


  if (tab === 'tomorrow') {
    const tomorrow =
      new Date(today);

    tomorrow.setDate(
      today.getDate() + 1
    );

    return sameCalendarDay(
      eventDate,
      tomorrow
    );
  }


  if (tab === 'weekend') {
    const weekend =
      getWeekendRange(today);

    const time =
      eventDate.getTime();

    return (
      time >=
        weekend.start.getTime() &&
      time <
        weekend.end.getTime()
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
      event.sport ||
        event.sportType ||
        'football'
    ).toLowerCase();


  if (
    value.includes('soccer') ||
    value === 'football'
  ) {
    return 'football';
  }


  if (
    value.includes('formula') ||
    value === 'f1'
  ) {
    return 'f1';
  }


  if (
    value.includes('wrestling') ||
    value === 'wwe'
  ) {
    return 'wwe';
  }


  if (
    value.includes('cricket')
  ) {
    return 'cricket';
  }


  return value;
}


function sportLabel(sport) {
  const labels = {
    football: 'Football',
    cricket: 'Cricket',
    f1: 'Formula 1',
    wwe: 'WWE',
  };

  return (
    labels[sport] ||
    sport
  );
}


function sportIcon(sport) {
  const icons = {
    football: '⚽',
    cricket: '🏏',
    f1: '🏎️',
    wwe: '🤼',
  };

  return (
    icons[sport] ||
    '●'
  );
}


/* -------------------------------------------------------
   FOLLOWING HELPERS
------------------------------------------------------- */

function eventSearchText(event) {
  return [
    event.home?.name,
    event.away?.name,
    event.team?.name,
    event.title,
    event.name,
    event.detail,
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
    eventSearchText(event);

  return aliases.some(
    (alias) =>
      text.includes(
        String(alias)
          .toLowerCase()
      )
  );
}


function isFollowedFootballEvent(
  event
) {
  const teams = [
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


  return teams.some(
    (team) =>
      matchesAliases(
        event,
        team.aliases ||
          [team.name]
      )
  );
}


function isFollowedCricketEvent(
  event
) {
  /*
    Once cricket teams exist in config.js
    they are used automatically.

    The fallback names make the Watch
    architecture ready for your CPL teams.
  */

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


  if (configuredTeams.length) {
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
    Anything you manually star
    always belongs in Watch.
  */

  if (
    watchlist.includes(
      event.id
    )
  ) {
    return true;
  }


  /*
    Providers can directly mark
    events as followed.
  */

  if (
    event.followed === true ||
    event.isFollowed === true ||
    event.priority === true
  ) {
    return true;
  }


  const sport =
    getSport(event);


  if (
    sport === 'football'
  ) {
    return (
      isFollowedFootballEvent(
        event
      )
    );
  }


  /*
    You follow F1 as a sport,
    so F1 schedule events belong
    automatically in Watch.
  */

  if (
    sport === 'f1'
  ) {
    return true;
  }


  /*
    RAW, SmackDown and PLEs
    belong automatically once
    dated WWE data is connected.
  */

  if (
    sport === 'wwe'
  ) {
    return true;
  }


  if (
    sport === 'cricket'
  ) {
    return (
      isFollowedCricketEvent(
        event
      )
    );
  }


  return false;
}


/* -------------------------------------------------------
   GROUPING
------------------------------------------------------- */

function localDateKey(value) {
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


  return `${year}-${month}-${day}`;
}


function groupByDate(events) {
  return events.reduce(
    (groups, event) => {
      const key =
        localDateKey(
          event.date
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


function groupBySport(events) {
  return events.reduce(
    (groups, event) => {
      const sport =
        getSport(event);


      if (!groups[sport]) {
        groups[sport] = [];
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
   FOOTBALL LEAGUE GROUPING
------------------------------------------------------- */

function groupFootballByLeague(
  events
) {
  return events.reduce(
    (groups, event) => {
      const key =
        event.leagueId ||
        event.leagueName ||
        event.competition ||
        'football';


      const configuredLeague =
        SPORTS_CONFIG
          .soccerLeagues
          ?.find(
            (league) =>
              league.id ===
              event.leagueId
          );


      if (!groups[key]) {
        groups[key] = {
          name:
            configuredLeague
              ?.name ||
            event.leagueName ||
            event.competition ||
            event.league ||
            'Football',

          short:
            configuredLeague
              ?.short ||
            '',

          events: [],
        };
      }


      groups[key]
        .events
        .push(event);


      return groups;
    },
    {}
  );
}


/* -------------------------------------------------------
   EVENT CARD

   Team-vs-team sports:
   MatchCard

   Schedule-style events:
   ScheduleEventCard
------------------------------------------------------- */

function EventCard({
  event,
  watchlist,
  onToggleStar,
  onSaveNote,
}) {
  const isTeamMatch =
    Boolean(
      event.home &&
      event.away
    );


  if (isTeamMatch) {
    return (
      <MatchCard
        event={event}
        starred={
          watchlist.includes(
            event.id
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
      event={event}
      starred={
        watchlist.includes(
          event.id
        )
      }
      onToggleStar={
        onToggleStar
      }
    />
  );
}


/* -------------------------------------------------------
   WATCH PAGE
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
  ] = useState('today');


  const today =
    startOfDay(
      new Date()
    );


  /* -----------------------------------------------------
     ONLY EVENTS RELEVANT TO YOU
  ----------------------------------------------------- */

  const followedEvents =
    useMemo(() => {
      return events
        .filter(
          (event) =>
            event?.id &&
            event?.date
        )

        .filter(
          (event) =>
            isFollowedEvent(
              event,
              watchlist
            )
        )

        .sort(
          (a, b) =>
            new Date(
              a.date
            ).getTime() -
            new Date(
              b.date
            ).getTime()
        );
    }, [
      events,
      watchlist,
    ]);


  /* -----------------------------------------------------
     DATE FILTER
  ----------------------------------------------------- */

  const visibleEvents =
    useMemo(() => {
      return followedEvents.filter(
        (event) =>
          eventMatchesTab(
            event,
            activeTab,
            today
          )
      );
    }, [
      followedEvents,
      activeTab,
    ]);


  const dayGroups =
    useMemo(
      () =>
        groupByDate(
          visibleEvents
        ),
      [visibleEvents]
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


  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */

  return (
    <div className="page-stack">

      <div className="page-heading">

        <p className="eyebrow">
          MY SPORTS
        </p>

        <h1>
          Watch
        </h1>

        <p>
          Your followed teams,
          sports and starred
          events organized by day.
        </p>

      </div>


      {/* DAY TABS */}

      <div className="watch-tabs">

        {tabs.map(
          ([
            key,
            label,
          ]) => (

            <button
              key={key}

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


      {/* EMPTY DAY */}

      {!visibleEvents.length && (

        <div className="empty-state">
          Nothing you follow is
          scheduled for this day.
        </div>

      )}


      {/* DAYS */}

      {Object.entries(
        dayGroups
      )
        .sort(
          (
            [a],
            [b]
          ) =>
            a.localeCompare(
              b
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
                key={day}
              >

                {/* DATE */}

                <div className="watch-day-heading">

                  <p className="eyebrow">

                    {formatLocalDateTime(
                      dayEvents[0]
                        .date,
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
                      ? 'event'
                      : 'events'}

                  </h2>

                </div>


                {/* SPORTS */}

                {Object.entries(
                  sports
                ).map(
                  ([
                    sport,
                    sportEvents,
                  ]) => {


                    /* -------------------------
                       FOOTBALL
                    ------------------------- */

                    if (
                      sport ===
                      'football'
                    ) {

                      const leagues =
                        groupFootballByLeague(
                          sportEvents
                        );


                      return (

                        <Section
                          key={sport}
                          eyebrow="FOOTBALL"
                          title="⚽ Football"
                        >

                          <div className="watch-league-stack">

                            {Object.entries(
                              leagues
                            ).map(
                              ([
                                leagueKey,
                                league,
                              ]) => (

                                <div
                                  className="watch-league"
                                  key={
                                    leagueKey
                                  }
                                >

                                  <div className="watch-league-heading">

                                    <strong>
                                      {
                                        league.name
                                      }
                                    </strong>


                                    <span className="watch-league-count">

                                      {
                                        league
                                          .events
                                          .length
                                      }

                                    </span>

                                  </div>


                                  <div className="card-list">

                                    {league.events.map(
                                      (
                                        event
                                      ) => (

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


                    /* -------------------------
                       F1 / CRICKET / WWE
                    ------------------------- */

                    return (

                      <Section
                        key={sport}

                        eyebrow={
                          sportLabel(
                            sport
                          ).toUpperCase()
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

                          {sportEvents.map(
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