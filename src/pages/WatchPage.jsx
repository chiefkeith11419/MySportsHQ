import MatchCard from '../components/MatchCard.jsx';
import Section from '../components/Section.jsx';
import { formatLocalDateTime } from '../services/sports.js';

export default function WatchPage({ events, watchlist, onToggleStar, onSaveNote }) {
  const now = Date.now();
  const upcoming = events.filter((event) => new Date(event.date).getTime() >= now - 4 * 60 * 60 * 1000).slice(0, 30);
  const starred = upcoming.filter((event) => watchlist.includes(event.id));

  const groups = upcoming.reduce((acc, event) => {
    const key = new Date(event.date).toDateString();
    (acc[key] ||= []).push(event);
    return acc;
  }, {});

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">WEEKEND MODE</p>
        <h1>Watch</h1>
        <p>Star only the events you intend to follow. This becomes your personal weekend schedule.</p>
      </div>

      <Section eyebrow="Starred" title={`My watchlist · ${starred.length}`}>
        <div className="card-list">
          {starred.length ? starred.map((event) => (
            <MatchCard key={event.id} event={event} starred onToggleStar={onToggleStar} onSaveNote={onSaveNote} compact />
          )) : <div className="empty-state">Tap ☆ on a fixture to build your watchlist.</div>}
        </div>
      </Section>

      {Object.entries(groups).map(([day, dayEvents]) => (
        <Section key={day} eyebrow={formatLocalDateTime(dayEvents[0].date, { weekday: 'long', month: 'short', day: 'numeric', hour: undefined, minute: undefined })} title="Upcoming">
          <div className="card-list">
            {dayEvents.map((event) => (
              <MatchCard
                key={event.id}
                event={event}
                starred={watchlist.includes(event.id)}
                onToggleStar={onToggleStar}
                onSaveNote={onSaveNote}
                compact
              />
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}
