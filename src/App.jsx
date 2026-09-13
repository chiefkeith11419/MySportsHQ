import { useEffect, useMemo, useState } from 'react';

import BottomNav from './components/BottomNav.jsx';
import SportsDrawer from './components/SportsDrawer.jsx';
import TopBar from './components/TopBar.jsx';

import { SPORTS_CONFIG } from './data/config.js';
import { DEMO_F1, DEMO_FOOTBALL } from './data/demo.js';

import { useHashRoute } from './hooks/useHashRoute.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';

import ContentPage from './pages/ContentPage.jsx';
import CricketPage from './pages/CricketPage.jsx';
import CompetitionsPage from './pages/CompetitionsPage.jsx';
import F1Page from './pages/F1Page.jsx';
import FootballPage from './pages/FootballPage.jsx';
import FplPage from './pages/FplPage.jsx';
import HomePage from './pages/HomePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import WatchPage from './pages/WatchPage.jsx';
import WWEPage from './pages/WWEPage.jsx';

import {
  fetchF1Scoreboard,
  fetchSoccerScoreboards,
} from './services/espn.js';

import { fetchFplEntry } from './services/fpl.js';


/* -------------------------------------------------------
   ROUTE TITLES
------------------------------------------------------- */

const routeTitles = {
  home: ['SPORTS HQ', 'personal dashboard'],
  football: ['FOOTBALL', 'scores + watchlist'],
  f1: ['FORMULA 1', 'race weekend'],
  wwe: ['WWE', 'shows + storylines'],
  cricket: ['CRICKET', 'CPL + followed teams'],
  competitions: ['COMPETITIONS', 'major tournaments'],
  fpl: ['FANTASY', 'Roti Boys FC'],
  watch: ['WATCH', 'your schedule'],
  content: ['CONTENT HQ', 'saved takes'],
  settings: ['SETTINGS', 'local preferences'],
};


/* -------------------------------------------------------
   EVENT NORMALIZERS

   Watch should not care where data came from.
   Every provider becomes a Sports HQ event.
------------------------------------------------------- */

function normalizeFootballEvents(events = []) {
  return events.map((event) => ({
    ...event,
    sport: 'football',
  }));
}


/*
  F1 FIX

  The existing F1 service can return a current/next event
  as data.event rather than an array of events.

  This normalizer supports:
  - data.event
  - data.events
  - data.sessions

  That keeps the architecture flexible if the provider
  changes later.
*/

function normalizeF1Events(data) {
  if (!data) return [];

  /* Current / next F1 event */
  if (data.event?.date) {
    const event = data.event;

    return [
      {
        ...event,

        id:
          event.id ||
          `f1-${event.date}-${event.name || 'event'}`,

        sport: 'f1',
        type: 'schedule',

        date: event.date,

        title:
          event.name ||
          event.title ||
          'Formula 1',

        leagueName: 'Formula 1',

        status:
          event.status ||
          'scheduled',

        detail:
          event.detail ||
          event.shortDetail ||
          'Race weekend',

        followed: true,

        raw: event,
      },
    ];
  }


  /* Future support for session/event arrays */
  const sourceEvents = Array.isArray(data.events)
    ? data.events
    : Array.isArray(data.sessions)
      ? data.sessions
      : [];


  return sourceEvents
    .filter(
      (event) =>
        event?.date ||
        event?.startTime
    )
    .map((event, index) => {
      const date =
        event.date ||
        event.startTime;

      return {
        ...event,

        id:
          event.id ||
          `f1-${date}-${event.name || event.title || index}`,

        sport: 'f1',
        type: 'schedule',

        date,

        title:
          event.title ||
          event.name ||
          event.sessionName ||
          'Formula 1',

        leagueName: 'Formula 1',

        status:
          event.status ||
          'scheduled',

        detail:
          event.detail ||
          event.shortDetail ||
          event.sessionName ||
          'Race weekend',

        followed: true,
      };
    });
}


/* -------------------------------------------------------
   APP
------------------------------------------------------- */

export default function App() {
  const [route, setRoute] = useHashRoute();

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [watchlist, setWatchlist] =
    useLocalStorage(
      'sportsHQ.watchlist',
      []
    );

  const [notes, setNotes] =
    useLocalStorage(
      'sportsHQ.notes',
      []
    );

  const [fplEntryId, setFplEntryId] =
    useLocalStorage(
      'sportsHQ.fplEntryId',
      ''
    );


  /* -----------------------------------------------------
     FOOTBALL
  ----------------------------------------------------- */

  const [football, setFootball] =
    useState([]);

  const [
    footballMode,
    setFootballMode,
  ] = useState('loading');

  const [
    footballNotice,
    setFootballNotice,
  ] = useState('');


  /* -----------------------------------------------------
     FORMULA 1
  ----------------------------------------------------- */

  const [f1, setF1] =
    useState(null);

  const [
    f1Mode,
    setF1Mode,
  ] = useState('loading');

  const [
    f1Notice,
    setF1Notice,
  ] = useState('');


  /* -----------------------------------------------------
     CRICKET

     Empty until CPL data is connected.
  ----------------------------------------------------- */

  const [cricketEvents] =
    useState([]);


  /* -----------------------------------------------------
     WWE

     Empty until dated RAW / SmackDown / PLE schedule
     data is connected.
  ----------------------------------------------------- */

  const [wweEvents] =
    useState([]);


  /* -----------------------------------------------------
     FANTASY
  ----------------------------------------------------- */

  const [fpl, setFpl] =
    useState(null);

  const [
    fplMode,
    setFplMode,
  ] = useState('idle');

  const [
    fplNotice,
    setFplNotice,
  ] = useState('');


  /* -----------------------------------------------------
     LOAD FOOTBALL + F1
  ----------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;


    /* FOOTBALL */

    setFootballMode('loading');

    fetchSoccerScoreboards(
      SPORTS_CONFIG.soccerLeagues
    )
      .then(
        ({
          events,
          partialErrors,
        }) => {
          if (cancelled) return;

          setFootball(events);
          setFootballMode('live');

          setFootballNotice(
            partialErrors.length
              ? `Some leagues were unavailable: ${partialErrors.join(
                  ' · '
                )}`
              : ''
          );
        }
      )
      .catch(() => {
        if (cancelled) return;

        setFootball(
          DEMO_FOOTBALL
        );

        setFootballMode(
          'demo'
        );

        setFootballNotice(
          'The browser could not reach the free football feed. Demo data is shown so the interface remains usable.'
        );
      });


    /* FORMULA 1 */

    setF1Mode('loading');

    fetchF1Scoreboard()
      .then((data) => {
        if (cancelled) return;

        setF1(data);

        setF1Mode(
          'live'
        );

        setF1Notice('');
      })
      .catch(() => {
        if (cancelled) return;

        setF1(
          DEMO_F1
        );

        setF1Mode(
          'demo'
        );

        setF1Notice(
          'The F1 feed could not be reached. Demo data is shown.'
        );
      });


    return () => {
      cancelled = true;
    };
  }, []);


  /* -----------------------------------------------------
     LOAD FPL
  ----------------------------------------------------- */

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

    fetchFplEntry(
      fplEntryId
    )
      .then((data) => {
        if (cancelled) return;

        setFpl(data);
        setFplMode('live');
      })
      .catch((error) => {
        if (cancelled) return;

        setFpl(null);
        setFplMode('error');

        setFplNotice(
          `${error.message} If the browser blocks direct FPL requests, we can add a free GitHub Action cache next.`
        );
      });

    return () => {
      cancelled = true;
    };
  }, [fplEntryId]);


  /* -----------------------------------------------------
     WATCHLIST
  ----------------------------------------------------- */

  const toggleStar = (event) => {
    if (!event?.id) return;

    setWatchlist(
      (current) =>
        current.includes(
          event.id
        )
          ? current.filter(
              (id) =>
                id !==
                event.id
            )
          : [
              ...current,
              event.id,
            ]
    );
  };


  /* -----------------------------------------------------
     NOTES
  ----------------------------------------------------- */

  const saveNote = (note) => {
    setNotes(
      (current) => [
        ...current,
        {
          ...note,
          id: crypto.randomUUID(),
        },
      ]
    );
  };


  /* -----------------------------------------------------
     UNIFIED SPORTS HQ EVENT FEED

     Football
        +
     Formula 1
        +
     Cricket
        +
     WWE

        ↓

     Home / Watch / future calendar
  ----------------------------------------------------- */

  const footballEvents =
    useMemo(
      () =>
        normalizeFootballEvents(
          football
        ),
      [football]
    );


  const f1Events =
    useMemo(
      () =>
        normalizeF1Events(
          f1
        ),
      [f1]
    );


  const allEvents =
    useMemo(() => {
      return [
        ...footballEvents,
        ...f1Events,
        ...cricketEvents,
        ...wweEvents,
      ]
        .filter(
          (event) =>
            event?.date
        )
        .sort(
          (a, b) =>
            new Date(
              a.date
            ).getTime() -
            new Date(
              b.date
            ).getTime()
        );
    }, [
      footballEvents,
      f1Events,
      cricketEvents,
      wweEvents,
    ]);


  /* -----------------------------------------------------
     ROUTING
  ----------------------------------------------------- */

  const title =
    routeTitles[route] ||
    routeTitles.home;


  const shared = {
    watchlist,
    onToggleStar:
      toggleStar,
    onSaveNote:
      saveNote,
  };


  const page = (() => {
    switch (route) {

      case 'football':
        return (
          <FootballPage
            events={
              footballEvents
            }
            mode={
              footballMode
            }
            notice={
              footballNotice
            }
            {...shared}
          />
        );


      case 'f1':
        return (
          <F1Page
            data={f1}
            mode={f1Mode}
            notice={
              f1Notice
            }
          />
        );


      case 'wwe':
        return (
          <WWEPage
            events={
              wweEvents
            }
            {...shared}
          />
        );


      case 'cricket':
        return (
          <CricketPage
            events={
              cricketEvents
            }
            {...shared}
          />
        );


      case 'fpl':
        return (
          <FplPage
            data={fpl}
            mode={
              fplMode
            }
            notice={
              fplNotice
            }
            entryId={
              fplEntryId
            }
            onGoSettings={() =>
              setRoute(
                'settings'
              )
            }
          />
        );


      case 'watch':
        return (
          <WatchPage
            events={
              allEvents
            }
            {...shared}
          />
        );


      case 'competitions':
        return (
          <CompetitionsPage
            onNavigate={
              setRoute
            }
          />
        );


      case 'content':
        return (
          <ContentPage
            notes={notes}
            onSaveNote={
              saveNote
            }
            onDeleteNote={(
              id
            ) =>
              setNotes(
                (
                  current
                ) =>
                  current.filter(
                    (
                      note
                    ) =>
                      note.id !==
                      id
                  )
              )
            }
          />
        );


      case 'settings':
        return (
          <SettingsPage
            fplEntryId={
              fplEntryId
            }
            onSetFplEntryId={
              setFplEntryId
            }
          />
        );


      case 'home':
      default:
        return (
          <HomePage
            football={
              footballEvents
            }
            footballMode={
              footballMode
            }
            footballNotice={
              footballNotice
            }
            f1={f1}
            events={
              allEvents
            }
            onNavigate={
              setRoute
            }
            {...shared}
          />
        );
    }
  })();


  /* -----------------------------------------------------
     SHELL
  ----------------------------------------------------- */

  return (
    <div className="app-shell">
      <SportsDrawer
        open={
          drawerOpen
        }
        route={
          route
        }
        onClose={() =>
          setDrawerOpen(
            false
          )
        }
        onNavigate={
          setRoute
        }
      />

      <TopBar
        title={
          title[0]
        }
        subtitle={
          title[1]
        }
        onMenu={() =>
          setDrawerOpen(
            true
          )
        }
      />

      <main>
        {page}
      </main>

      <BottomNav
        route={
          route
        }
        onNavigate={
          setRoute
        }
      />
    </div>
  );
}