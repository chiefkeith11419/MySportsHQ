export default function TeamIdentity({ team, align = 'left' }) {
  return (
    <div className={`team team--${align}`}>
      {team?.logo ? (
        <img className="team__logo" src={team.logo} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <div className="team__fallback">{team?.short?.slice(0, 3) || 'TBD'}</div>
      )}
      <div className="team__text">
        <strong>{team?.name || 'TBD'}</strong>
        <span>{team?.short || ''}</span>
      </div>
    </div>
  );
}
