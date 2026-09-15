import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import BottomNav from './components/BottomNav.jsx';
import SportsDrawer from './components/SportsDrawer.jsx';
import TopBar from './components/TopBar.jsx';

import {
  SPORTS_CONFIG,
} from './data/config.js';

import {
  DEMO_F1,
  DEMO_FOOTBALL,
} from './data/demo.js';

import {
  useHashRoute,
} from './hooks/useHashRoute.js';

import {
  useLocalStorage,
} from './hooks/useLocalStorage.js';

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
} from './services/espn.js';

import {
  fetchFootballScoreboards,
  normalizeFootballLeagues,
  fromLegacyFootballEvents,
} from './services/football/index.js';

import {
  fetchFplEntry,
} from './services/fpl.js';


/* -------------------------------------------------------
   ROUTE TITLES
------------------------------------------------------- */

const routeTitles = {
  home: [
    'SPORTS HQ',
    'personal dashboard',
  ],

  football: [
    'FOOTBALL',
    'scores + watchlist',
  ],

  f1: [
    'FORMULA 1',
    'race weekend',
  ],

  wwe: [
    'WWE',
    'shows + storylines',
  ],

  cricket: [
    'CRICKET',
    'CPL + followed teams',
  ],

  competitions: [
    'COMPETITIONS',
    'major tournaments',
  ],

  fpl: [
    'FANTASY',
    'Roti Boys FC',
  ],

  watch: [
    'WATCH',
    'your schedule',
  ],

  content: [
    'CONTENT HQ',
    'saved takes',
  ],

  settings: [
    'SETTINGS',
    'local preferences',
  ],
};


/* -------------------------------------------------------
   TEMPORARY F1 → WATCH NORMALIZER

   Football is already on the universal v0.3 model.

   F1 will move to the same model during the F1 overhaul.
------------------------------------------------------- */

function normalizeF1Events(
  data
) {
  if (!data) {
    return [];
  }


  /*
    Current / next F1 weekend.
  */

  if (
    data.event?.date
  ) {
    const event =
      data.event;


    return [
      {
        ...event,

        id:
          event.id ||
          `f1-${event.date}-${event.name || 'event'}`,

        sport:
          'f1',

        type:
          'schedule',

        date:
          event.date,

        title:
          event.name ||
          event.title ||
          'Formula 1',

        leagueName:
          'Formula 1',

        status:
          event.status ||
          'scheduled',

        detail:
          event.detail ||
          event.shortDetail ||
          event.nextSession?.name ||
          'Race weekend',

        followed:
          true,

        raw:
          event,
      },
    ];
  }


  /*
    Future support for individual sessions.
  */

  const sourceEvents =
    Array.isArray(
      data.events
    )
      ? data.events
      : Array.isArray(
          data.sessions
        )
        ? data.sessions
        : [];


  return sourceEvents
    .filter(
      (event) =>
        event?.date ||
        event?.startTime
    )
    .map(
      (
        event,
        index
      ) => {
        const date =
          event.date ||
          event.startTime;


        return {
          ...event,

          id:
            event.id ||
            `f1-${date}-${event.name || event.title || index}`,

          sport:
            'f1',

          type:
            'schedule',

          date,

          title:
            event.title ||
            event.name ||
            event.sessionName ||
            'Formula 1',

          leagueName:
            'Formula 1',

          status:
            event.status ||
            'scheduled',

          detail:
            event.detail ||
            event.shortDetail ||
            event.sessionName ||
            'Race weekend',

          followed:
            true,
        };
      }
    );
}


/* -------------------------------------------------------
   APP
------------------------------------------------------- */

export default function App() {
  const [
    route,
    setRoute,
  ] = useHashRoute();


  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);


  const [
    watchlist,
    setWatchlist,
  ] = useLocalStorage(
    'sportsHQ.watchlist',
    []
  );


  const [
    notes,
    setNotes,
  ] = useLocalStorage(
    'sportsHQ.notes',
    []
  );


  const [
    fplEntryId,
    setFplEntryId,
  ] = useLocalStorage(
    'sportsHQ.fplEntryId',
    ''
  );


  /* -----------------------------------------------------
     FOOTBALL v0.3
  ----------------------------------------------------- */

  const [
    footballV3,
    setFootballV3,
  ] = useState([]);


  const [
    footballFallback,
    setFootballFallback,
  ] = useState(null);


  const [
    footballMode,
    setFootballMode,
  ] = useState(
    'loading'
  );


  const [
    footballNotice,
    setFootballNotice,
  ] = useState(
    ''
  );


  /* -----------------------------------------------------
     FORMULA 1
  ----------------------------------------------------- */

  const [
    f1,
    setF1,
  ] = useState(null);


  const [
    f1Mode,
    setF1Mode,
  ] = useState(
    'loading'
  );


  const [
    f1Notice,
    setF1Notice,
  ] = useState(
    ''
  );


  /* -----------------------------------------------------
     CRICKET

     Will move to the universal model during the
     Cricket v0.3 phase.
  ----------------------------------------------------- */

  const [
    cricketEvents,
  ] = useState([]);


  /* -----------------------------------------------------
     WWE

     Will move to the universal model during the
     WWE v0.3 phase.
  ----------------------------------------------------- */

  const [
    wweEvents,
  ] = useState([]);


  /* -----------------------------------------------------
     FANTASY
  ----------------------------------------------------- */

  const [
    fpl,
    setFpl,
  ] = useState(null);


  const [
    fplMode,
    setFplMode,
  ] = useState(
    'idle'
  );


  const [
    fplNotice,
    setFplNotice,
  ] = useState(
    ''
  );


  /* -----------------------------------------------------
     LOAD FOOTBALL v0.3
  ----------------------------------------------------- */

  useEffect(() => {
    let cancelled =
      false;


    setFootballMode(
      'loading'
    );

    setFootballNotice(
      ''
    );


    fetchFootballScoreboards(
      SPORTS_CONFIG.soccerLeagues
    )
      .then(
        (
          providerResult
        ) => {
          if (
            cancelled
          ) {
            return;
          }


          const normalized =
            normalizeFootballLeagues(
              providerResult
            );


          if (
            !normalized.length
          ) {
            throw new Error(
              'No football events were returned.'
            );
          }


          setFootballV3(
            normalized
          );


          setFootballFallback(
            null
          );


          setFootballMode(
            'live'
          );


          const messages =
            [];


          /* -------------------------------------------
             PARTIAL PROVIDER FAILURE
          ------------------------------------------- */

          if (
            providerResult.errors
              ?.length
          ) {
            const unavailable =
              providerResult.errors
                .map(
                  (item) =>
                    item.leagueName
                )
                .join(
                  ' · '
                );


            messages.push(
              `Some leagues were unavailable: ${unavailable}.`
            );
          }


          /* -------------------------------------------
             STALE CACHE
          ------------------------------------------- */

          const staleLeagues =
            providerResult.leagues
              ?.filter(
                (item) =>
                  item.result
                    ?.meta
                    ?.stale
              ) ||
            [];


          if (
            staleLeagues.length
          ) {
            const names =
              staleLeagues
                .map(
                  (item) =>
                    item.league
                      .name
                )
                .join(
                  ' · '
                );


            messages.push(
              `Using last-known data for ${names}.`
            );
          }


          /* -------------------------------------------
             FRESH CACHE
          ------------------------------------------- */

          const cachedLeagues =
            providerResult.leagues
              ?.filter(
                (item) =>
                  item.result
                    ?.meta
                    ?.mode ===
                  'cache'
              ) ||
            [];


          if (
            cachedLeagues.length &&
            cachedLeagues.length ===
              providerResult
                .leagues
                .length
          ) {
            messages.push(
              'Football data loaded from the local Sports HQ cache.'
            );
          }


          setFootballNotice(
            messages.join(
              ' '
            )
          );
        }
      )
      .catch(
        (
          error
        ) => {
          if (
            cancelled
          ) {
            return;
          }


          console.error(
            '[Sports HQ Football]',
            error
          );


          setFootballV3(
            []
          );


          setFootballFallback(
            DEMO_FOOTBALL
          );


          setFootballMode(
            'demo'
          );


          setFootballNotice(
            'Football data could not be reached. Demo data is shown so Sports HQ remains usable.'
          );
        }
      );


    return () => {
      cancelled =
        true;
    };
  }, []);


  /* -----------------------------------------------------
     LOAD FORMULA 1

     Existing provider remains until F1 v0.3 overhaul.
  ----------------------------------------------------- */

  useEffect(() => {
    let cancelled =
      false;


    setF1Mode(
      'loading'
    );


    fetchF1Scoreboard()
      .then(
        (
          data
        ) => {
          if (
            cancelled
          ) {
            return;
          }


          setF1(
            data
          );


          setF1Mode(
            'live'
          );


          setF1Notice(
            ''
          );
        }
      )
      .catch(
        (
          error
        ) => {
          if (
            cancelled
          ) {
            return;
          }


          console.error(
            '[Sports HQ F1]',
            error
          );


          setF1(
            DEMO_F1
          );


          setF1Mode(
            'demo'
          );


          setF1Notice(
            'The F1 feed could not be reached. Demo data is shown.'
          );
        }
      );


    return () => {
      cancelled =
        true;
    };
  }, []);


  /* -----------------------------------------------------
     LOAD FPL
  ----------------------------------------------------- */

  useEffect(() => {
    let cancelled =
      false;


    if (
      !fplEntryId
    ) {
      setFpl(
        null
      );

      setFplMode(
        'idle'
      );

      setFplNotice(
        ''
      );

      return undefined;
    }


    setFplMode(
      'loading'
    );

    setFplNotice(
      ''
    );


    fetchFplEntry(
      fplEntryId
    )
      .then(
        (
          data
        ) => {
          if (
            cancelled
          ) {
            return;
          }


          setFpl(
            data
          );


          setFplMode(
            'live'
          );
        }
      )
      .catch(
        (
          error
        ) => {
          if (
            cancelled
          ) {
            return;
          }


          setFpl(
            null
          );


          setFplMode(
            'error'
          );


          setFplNotice(
            `${error.message} Sports HQ will move FPL through the cached data layer during the Fantasy overhaul.`
          );
        }
      );


    return () => {
      cancelled =
        true;
    };
  }, [
    fplEntryId,
  ]);


  /* -----------------------------------------------------
     UNIVERSAL FOOTBALL FEED

     Normal network data is already universal.

     Demo fallback is converted from the old demo format
     into the universal Sports HQ event model.
  ----------------------------------------------------- */

  const footballUniversalEvents =
    useMemo(
      () => {
        if (
          footballV3.length
        ) {
          return footballV3;
        }


        if (
          footballFallback
        ) {
          return fromLegacyFootballEvents(
            footballFallback
          );
        }


        return [];
      },
      [
        footballV3,
        footballFallback,
      ]
    );


  /* -----------------------------------------------------
     TEMPORARY F1 WATCH EVENTS
  ----------------------------------------------------- */

  const f1Events =
    useMemo(
      () =>
        normalizeF1Events(
          f1
        ),
      [
        f1,
      ]
    );


  /* -----------------------------------------------------
     SPORTS HQ WATCH FEED

     Football is universal.

     F1 / Cricket / WWE will be converted fully during
     their individual v0.3 migrations.

     WatchPage supports both startTime and date during
     this transition.
  ----------------------------------------------------- */

  const allEvents =
    useMemo(
      () =>
        [
          ...footballUniversalEvents,

          ...f1Events,

          ...cricketEvents,

          ...wweEvents,
        ]
          .filter(
            (event) =>
              event?.startTime ||
              event?.date
          )
          .sort(
            (
              first,
              second
            ) => {
              const firstDate =
                first.startTime ||
                first.date;


              const secondDate =
                second.startTime ||
                second.date;


              return (
                new Date(
                  firstDate
                ).getTime() -
                new Date(
                  secondDate
                ).getTime()
              );
            }
          ),
      [
        footballUniversalEvents,
        f1Events,
        cricketEvents,
        wweEvents,
      ]
    );


  /* -----------------------------------------------------
     WATCHLIST
  ----------------------------------------------------- */

  const toggleStar =
    (
      event
    ) => {
      /*
        Universal provider events use Sports HQ IDs.

        Existing saved watchlist entries use provider IDs,
        so use providerId when available.
      */

      const id =
        event?.source
          ?.providerId ||
        event?.id;


      if (
        !id
      ) {
        return;
      }


      setWatchlist(
        (
          current
        ) =>
          current.includes(
            id
          )
            ? current.filter(
                (
                  savedId
                ) =>
                  savedId !==
                  id
              )
            : [
                ...current,
                id,
              ]
      );
    };


  /* -----------------------------------------------------
     NOTES
  ----------------------------------------------------- */

  const saveNote =
    (
      note
    ) => {
      setNotes(
        (
          current
        ) => [
          ...current,

          {
            ...note,

            id:
              crypto.randomUUID(),
          },
        ]
      );
    };


  /* -----------------------------------------------------
     ROUTING
  ----------------------------------------------------- */

  const title =
    routeTitles[
      route
    ] ||
    routeTitles.home;


  const shared = {
    watchlist,

    onToggleStar:
      toggleStar,

    onSaveNote:
      saveNote,
  };


  const page = (() => {
    switch (
      route
    ) {

      /* -------------------------------------------------
         FOOTBALL
      ------------------------------------------------- */

      case 'football':
        return (
          <FootballPage
            events={
              footballUniversalEvents
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


      /* -------------------------------------------------
         FORMULA 1
      ------------------------------------------------- */

      case 'f1':
        return (
          <F1Page
            data={
              f1
            }

            mode={
              f1Mode
            }

            notice={
              f1Notice
            }
          />
        );


      /* -------------------------------------------------
         WWE
      ------------------------------------------------- */

      case 'wwe':
        return (
          <WWEPage
            events={
              wweEvents
            }

            {...shared}
          />
        );


      /* -------------------------------------------------
         CRICKET
      ------------------------------------------------- */

      case 'cricket':
        return (
          <CricketPage
            events={
              cricketEvents
            }

            {...shared}
          />
        );


      /* -------------------------------------------------
         FANTASY
      ------------------------------------------------- */

      case 'fpl':
        return (
          <FplPage
            data={
              fpl
            }

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


      /* -------------------------------------------------
         WATCH
      ------------------------------------------------- */

      case 'watch':
        return (
          <WatchPage
            events={
              allEvents
            }

            {...shared}
          />
        );


      /* -------------------------------------------------
         COMPETITIONS
      ------------------------------------------------- */

      case 'competitions':
        return (
          <CompetitionsPage
            onNavigate={
              setRoute
            }
          />
        );


      /* -------------------------------------------------
         CONTENT
      ------------------------------------------------- */

      case 'content':
        return (
          <ContentPage
            notes={
              notes
            }

            onSaveNote={
              saveNote
            }

            onDeleteNote={
              (
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


      /* -------------------------------------------------
         SETTINGS
      ------------------------------------------------- */

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


      /* -------------------------------------------------
         HOME
      ------------------------------------------------- */

      case 'home':

      default:
        return (
          <HomePage
            football={
              footballUniversalEvents
            }

            footballMode={
              footballMode
            }

            footballNotice={
              footballNotice
            }

            f1={
              f1
            }

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
     APP SHELL
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