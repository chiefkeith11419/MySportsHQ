import { useState } from 'react';
import TeamIdentity from './TeamIdentity.jsx';
import { formatLocalDateTime } from '../services/sports.js';

function formatGameDay(dateValue) {
  const gameDate = new Date(dateValue);
  const today = new Date();

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameCalendarDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameCalendarDay(gameDate, today)) {
    return 'TODAY';
  }

  if (sameCalendarDay(gameDate, tomorrow)) {
    return 'TOMORROW';
  }

  return gameDate
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
}

export default function MatchCard({
  event,
  starred,
  onToggleStar,
  onSaveNote,
  compact = false,
}) {
  const dayLabel = formatGameDay(event.date);

  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');

  const isLive = event.status === 'in';
  const isFinal = event.status === 'post';

  const hasScore =
    event.home?.score !== null &&
    event.home?.score !== undefined &&
    event.away?.score !== null &&
    event.away?.score !== undefined;

  const center = isLive
    ? event.detail || 'LIVE'
    : isFinal
      ? 'FINAL'
      : (
          <span className="match-kickoff">
            <span className="match-day">{dayLabel}</span>
            <span className="match-time">
              {formatLocalDateTime(event.date, { weekday: undefined })}
            </span>
          </span>
        );

  return (
    <article
      className={`match-card ${compact ? 'match-card--compact' : ''} ${
        isLive ? 'is-live' : ''
      }`}
    >
      <div className="match-card__meta">
        <span>{event.leagueName}</span>

        <button
          className={`star ${starred ? 'is-starred' : ''}`}
          onClick={() => onToggleStar?.(event)}
          aria-label="Toggle watchlist"
        >
          {starred ? '★' : '☆'}
        </button>
      </div>

      <div className="match-card__scoreline">
        <TeamIdentity team={event.home} />

        <div className="score-center">
          {hasScore ? (
            <div className="score-center__score">
              <b>{event.home.score}</b>
              <span>–</span>
              <b>{event.away.score}</b>
            </div>
          ) : (
            <div className="score-center__vs">VS</div>
          )}

          <span className={isLive ? 'live-pill' : ''}>{center}</span>
        </div>

        <TeamIdentity team={event.away} align="right" />
      </div>

      {!compact && (
        <>
          <button
            className="text-button"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide notes' : '+ Match note'}
          </button>

          {expanded && (
            <div className="quick-note">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What stood out to you?"
                rows={2}
              />

              <button
                disabled={!note.trim()}
                onClick={() => {
                  onSaveNote?.({
                    sport: 'Football',
                    eventId: event.id,
                    event: `${event.home.name} vs ${event.away.name}`,
                    body: note.trim(),
                    capturedAt: new Date().toISOString(),
                  });

                  setNote('');
                  setExpanded(false);
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