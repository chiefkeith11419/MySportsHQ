import Section from '../components/Section.jsx';
import { SPORTS_CONFIG } from '../data/config.js';

export default function SettingsPage({ fplEntryId, onSetFplEntryId }) {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">LOCAL SETTINGS</p>
        <h1>Settings</h1>
        <p>No account, no subscription, no paid backend. These preferences stay on your device.</p>
      </div>

      <Section eyebrow="Priority" title="Personal clubs">
        <div className="simple-list">
          {SPORTS_CONFIG.personal.clubs.map((club) => (
            <div key={club.key}>
              <span className="club-mark" style={{ '--club-accent': club.accent, '--club-secondary': club.secondary }}>{club.mark}</span>
              <b>{club.name}</b>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Fantasy" title="FPL connection">
        <label className="field-label" htmlFor="fpl-entry">FPL entry ID</label>
        <input
          id="fpl-entry"
          className="text-input"
          inputMode="numeric"
          value={fplEntryId}
          onChange={(e) => onSetFplEntryId(e.target.value.replace(/\D/g, ''))}
          placeholder="Example: 1234567"
        />
        <p className="help-text">Saved only in this browser. The public FPL endpoint is queried directly when possible.</p>
      </Section>

      <Section eyebrow="Data" title="Free-source philosophy">
        <div className="info-card info-card--nested">
          <p>Football + F1: ESPN public-facing JSON endpoints.</p>
          <p>FPL: Fantasy Premier League public JSON endpoints.</p>
          <p>WWE: local curated data for v0.1.</p>
          <p>Every external source is isolated in <code>src/services</code> so it can be replaced later.</p>
        </div>
      </Section>
    </div>
  );
}
