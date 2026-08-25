import DataBanner from '../components/DataBanner.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Section from '../components/Section.jsx';
import { SPORTS_CONFIG } from '../data/config.js';
import { sameDay } from '../services/sports.js';

export default function FootballPage({ events, mode, notice, watchlist, onToggleStar, onSaveNote }) {
  const today = new Date();
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">SPORT</p>
        <h1>Football</h1>
        <p>Your clubs remain priority; the rest is a viewing feed, not a list of allegiances.</p>
      </div>
      <DataBanner mode={mode} message={notice} />

      {SPORTS_CONFIG.soccerLeagues.map((league) => {
        const leagueEvents = events.filter((event) => event.leagueId === league.id && sameDay(event.date, today));
        if (!leagueEvents.length) return null;
        return (
          <Section key={league.id} eyebrow={league.short} title={`${league.icon} ${league.name}`}>
            <div className="card-list">
              {leagueEvents.map((event) => (
                <MatchCard
                  key={event.id}
                  event={event}
                  starred={watchlist.includes(event.id)}
                  onToggleStar={onToggleStar}
                  onSaveNote={onSaveNote}
                />
              ))}
            </div>
          </Section>
        );
      })}

      {!events.some((event) => sameDay(event.date, today)) && (
        <div className="empty-state">No followed-league fixtures found for today. Use Watch for the upcoming schedule.</div>
      )}
    </div>
  );
}
