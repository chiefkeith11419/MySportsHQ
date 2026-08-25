import ClubCard from '../components/ClubCard.jsx';
import DataBanner from '../components/DataBanner.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Section from '../components/Section.jsx';
import { SPORTS_CONFIG } from '../data/config.js';
import { getClubEvent, sameDay } from '../services/sports.js';

export default function HomePage({ football, footballMode, footballNotice, f1, watchlist, onToggleStar, onSaveNote, onNavigate }) {
  const today = new Date();
  const todayEvents = football.filter((event) => sameDay(event.date, today));
  const clubEvents = SPORTS_CONFIG.personal.clubs.map((club) => ({ club, event: getClubEvent(football, club) }));
  const personalIds = new Set(clubEvents.map(({ event }) => event?.id).filter(Boolean));
  const generalToday = todayEvents.filter((event) => !personalIds.has(event.id)).slice(0, 6);

  return (
    <div className="page-stack">
      <div className="hero-copy">
        <p className="eyebrow">PERSONAL SPORTS DASHBOARD</p>
        <h1>What matters now.</h1>
        <p>Clubs first. Then the sports and matches you actually choose to watch.</p>
      </div>

      <DataBanner mode={footballMode} message={footballNotice} />

      <Section eyebrow="Priority" title="My clubs">
        <div className="club-grid">
          {clubEvents.map(({ club, event }) => (
            <ClubCard
              key={club.key}
              club={club}
              event={event}
              starred={watchlist.includes(event?.id)}
              onToggleStar={onToggleStar}
              onSaveNote={onSaveNote}
            />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Today"
        title="Watching"
        action={<button className="section-link" onClick={() => onNavigate('watch')}>Open watchlist →</button>}
      >
        <div className="card-list">
          {generalToday.length ? generalToday.map((event) => (
            <MatchCard
              key={event.id}
              event={event}
              starred={watchlist.includes(event.id)}
              onToggleStar={onToggleStar}
              onSaveNote={onSaveNote}
            />
          )) : <div className="empty-state">No additional followed-league matches found today.</div>}
        </div>
      </Section>

      <Section eyebrow="Motorsport" title="Formula 1">
        <button className="feature-card f1-feature" onClick={() => onNavigate('f1')}>
          <div>
            <span className="feature-icon">🏎️</span>
            <p className="eyebrow">NEXT / CURRENT EVENT</p>
            <h3>{f1?.event?.name || 'Formula 1'}</h3>
            <p>{f1?.event?.detail || 'Open the F1 dashboard'}</p>
          </div>
          <span className="feature-arrow">→</span>
        </button>
      </Section>

      <div className="split-grid">
        <button className="mini-feature wwe-feature" onClick={() => onNavigate('wwe')}>
          <span>🤼</span><b>WWE</b><small>Storylines + shows</small>
        </button>
        <button className="mini-feature fpl-feature" onClick={() => onNavigate('fpl')}>
          <span>🟣</span><b>Roti Boys FC</b><small>Fantasy PL</small>
        </button>
      </div>
    </div>
  );
}
