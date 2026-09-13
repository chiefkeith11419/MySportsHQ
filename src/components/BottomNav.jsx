const items = [
  ['home', '⌂', 'Home'],
  ['watch', '◉', 'Watch'],
  ['competitions', '🏆', 'Competitions'],
  ['settings', '⚙', 'Settings'],
];

export default function BottomNav({ route, onNavigate }) {
  return (
    <nav className="bottom-nav">
      {items.map(([key, icon, label]) => (
        <button
          key={key}
          className={route === key ? 'is-active' : ''}
          onClick={() => onNavigate(key)}
        >
          <span className="bottom-nav__icon">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}