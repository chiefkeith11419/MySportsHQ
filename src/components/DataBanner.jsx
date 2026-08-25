export default function DataBanner({ mode, message }) {
  if (!message && mode !== 'demo') return null;
  return (
    <div className={`data-banner ${mode === 'demo' ? 'is-demo' : ''}`}>
      <strong>{mode === 'demo' ? 'Demo fallback active' : 'Data notice'}</strong>
      <span>{message || 'The live provider could not be reached, so the interface is showing clearly labeled demo data.'}</span>
    </div>
  );
}
