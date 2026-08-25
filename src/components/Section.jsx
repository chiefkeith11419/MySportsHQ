export default function Section({ eyebrow, title, action, children, compact = false }) {
  return (
    <section className={`section ${compact ? 'section--compact' : ''}`}>
      <div className="section__head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h2>{title}</h2>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
