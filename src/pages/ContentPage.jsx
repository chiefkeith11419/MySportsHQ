import { useState } from 'react';
import Section from '../components/Section.jsx';

export default function ContentPage({ notes, onSaveNote, onDeleteNote }) {
  const [body, setBody] = useState('');
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">CONTENT HQ</p>
        <h1>Your takes</h1>
        <p>Capture observations while you watch. They stay in this browser and can later become Threads, X, Facebook or video ideas.</p>
      </div>

      <Section eyebrow="Quick capture" title="New idea">
        <div className="content-composer">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you notice?" rows={4} />
          <button
            disabled={!body.trim()}
            onClick={() => {
              onSaveNote({ sport: 'General', event: 'Quick capture', body: body.trim(), capturedAt: new Date().toISOString() });
              setBody('');
            }}
          >Save idea</button>
        </div>
      </Section>

      <Section eyebrow="Saved" title={`${notes.length} ideas`}>
        <div className="notes-list">
          {notes.length ? [...notes].reverse().map((note) => (
            <article key={note.id}>
              <div>
                <span>{note.sport}</span>
                <b>{note.event}</b>
              </div>
              <p>{note.body}</p>
              <footer>
                <small>{new Date(note.capturedAt).toLocaleString()}</small>
                <button onClick={() => onDeleteNote(note.id)}>Delete</button>
              </footer>
            </article>
          )) : <div className="empty-state">No saved takes yet.</div>}
        </div>
      </Section>
    </div>
  );
}
