import ClubCard from '../components/ClubCard.jsx';
import DataBanner from '../components/DataBanner.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Section from '../components/Section.jsx';

import {
  SPORTS_CONFIG,
} from '../data/config.js';

import {
  eventMatchesAnyTeam,
  eventMatchesTeam,
  getFootballEventsForDay,
  getUpcomingFootballEvents,
} from '../services/football/index.js';


/* -------------------------------------------------------
   WATCHLIST

   During migration, existing watchlist entries use the
   original ESPN event ID rather than the Sports HQ ID.
------------------------------------------------------- */

function getWatchlistId(
  event
) {
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
    getWatchlistId(
      event
    );

  return Boolean(
    id &&
    watchlist.includes(
      id
    )
  );
}


/* -------------------------------------------------------
   CLUB EVENT

   Personal club cards show the current/next fixture for
   Barcelona and NYCFC.

   Selection now uses universal Sports HQ events.
------------------------------------------------------- */

function getPersonalClubEvent(
  events,
  club
) {
  const matching =
    events.filter(
      (event) =>
        eventMatchesTeam(
          event,
          club
        )
    );


  if (
    !matching.length
  ) {
    return null;
  }


  /*
    Live match has highest priority.
  */

  const live =
    matching.find(
      (event) =>
        event?.status?.state ===
          'live' ||
        event?.status?.state ===
          'in'
    );


  if (live) {
    return live;
  }


  const now =
    Date.now();


  /*
    Otherwise select the next match.
  */

  return (
    matching
      .filter(
        (event) =>
          new Date(
            event.startTime
          ).getTime() >=
          now -
            4 *
              60 *
              60 *
              1000
      )
      .sort(
        (a, b) =>
          new Date(
            a.startTime
          ).getTime() -
          new Date(
            b.startTime
          ).getTime()
      )[0] ||
    null
  );
}


/* -------------------------------------------------------
   CLUB CARD COMPATIBILITY

   ClubCard still expects the original football shape.

   Home itself now uses universal events everywhere else.

   We can remove this small presentation adapter when
   ClubCard is migrated.
------------------------------------------------------- */

function toClubCardEvent(
  event
) {
  if (!event) {
    return null;
  }


  const home =
    event.participants
      ?.find(
        (participant) =>
          participant.role ===
          'home'
      ) ||
    event.participants?.[0];


  const away =
    event.participants
      ?.find(
        (participant) =>
          participant.role ===
          'away'
      ) ||
    event.participants?.[1];


  const team = (
    participant
  ) => ({
    id:
      participant?.id ||
      '',

    name:
      participant?.name ||
      'TBD',

    short:
      participant
        ?.abbreviation ||
      participant
        ?.shortName ||
      participant?.name ||
      'TBD',

    score:
      participant?.score ??
      null,

    logo:
      participant?.logo ||
      null,
  });


  return {
    id:
      getWatchlistId(
        event
      ),

    date:
      event.startTime,

    status:
      event?.status?.state ||
      'pre',

    detail:
      event?.status?.detail ||
      '',

    leagueId:
      event?.competition?.id ||
      '',

    leagueName:
      event?.competition?.name ||
      'Football',

    home:
      team(home),

    away:
      team(away),

    venue:
      event.venue,

    universal:
      event,
  };
}


/* -------------------------------------------------------
   HOME
------------------------------------------------------- */

export default function HomePage({
  football = [],
  footballMode,
  footballNotice,
  f1,
  watchlist = [],
  onToggleStar,
  onSaveNote,
  onNavigate,
}) {
  const today =
    new Date();


  const personalClubs =
    SPORTS_CONFIG.personal
      ?.clubs ||
    [];


  const followedClubs =
    SPORTS_CONFIG.following
      ?.clubs ||
    [];


  /* -----------------------------------------------------
     UPCOMING FOOTBALL

     Universal event model.
  ----------------------------------------------------- */

  const upcoming =
    getUpcomingFootballEvents(
      football,
      today
    );


  /* -----------------------------------------------------
     TODAY
  ----------------------------------------------------- */

  const todayEvents =
    getFootballEventsForDay(
      football,
      today
    );


  /* -----------------------------------------------------
     PERSONAL CLUBS

     Barcelona + NYCFC remain highest priority.
  ----------------------------------------------------- */

  const clubEvents =
    personalClubs.map(
      (club) => {
        const universalEvent =
          getPersonalClubEvent(
            upcoming,
            club
          );


        return {
          club,

          universalEvent,

          /*
            Temporary ClubCard compatibility.
          */
          event:
            toClubCardEvent(
              universalEvent
            ),
        };
      }
    );


  /* -----------------------------------------------------
     PERSONAL EVENT IDS

     Used only to prevent duplicate display farther down.
  ----------------------------------------------------- */

  const personalEventIds =
    new Set(
      clubEvents
        .map(
          ({
            universalEvent,
          }) =>
            universalEvent?.id
        )
        .filter(Boolean)
    );


  /* -----------------------------------------------------
     FOLLOWED TEAMS PLAYING TODAY

     Personal clubs are intentionally not duplicated here.
  ----------------------------------------------------- */

  const followedToday =
    todayEvents
      .filter(
        (event) =>
          !personalEventIds.has(
            event.id
          )
      )
      .filter(
        (event) =>
          eventMatchesAnyTeam(
            event,
            followedClubs
          )
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


  const followedEventIds =
    new Set(
      followedToday.map(
        (event) =>
          event.id
      )
    );


  /* -----------------------------------------------------
     OTHER FOOTBALL TODAY
  ----------------------------------------------------- */

  const generalToday =
    todayEvents
      .filter(
        (event) =>
          !personalEventIds.has(
            event.id
          ) &&
          !followedEventIds.has(
            event.id
          )
      )
      .sort(
        (a, b) =>
          new Date(
            a.startTime
          ).getTime() -
          new Date(
            b.startTime
          ).getTime()
      )
      .slice(
        0,
        6
      );


  return (
    <div className="page-stack">

      {/* HERO */}

      <div className="hero-copy">

        <p className="eyebrow">
          PERSONAL SPORTS DASHBOARD
        </p>


        <h1>
          What matters now.
        </h1>


        <p>
          Your clubs first, followed teams playing today,
          then the rest of the sports you are tracking.
        </p>

      </div>


      <DataBanner
        mode={
          footballMode
        }

        message={
          footballNotice
        }
      />


      {/* -------------------------------------------------
         PERSONAL CLUBS
      ------------------------------------------------- */}

      <Section
        eyebrow="PRIORITY"
        title="My Clubs"
      >

        <div className="club-grid">

          {clubEvents.map(
            ({
              club,
              event,
              universalEvent,
            }) => (

              <ClubCard
                key={
                  club.key
                }

                club={
                  club
                }

                event={
                  event
                }

                starred={
                  universalEvent
                    ? isStarred(
                        universalEvent,
                        watchlist
                      )
                    : false
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


      {/* -------------------------------------------------
         FOLLOWED TEAMS TODAY
      ------------------------------------------------- */}

      <Section
        eyebrow="FOLLOWING"

        title={
          followedToday.length
            ? `Following Today · ${followedToday.length}`
            : 'Following Today'
        }

        action={
          <button
            className="section-link"

            onClick={() =>
              onNavigate(
                'football'
              )
            }
          >
            Open football →
          </button>
        }
      >

        <div className="card-list">

          {followedToday.length ? (

            followedToday.map(
              (event) => (

                <MatchCard
                  key={
                    `followed-today-${event.id}`
                  }

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
                />

              )
            )

          ) : (

            <div className="empty-state">
              None of your followed football teams play today.
            </div>

          )}

        </div>

      </Section>


      {/* -------------------------------------------------
         OTHER FOOTBALL TODAY
      ------------------------------------------------- */}

      <Section
        eyebrow="TODAY"

        title="Other Matches"

        action={
          <button
            className="section-link"

            onClick={() =>
              onNavigate(
                'watch'
              )
            }
          >
            Open Watch →
          </button>
        }
      >

        <div className="card-list">

          {generalToday.length ? (

            generalToday.map(
              (event) => (

                <MatchCard
                  key={
                    `today-${event.id}`
                  }

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
                />

              )
            )

          ) : (

            <div className="empty-state">
              No additional football matches found today.
            </div>

          )}

        </div>

      </Section>


      {/* -------------------------------------------------
         FORMULA 1
      ------------------------------------------------- */}

      <Section
        eyebrow="MOTORSPORT"
        title="Formula 1"
      >

        <button
          className="feature-card f1-feature"

          onClick={() =>
            onNavigate(
              'f1'
            )
          }
        >

          <div>

            <span className="feature-icon">
              🏎️
            </span>


            <p className="eyebrow">
              NEXT / CURRENT EVENT
            </p>


            <h3>
              {f1?.event?.name ||
                'Formula 1'}
            </h3>


            <p>
              {f1?.event
                ?.nextSession
                ?.name
                ? `${f1.event.nextSession.name} · ${f1.event.nextSession.detail || ''}`
                : f1?.event?.detail ||
                  'Open the F1 dashboard'}
            </p>

          </div>


          <span className="feature-arrow">
            →
          </span>

        </button>

      </Section>


      {/* -------------------------------------------------
         QUICK ACCESS
      ------------------------------------------------- */}

      <div className="split-grid">

        <button
          className="mini-feature wwe-feature"

          onClick={() =>
            onNavigate(
              'wwe'
            )
          }
        >

          <span>
            🤼
          </span>

          <b>
            WWE
          </b>

          <small>
            Raw, SmackDown + PLEs
          </small>

        </button>


        <button
          className="mini-feature fpl-feature"

          onClick={() =>
            onNavigate(
              'fpl'
            )
          }
        >

          <span>
            🟣
          </span>

          <b>
            Roti Boys FC
          </b>

          <small>
            Fantasy HQ
          </small>

        </button>

      </div>

    </div>
  );
}