import DataBanner from '../components/DataBanner.jsx';
import Section from '../components/Section.jsx';

export default function FplPage({ data, mode, notice, entryId, onGoSettings }) {
  const entry = data?.entry;
  const latest = data?.picks?.entry_history;
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">FANTASY</p>
        <h1>Roti Boys FC</h1>
        <p>Your FPL subplot gets its own space instead of being mixed into the football score feed.</p>
      </div>
      <DataBanner mode={mode} message={notice} />

      {!entryId ? (
        <div className="empty-state">
          Add your FPL entry ID in Settings to connect this page.
          <button onClick={onGoSettings}>Open Settings</button>
        </div>
      ) : (
        <Section eyebrow="Current" title={entry?.name || 'Fantasy Premier League'}>
          <div className="stat-grid">
            <div><span>GW points</span><b>{latest?.points ?? '—'}</b></div>
            <div><span>Total</span><b>{entry?.summary_overall_points ?? '—'}</b></div>
            <div><span>Overall rank</span><b>{entry?.summary_overall_rank?.toLocaleString?.() ?? '—'}</b></div>
            <div><span>Entry ID</span><b>{entryId}</b></div>
          </div>
        </Section>
      )}
    </div>
  );
}
