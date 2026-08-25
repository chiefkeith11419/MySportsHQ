export default function TopBar({ title, subtitle, onMenu }) {
  return (
    <header className="topbar">
      <button className="menu-button" onClick={onMenu} aria-label="Open sports menu">
        <span />
        <span />
        <span />
      </button>
      <div className="topbar__brand">
        <div className="pixel-badge">HQ</div>
        <div>
          <p className="topbar__title">{title}</p>
          {subtitle && <p className="topbar__subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="status-dot" title="Free data mode" />
    </header>
  );
}
