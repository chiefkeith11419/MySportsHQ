import MatchCard from './MatchCard.jsx';

export default function ClubCard({ club, event, starred, onToggleStar, onSaveNote }) {
  return (
    <div className="club-card" style={{ '--club-accent': club.accent, '--club-secondary': club.secondary }}>
      <div className="club-card__identity">
        <span className="club-mark club-mark--large">{club.mark}</span>
        <div>
          <p className="eyebrow">MY CLUB</p>
          <h3>{club.name}</h3>
        </div>
      </div>
      {event ? (
        <MatchCard event={event} starred={starred} onToggleStar={onToggleStar} onSaveNote={onSaveNote} compact />
      ) : (
        <div className="empty-inline">No fixture found in the current data window.</div>
      )}
    </div>
  );
}
