import { SPORTS_CONFIG } from '../data/config.js';

export default function SportsDrawer({ open, route, onClose, onNavigate }) {
  return (
    <>
      <button
        className={`drawer-scrim ${open ? 'is-open' : ''}`}
        aria-label="Close sports menu"
        onClick={onClose}
      />
      <aside className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="drawer__handle" />
        <h2>Sports</h2>
        <p className="drawer__sub">Your dashboard</p>

        <nav className="drawer__nav">
          {SPORTS_CONFIG.drawer.map((item) => (
            <button
              key={item.route}
              className={`drawer__item ${route === item.route ? 'is-active' : ''}`}
              onClick={() => {
                onNavigate(item.route);
                onClose();
              }}
            >
              <span className="drawer__pixel-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="drawer__divider" />
        <p className="drawer__label">Personal</p>
        {SPORTS_CONFIG.personal.clubs.map((club) => (
          <button
            key={club.key}
            className="drawer__club"
            onClick={() => {
              onNavigate('football');
              onClose();
            }}
          >
            <span className="club-mark" style={{ '--club-accent': club.accent, '--club-secondary': club.secondary }}>{club.mark}</span>
            <span>{club.name}</span>
          </button>
        ))}
      </aside>
    </>
  );
}
