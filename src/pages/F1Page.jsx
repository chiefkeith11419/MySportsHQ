import DataBanner from '../components/DataBanner.jsx';
import Section from '../components/Section.jsx';
import { formatLocalDateTime } from '../services/sports.js';

export default function F1Page({ data, mode, notice }) {
  const event = data?.event;
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">SPORT</p>
        <h1>Formula 1</h1>
        <p>A separate F1-shaped dashboard rather than forcing racing into football cards.</p>
      </div>
      <DataBanner mode={mode} message={notice} />

      <Section eyebrow="Next / current" title={event?.name || 'Formula 1'}>
        <div className="f1-board">
          <div className="f1-board__date">
            <span>🏁</span>
            <div>
              <b>{event?.detail || 'Race weekend'}</b>
              <small>{event?.date ? formatLocalDateTime(event.date, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Schedule unavailable'}</small>
            </div>
          </div>

          <div className="f1-podium">
            {(event?.podium?.length ? event.podium : [
              { place: 1, name: 'Results appear here' },
              { place: 2, name: 'when available' },
              { place: 3, name: 'from the feed' },
            ]).map((driver) => (
              <div key={`${driver.place}-${driver.name}`}>
                <span>{driver.place}</span>
                <b>{driver.name}</b>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <div className="info-card">
        <p className="eyebrow">V0.1</p>
        <h3>Next F1 additions</h3>
        <p>Session times, driver standings, constructors, and a race-weekend timeline can be added without changing the navigation.</p>
      </div>
    </div>
  );
}
