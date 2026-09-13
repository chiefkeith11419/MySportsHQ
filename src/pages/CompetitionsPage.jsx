export default function CompetitionsPage({ onNavigate }) {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">HUB</p>
        <h1>Competitions</h1>
        <p>
          Major competitions across the sports you follow.
        </p>
      </div>

      <section>
        <p className="eyebrow">FOOTBALL</p>

        <div className="card-list">
          <button
            className="feature-card"
            onClick={() => onNavigate('champions-league')}
          >
            <div>
              <span className="feature-icon">🏆</span>
              <h3>Champions League</h3>
              <p>Fixtures, table, Barcelona, fantasy and conversation.</p>
            </div>
            <span className="feature-arrow">→</span>
          </button>

          <button
            className="feature-card"
            onClick={() => onNavigate('europa-league')}
          >
            <div>
              <span className="feature-icon">🏆</span>
              <h3>Europa League</h3>
              <p>Fixtures, results and knockout progress.</p>
            </div>
            <span className="feature-arrow">→</span>
          </button>
        </div>
      </section>

      <section>
        <p className="eyebrow">CRICKET</p>

        <div className="card-list">
          <button
            className="feature-card"
            onClick={() => onNavigate('cpl')}
          >
            <div>
              <span className="feature-icon">🏏</span>
              <h3>Caribbean Premier League</h3>
              <p>TKR, St Lucia Kings, fixtures, results and standings.</p>
            </div>
            <span className="feature-arrow">→</span>
          </button>
        </div>
      </section>

      <section>
        <p className="eyebrow">FANTASY</p>

        <div className="card-list">
          <button
            className="feature-card"
            onClick={() => onNavigate('fpl')}
          >
            <div>
              <span className="feature-icon">🎮</span>
              <h3>Premier League Fantasy</h3>
              <p>Roti Boys FC.</p>
            </div>
            <span className="feature-arrow">→</span>
          </button>

          <button
            className="feature-card"
            onClick={() => onNavigate('ucl-fantasy')}
          >
            <div>
              <span className="feature-icon">🏆</span>
              <h3>Champions League Fantasy</h3>
              <p>Your UEFA Champions League fantasy team.</p>
            </div>
            <span className="feature-arrow">→</span>
          </button>
        </div>
      </section>
    </div>
  );
}