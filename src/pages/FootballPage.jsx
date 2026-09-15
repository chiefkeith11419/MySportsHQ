import DataBanner from '../components/DataBanner.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Section from '../components/Section.jsx';

import { SPORTS_CONFIG } from '../data/config.js';

import {
  buildFootballDashboard,
} from '../services/football/index.js';


/* -------------------------------------------------------
   CONFIG HELPERS
------------------------------------------------------- */

function getCompetitionConfig(
  competitionId
) {
  return (
    SPORTS_CONFIG.soccerLeagues
      ?.find(
        (league) =>
          league.id ===
          competitionId
      ) ||
    null
  );
}


/*
  During migration, old saved watchlist entries may use
  the raw ESPN provider ID while universal events use
  "espn-football-12345".

  Support both until Watch/Home are fully migrated.
*/
function isStarred(
  event,
  watchlist
) {
  const providerId =
    event?.source?.providerId;

  return (
    watchlist.includes(
      event.id
    ) ||
    (
      providerId &&
      watchlist.includes(
        providerId
      )
    )
  );
}


/* -------------------------------------------------------
   FOOTBALL PAGE
------------------------------------------------------- */

export default function FootballPage({
  events = [],
  mode,
  notice,
  watchlist = [],
  onToggleStar,
  onSaveNote,
}) {
  const personalClubs =
    SPORTS_CONFIG.personal
      ?.clubs ||
    [];


  const followedClubs =
    SPORTS_CONFIG.following
      ?.clubs ||
    [];


  /* -----------------------------------------------------
     BUILD DASHBOARD

     All filtering, following logic, priority ranking and
     competition grouping now lives in selectors.js.
  ----------------------------------------------------- */

  const dashboard =
    buildFootballDashboard(
      events,
      {
        personalClubs,
        followedClubs,
        reference:
          new Date(),
      }
    );


  const {
    live,
    today,
    followed,
    competitions,
    upcoming,
  } = dashboard;


  return (
    <div className="page-stack">

      {/* HEADER */}

      <div className="page-heading">

        <p className="eyebrow">
          SPORT
        </p>

        <h1>
          Football
        </h1>

        <p>
          Your clubs and followed teams first,
          followed by upcoming matches grouped
          by competition.
        </p>

      </div>


      <DataBanner
        mode={mode}
        message={notice}
      />


      {/* LIVE SUMMARY */}

      {live.length > 0 && (

        <Section
          eyebrow="LIVE"
          title={`Live Now · ${live.length}`}
        >

          <div className="card-list">

            {live.map(
              (event) => (

                <MatchCard
                  key={
                    `live-${event.id}`
                  }

                  event={event}

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
            )}

          </div>

        </Section>

      )}


      {/* FOLLOWED CLUBS */}

      <Section
        eyebrow="FOLLOWING"

        title={
          `Your Matches${
            followed.length
              ? ` · ${followed.length}`
              : ''
          }`
        }
      >

        {followed.length ? (

          <div className="card-list">

            {followed.map(
              (event) => (

                <MatchCard
                  key={
                    `following-${event.id}`
                  }

                  event={event}

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
            )}

          </div>

        ) : (

          <div className="empty-state">
            No upcoming matches found for
            your followed teams.
          </div>

        )}

      </Section>


      {/* TODAY */}

      {today.length > 0 && (

        <Section
          eyebrow="TODAY"
          title={`Today's Football · ${today.length}`}
        >

          <div className="card-list">

            {today.map(
              (event) => (

                <MatchCard
                  key={
                    `today-${event.id}`
                  }

                  event={event}

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
            )}

          </div>

        </Section>

      )}


      {/* COMPETITIONS */}

      {competitions.map(
        (group) => {
          const config =
            getCompetitionConfig(
              group.id
            );


          const eyebrow =
            config?.short ||
            group.shortName ||
            'COMPETITION';


          const icon =
            config?.icon ||
            '⚽';


          return (

            <Section
              key={
                group.id
              }

              eyebrow={
                eyebrow
              }

              title={
                `${icon} ${group.name} · ${group.events.length}`
              }
            >

              <div className="card-list">

                {group.events.map(
                  (event) => (

                    <MatchCard
                      key={
                        `${group.id}-${event.id}`
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
                )}

              </div>

            </Section>

          );
        }
      )}


      {/* EMPTY */}

      {!upcoming.length && (

        <div className="empty-state">
          No upcoming football fixtures
          were found in the current data
          window.
        </div>

      )}

    </div>
  );
}