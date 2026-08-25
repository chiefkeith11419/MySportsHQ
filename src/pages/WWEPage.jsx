import Section from '../components/Section.jsx';
import { WWE_DATA } from '../data/wwe.js';

export default function WWEPage() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">PERSONAL FANDOM</p>
        <h1>WWE</h1>
        <p>Shows, PLEs and storylines are treated as narrative tracking rather than a scoreboard.</p>
      </div>

      <Section eyebrow="Next show" title={`${WWE_DATA.nextShow.show} · ${WWE_DATA.nextShow.time}`}>
        <div className="wwe-card">
          <div className="wwe-logo">W</div>
          <div>
            <h3>{WWE_DATA.nextShow.show}</h3>
            <p>{WWE_DATA.nextShow.note}</p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Tracked" title="Storylines">
        <div className="tag-grid">
          {WWE_DATA.storylines.map((story) => <span key={story}>{story}</span>)}
        </div>
      </Section>

      <Section eyebrow="Shows" title="Watching">
        <div className="simple-list">
          {WWE_DATA.trackedShows.map((show) => <div key={show}><span>◆</span><b>{show}</b></div>)}
        </div>
      </Section>
    </div>
  );
}
