import { useState } from 'react';

import TeamIdentity from './TeamIdentity.jsx';

import {
  formatLocalDateTime,
} from '../services/sports.js';


/* -------------------------------------------------------
   DATE
------------------------------------------------------- */

function getEventDate(event) {
  return (
    event?.startTime ||
    event?.date ||
    null
  );
}


function formatGameDay(
  dateValue
) {
  if (!dateValue) {
    return 'TBD';
  }


  const gameDate =
    new Date(dateValue);


  if (
    Number.isNaN(
      gameDate.getTime()
    )
  ) {
    return 'TBD';
  }


  const today =
    new Date();


  const tomorrow =
    new Date(today);

  tomorrow.setDate(
    today.getDate() + 1
  );


  const sameCalendarDay =
    (a, b) =>
      a.getFullYear() ===
        b.getFullYear() &&
      a.getMonth() ===
        b.getMonth() &&
      a.getDate() ===
        b.getDate();


  if (
    sameCalendarDay(
      gameDate,
      today
    )
  ) {
    return 'TODAY';
  }


  if (
    sameCalendarDay(
      gameDate,
      tomorrow
    )
  ) {
    return 'TOMORROW';
  }


  return gameDate
    .toLocaleDateString(
      'en-US',
      {
        weekday:
          'short',

        month:
          'short',

        day:
          'numeric',
      }
    )
    .toUpperCase();
}


/* -------------------------------------------------------
   STATUS

   Supports both:

   legacy:
     event.status = "in"

   universal:
     event.status.state = "live"
------------------------------------------------------- */

function getStatusState(event) {
  if (
    typeof event?.status ===
    'string'
  ) {
    return event.status;
  }


  return (
    event?.status?.state ||
    'pre'
  );
}


function getStatusDetail(event) {
  if (
    typeof event?.status ===
    'object'
  ) {
    return (
      event.status.detail ||
      event.status.clock ||
      event.detail ||
      ''
    );
  }


  return (
    event?.detail ||
    ''
  );
}


function isLiveState(state) {
  return [
    'in',
    'live',
  ].includes(
    String(state)
      .toLowerCase()
  );
}


function isFinalState(
  state,
  event
) {
  return (
    [
      'post',
      'final',
    ].includes(
      String(state)
        .toLowerCase()
    ) ||
    event?.status
      ?.completed === true
  );
}


/* -------------------------------------------------------
   TEAMS

   Universal event:
     event.participants[]

   Legacy event:
     event.home / event.away
------------------------------------------------------- */

function participantByRole(
  event,
  role
) {
  return (
    event?.participants
      ?.find(
        (participant) =>
          participant.role ===
          role
      ) ||
    null
  );
}


function toTeamIdentity(
  participant
) {
  if (!participant) {
    return {
      id: '',
      name: 'TBD',
      short: 'TBD',
      score: null,
      logo: null,
    };
  }


  return {
    id:
      participant.id ||
      '',

    name:
      participant.name ||
      'TBD',

    short:
      participant.abbreviation ||
      participant.shortName ||
      participant.short ||
      participant.name ||
      'TBD',

    score:
      participant.score ??
      null,

    logo:
      participant.logo ||
      null,
  };
}


function getTeams(event) {
  /*
    New universal model.
  */

  if (
    Array.isArray(
      event?.participants
    )
  ) {
    const home =
      participantByRole(
        event,
        'home'
      ) ||
      event.participants[0];


    const away =
      participantByRole(
        event,
        'away'
      ) ||
      event.participants[1];


    return {
      home:
        toTeamIdentity(
          home
        ),

      away:
        toTeamIdentity(
          away
        ),
    };
  }


  /*
    Legacy model.
  */

  return {
    home:
      toTeamIdentity(
        event?.home
      ),

    away:
      toTeamIdentity(
        event?.away
      ),
  };
}


/* -------------------------------------------------------
   COMPETITION
------------------------------------------------------- */

function getCompetitionName(
  event
) {
  return (
    event?.competition?.name ||
    event?.leagueName ||
    'Football'
  );
}


function getCompetitionContext(
  event
) {
  const parts = [];


  const round =
    event?.competition?.round;


  if (round) {
    parts.push(
      `Round ${round}`
    );
  }


  const venue =
    event?.venue?.name;


  if (venue) {
    parts.push(
      venue
    );
  }


  return parts.join(
    ' · '
  );
}


/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */

export default function MatchCard({
  event,
  starred,
  onToggleStar,
  onSaveNote,
  compact = false,
}) {
  const [
    expanded,
    setExpanded,
  ] = useState(false);


  const [
    note,
    setNote,
  ] = useState('');


  const date =
    getEventDate(
      event
    );


  const dayLabel =
    formatGameDay(
      date
    );


  const statusState =
    getStatusState(
      event
    );


  const statusDetail =
    getStatusDetail(
      event
    );


  const isLive =
    isLiveState(
      statusState
    );


  const isFinal =
    isFinalState(
      statusState,
      event
    );


  const {
    home,
    away,
  } = getTeams(
    event
  );


  const competition =
    getCompetitionName(
      event
    );


  const context =
    getCompetitionContext(
      event
    );


  const hasScore =
    home?.score !== null &&
    home?.score !== undefined &&
    away?.score !== null &&
    away?.score !== undefined;


  /* -----------------------------------------------------
     CENTER STATUS
  ----------------------------------------------------- */

  let center;


  if (isLive) {
    center =
      statusDetail ||
      'LIVE';
  }

  else if (isFinal) {
    center =
      'FINAL';
  }

  else if (
    String(
      statusState
    ).toLowerCase() ===
    'postponed'
  ) {
    center =
      'POSTPONED';
  }

  else if (
    [
      'cancelled',
      'canceled',
    ].includes(
      String(
        statusState
      ).toLowerCase()
    )
  ) {
    center =
      'CANCELLED';
  }

  else if (
    String(
      statusState
    ).toLowerCase() ===
    'delayed'
  ) {
    center =
      'DELAYED';
  }

  else {
    center = (
      <span className="match-kickoff">

        <span className="match-day">
          {dayLabel}
        </span>


        <span className="match-time">

          {date
            ? formatLocalDateTime(
                date,
                {
                  weekday:
                    undefined,
                }
              )
            : 'TBD'}

        </span>

      </span>
    );
  }


  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */

  return (
    <article
      className={
        `match-card ${
          compact
            ? 'match-card--compact'
            : ''
        } ${
          isLive
            ? 'is-live'
            : ''
        }`
      }
    >

      {/* COMPETITION / STAR */}

      <div className="match-card__meta">

        <span>
          {competition}
        </span>


        <button
          className={
            `star ${
              starred
                ? 'is-starred'
                : ''
            }`
          }

          onClick={() =>
            onToggleStar?.(
              event
            )
          }

          aria-label={
            starred
              ? 'Remove from watchlist'
              : 'Add to watchlist'
          }
        >
          {starred
            ? '★'
            : '☆'}
        </button>

      </div>


      {/* SCORELINE */}

      <div className="match-card__scoreline">

        <TeamIdentity
          team={
            home
          }
        />


        <div className="score-center">

          {hasScore ? (

            <div className="score-center__score">

              <b>
                {home.score}
              </b>

              <span>
                –
              </span>

              <b>
                {away.score}
              </b>

            </div>

          ) : (

            <div className="score-center__vs">
              VS
            </div>

          )}


          <span
            className={
              isLive
                ? 'live-pill'
                : ''
            }
          >
            {center}
          </span>

        </div>


        <TeamIdentity
          team={
            away
          }

          align="right"
        />

      </div>


      {/* EXTRA UNIVERSAL DATA */}

      {!compact &&
        context && (

          <div className="match-card__context">
            {context}
          </div>

        )}


      {/* NOTES */}

      {!compact && (

        <>

          <button
            className="text-button"

            onClick={() =>
              setExpanded(
                (value) =>
                  !value
              )
            }
          >

            {expanded
              ? 'Hide notes'
              : '+ Match note'}

          </button>


          {expanded && (

            <div className="quick-note">

              <textarea
                value={
                  note
                }

                onChange={
                  (event) =>
                    setNote(
                      event.target.value
                    )
                }

                placeholder="What stood out to you?"

                rows={2}
              />


              <button
                disabled={
                  !note.trim()
                }

                onClick={() => {

                  onSaveNote?.({
                    sport:
                      'Football',

                    eventId:
                      event.id,

                    event:
                      `${home.name} vs ${away.name}`,

                    competition,

                    body:
                      note.trim(),

                    capturedAt:
                      new Date()
                        .toISOString(),
                  });


                  setNote(
                    ''
                  );


                  setExpanded(
                    false
                  );

                }}
              >

                Save to Content

              </button>

            </div>

          )}

        </>

      )}

    </article>
  );
}