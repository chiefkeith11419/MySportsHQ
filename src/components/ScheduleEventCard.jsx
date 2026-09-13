import { formatLocalDateTime } from '../services/sports.js';


function sportIcon(sport) {
  const icons = {
    f1: '🏎️',
    wwe: '🤼',
    cricket: '🏏',
  };

  return icons[sport] || '●';
}


function sportName(sport) {
  const names = {
    f1: 'Formula 1',
    wwe: 'WWE',
    cricket: 'Cricket',
  };

  return names[sport] || sport;
}


export default function ScheduleEventCard({
  event,
  starred,
  onToggleStar,
}) {
  return (
    <article className="schedule-event-card">

      <div className="schedule-event-card__meta">

        <span>
          {sportIcon(event.sport)}{' '}
          {sportName(event.sport)}
        </span>

        <button
          className={`star ${
            starred
              ? 'is-starred'
              : ''
          }`}
          onClick={() =>
            onToggleStar?.(
              event
            )
          }
          aria-label="Toggle watchlist"
        >
          {starred
            ? '★'
            : '☆'}
        </button>

      </div>


      <div className="schedule-event-card__body">

        <div className="schedule-event-card__icon">
          {sportIcon(
            event.sport
          )}
        </div>


        <div className="schedule-event-card__content">

          <strong>
            {event.title}
          </strong>


          {event.detail && (
            <p>
              {event.detail}
            </p>
          )}


          <small>
            {formatLocalDateTime(
              event.date,
              {
                weekday:
                  'short',

                month:
                  'short',

                day:
                  'numeric',
              }
            )}
          </small>

        </div>

      </div>

    </article>
  );
}