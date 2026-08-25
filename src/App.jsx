import { useEffect, useMemo, useState } from 'react';
import BottomNav from './components/BottomNav.jsx';
import SportsDrawer from './components/SportsDrawer.jsx';
import TopBar from './components/TopBar.jsx';
import { SPORTS_CONFIG } from './data/config.js';
import { DEMO_F1, DEMO_FOOTBALL } from './data/demo.js';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import ContentPage from './pages/ContentPage.jsx';
import F1Page from './pages/F1Page.jsx';
import FootballPage from './pages/FootballPage.jsx';
import FplPage from './pages/FplPage.jsx';
import HomePage from './pages/HomePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import WatchPage from './pages/WatchPage.jsx';
import WWEPage from './pages/WWEPage.jsx';
import { fetchF1Scoreboard, fetchSoccerScoreboards } from './services/espn.js';
import { fetchFplEntry } from './services/fpl.js';

const routeTitles = {
  home: ['SPORTS HQ', 'personal dashboard'],
  football: ['FOOTBALL', 'scores + watchlist'],
  f1: ['FORMULA 1', 'race weekend'],
  wwe: ['WWE', 'shows + storylines'],
  fpl: ['FANTASY PL', 'Roti Boys FC'],
  watch: ['WATCH', 'your schedule'],
  content: ['CONTENT HQ', 'saved takes'],
  settings: ['SETTINGS', 'local preferences'],
};

export default function App() {
  const [route, setRoute] = useHashRoute();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [watchlist, setWatchlist] = useLocalStorage('sportsHQ.watchlist', []);
  const [notes, setNotes] = useLocalStorage('sportsHQ.notes', []);
  const [fplEntryId, setFplEntryId] = useLocalStorage('sportsHQ.fplEntryId', '');

  const [football, setFootball] = useState([]);
  const [footballMode, setFootballMode] = useState('loading');
  const [footballNotice, setFootballNotice] = useState('');
  const [f1, setF1] = useState(null);
  const [f1Mode, setF1Mode] = useState('loading');
  const [f1Notice, setF1Notice] = useState('');
  const [fpl, setFpl] = useState(null);
  const [fplMode, setFplMode] = useState('idle');
  const [fplNotice, setFplNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    setFootballMode('loading');
    fetchSoccerScoreboards(SPORTS_CONFIG.soccerLeagues)
      .then(({ events, partialErrors }) => {
        if (cancelled) return;
        setFootball(events);
        setFootballMode('live');
        setFootballNotice(partialErrors.length ? `Some leagues were unavailable: ${partialErrors.join(' · ')}` : '');
      })
      .catch(() => {
        if (cancelled) return;
        setFootball(DEMO_FOOTBALL);
        setFootballMode('demo');
        setFootballNotice('The browser could not reach the free football feed. Demo data is shown so the interface remains usable.');
      });

    setF1Mode('loading');
    fetchF1Scoreboard()
      .then((data) => {
        if (cancelled) return;
        setF1(data);
        setF1Mode('live');
      })
      .catch(() => {
        if (cancelled) return;
        setF1(DEMO_F1);
        setF1Mode('demo');
        setF1Notice('The F1 feed could not be reached. Demo data is shown.');
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!fplEntryId) {
      setFpl(null);
      setFplMode('idle');
      setFplNotice('');
      return undefined;
    }
    setFplMode('loading');
    setFplNotice('');
    fetchFplEntry(fplEntryId)
      .then((data) => {
        if (cancelled) return;
        setFpl(data);
        setFplMode('live');
      })
      .catch((error) => {
        if (cancelled) return;
        setFpl(null);
        setFplMode('error');
        setFplNotice(`${error.message} If the browser blocks direct FPL requests, we can add a free GitHub Action cache next.`);
      });
    return () => { cancelled = true; };
  }, [fplEntryId]);

  const toggleStar = (event) => {
    if (!event?.id) return;
    setWatchlist((current) => current.includes(event.id)
      ? current.filter((id) => id !== event.id)
      : [...current, event.id]);
  };

  const saveNote = (note) => {
    setNotes((current) => [...current, { ...note, id: crypto.randomUUID() }]);
  };

  const title = routeTitles[route] || routeTitles.home;

  const page = useMemo(() => {
    const shared = { watchlist, onToggleStar: toggleStar, onSaveNote: saveNote };
    switch (route) {
      case 'football':
        return <FootballPage events={football} mode={footballMode} notice={footballNotice} {...shared} />;
      case 'f1':
        return <F1Page data={f1} mode={f1Mode} notice={f1Notice} />;
      case 'wwe':
        return <WWEPage />;
      case 'fpl':
        return <FplPage data={fpl} mode={fplMode} notice={fplNotice} entryId={fplEntryId} onGoSettings={() => setRoute('settings')} />;
      case 'watch':
        return <WatchPage events={football} {...shared} />;
      case 'content':
        return <ContentPage notes={notes} onSaveNote={saveNote} onDeleteNote={(id) => setNotes((current) => current.filter((n) => n.id !== id))} />;
      case 'settings':
        return <SettingsPage fplEntryId={fplEntryId} onSetFplEntryId={setFplEntryId} />;
      case 'home':
      default:
        return (
          <HomePage
            football={football}
            footballMode={footballMode}
            footballNotice={footballNotice}
            f1={f1}
            onNavigate={setRoute}
            {...shared}
          />
        );
    }
  }, [route, football, footballMode, footballNotice, f1, f1Mode, f1Notice, fpl, fplMode, fplNotice, fplEntryId, watchlist, notes]);

  return (
    <div className="app-shell">
      <SportsDrawer open={drawerOpen} route={route} onClose={() => setDrawerOpen(false)} onNavigate={setRoute} />
      <TopBar title={title[0]} subtitle={title[1]} onMenu={() => setDrawerOpen(true)} />
      <main>{page}</main>
      <BottomNav route={route} onNavigate={setRoute} />
    </div>
  );
}
