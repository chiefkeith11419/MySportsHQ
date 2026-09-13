import DataBanner from '../components/DataBanner.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Section from '../components/Section.jsx';
import { SPORTS_CONFIG } from '../data/config.js';
import { sameDay } from '../services/sports.js';

export default function FootballPage({
  events,
  mode,
  notice,
  watchlist,
  onToggleStar,
  onSaveNote,
}) {
  const now = new Date();

  // Barcelona + NYCFC + every team in Following
  const priorityTeams = [
    ...SPORTS_CONFIG.personal.clubs,
    ...(SPORTS_CONFIG.following?.clubs || []),
  ];

  // Keep today's games plus anything scheduled in the future.
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date);

      return (
        sameDay(event.date, now) ||
        eventDate.getTime() > now.getTime()
      );
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Matches involving any team you follow.
  // Using filter instead of one find() means we show ALL of their upcoming games.
  const followingEvents = upcomingEvents.filter((event) =>
    priorityTeams.some((club) =>
      club.aliases.some((alias) =>
        event.home?.name?.toLowerCase().includes(alias.toLowerCase()) ||
        event.away?.name?.toLowerCase().includes(alias.toLowerCase())
      )
    )
  );

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">SPORT</p>
        <h1>Football</h1>
        <p>
          Your clubs and followed teams first, followed by the upcoming
          schedule grouped by competition.
        </p>
      </div>

      <DataBanner mode={mode} message={notice} />

      <Section
        eyebrow="FOLLOWING"
        title={`Your Matches${followingEvents.length ? ` · ${followingEvents.length}` : ''}`}
      >
        {followingEvents.length ? (
          <div className="card-list">
            {followingEvents.map((event) => (
              <MatchCard
                key={`following-${event.id}`}
                event={event}
                starred={watchlist.includes(event.id)}
                onToggleStar={onToggleStar}
                onSaveNote={onSaveNote}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No upcoming matches found for your followed teams.
          </div>
        )}
      </Section>

      {SPORTS_CONFIG.soccerLeagues.map((league) => {
        const leagueEvents = upcomingEvents.filter(
          (event) => event.leagueId === league.id
        );

        if (!leagueEvents.length) return null;

        return (
          <Section
            key={league.id}
            eyebrow={league.short}
            title={`${league.icon} ${league.name} · ${leagueEvents.length}`}
          >
            <div className="card-list">
              {leagueEvents.map((event) => (
                <MatchCard
                  key={`${league.id}-${event.id}`}
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

      {!upcomingEvents.length && (
        <div className="empty-state">
          No upcoming football fixtures found in the current data window.
        </div>
      )}
    </div>
  );
}