import ClubCard from '../components/ClubCard.jsx';
import DataBanner from '../components/DataBanner.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Section from '../components/Section.jsx';
import { SPORTS_CONFIG } from '../data/config.js';
import { getClubEvent, sameDay } from '../services/sports.js';

export default function HomePage({
  football,
  footballMode,
  footballNotice,
  f1,
  watchlist,
  onToggleStar,
  onSaveNote,
  onNavigate,
}) {
  const today = new Date();

  // All football matches taking place today.
  const todayEvents = football.filter((event) =>
    sameDay(event.date, today)
  );

  // Barcelona + NYCFC remain the highest-priority clubs.
  const clubEvents = SPORTS_CONFIG.personal.clubs.map((club) => ({
    club,
    event: getClubEvent(football, club),
  }));

  // IDs belonging to the personal-club cards.
  const personalIds = new Set(
    clubEvents
      .map(({ event }) => event?.id)
      .filter(Boolean)
  );

  // Additional teams being followed.
  const followedClubs = SPORTS_CONFIG.following?.clubs || [];

  // Today's matches involving any followed team.
  const followedToday = todayEvents.filter((event) =>
    followedClubs.some((club) =>
      club.aliases.some((alias) => {
        const normalizedAlias = alias.toLowerCase();

        const homeName =
          event.home?.name?.toLowerCase() || '';

        const awayName =
          event.away?.name?.toLowerCase() || '';

        return (
          homeName.includes(normalizedAlias) ||
          awayName.includes(normalizedAlias)
        );
      })
    )
  );

  // Prevent followed matches from appearing again
  // in the general Today section.
  const followedIds = new Set(
    followedToday.map((event) => event.id)
  );

  // Other matches happening today from the leagues
  // Sports HQ currently tracks.
  const generalToday = todayEvents
    .filter(
      (event) =>
        !personalIds.has(event.id) &&
        !followedIds.has(event.id)
    )
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    )
    .slice(0, 6);

  return (
    <div className="page-stack">
      <div className="hero-copy">
        <p className="eyebrow">
          PERSONAL SPORTS DASHBOARD
        </p>

        <h1>What matters now.</h1>

        <p>
          Your clubs first, followed teams playing today,
          then the rest of the sports you are tracking.
        </p>
      </div>

      <DataBanner
        mode={footballMode}
        message={footballNotice}
      />

      {/* PERSONAL CLUBS */}
      <Section
        eyebrow="PRIORITY"
        title="My Clubs"
      >
        <div className="club-grid">
          {clubEvents.map(({ club, event }) => (
            <ClubCard
              key={club.key}
              club={club}
              event={event}
              starred={
                event
                  ? watchlist.includes(event.id)
                  : false
              }
              onToggleStar={onToggleStar}
              onSaveNote={onSaveNote}
            />
          ))}
        </div>
      </Section>

      {/* FOLLOWED TEAMS PLAYING TODAY */}
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
            onClick={() => onNavigate('football')}
          >
            Open football →
          </button>
        }
      >
        <div className="card-list">
          {followedToday.length ? (
            followedToday
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() -
                  new Date(b.date).getTime()
              )
              .map((event) => (
                <MatchCard
                  key={`followed-today-${event.id}`}
                  event={event}
                  starred={watchlist.includes(
                    event.id
                  )}
                  onToggleStar={onToggleStar}
                  onSaveNote={onSaveNote}
                />
              ))
          ) : (
            <div className="empty-state">
              None of your followed football teams
              play today.
            </div>
          )}
        </div>
      </Section>

      {/* OTHER FOOTBALL MATCHES TODAY */}
      <Section
        eyebrow="TODAY"
        title="Other Matches"
        action={
          <button
            className="section-link"
            onClick={() => onNavigate('watch')}
          >
            Open Watch →
          </button>
        }
      >
        <div className="card-list">
          {generalToday.length ? (
            generalToday.map((event) => (
              <MatchCard
                key={`today-${event.id}`}
                event={event}
                starred={watchlist.includes(event.id)}
                onToggleStar={onToggleStar}
                onSaveNote={onSaveNote}
              />
            ))
          ) : (
            <div className="empty-state">
              No additional football matches found
              today.
            </div>
          )}
        </div>
      </Section>

      {/* FORMULA 1 */}
      <Section
        eyebrow="MOTORSPORT"
        title="Formula 1"
      >
        <button
          className="feature-card f1-feature"
          onClick={() => onNavigate('f1')}
        >
          <div>
            <span className="feature-icon">
              🏎️
            </span>

            <p className="eyebrow">
              NEXT / CURRENT EVENT
            </p>

            <h3>
              {f1?.event?.name || 'Formula 1'}
            </h3>

            <p>
              {f1?.event?.detail ||
                'Open the F1 dashboard'}
            </p>
          </div>

          <span className="feature-arrow">
            →
          </span>
        </button>
      </Section>

      {/* QUICK ACCESS */}
      <div className="split-grid">
        <button
          className="mini-feature wwe-feature"
          onClick={() => onNavigate('wwe')}
        >
          <span>🤼</span>
          <b>WWE</b>
          <small>
            Raw, SmackDown + PLEs
          </small>
        </button>

        <button
          className="mini-feature fpl-feature"
          onClick={() => onNavigate('fpl')}
        >
          <span>🟣</span>
          <b>Roti Boys FC</b>
          <small>Fantasy HQ</small>
        </button>
      </div>
    </div>
  );
}