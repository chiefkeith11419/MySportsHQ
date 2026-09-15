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
  toLegacyFootballEvents,
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
   TEMPORARY F1 WATCH NORMALIZER

   F1 will get its own v0.3 universal normalizer later.
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
    Future support for arrays of sessions/events.
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

     Empty until Cricket v0.3 is connected.
  ----------------------------------------------------- */

  const [
    cricketEvents,
  ] = useState([]);


  /* -----------------------------------------------------
     WWE

     Empty until WWE v0.3 is connected.
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


          /* -------------------------------------------
             PROVIDER HEALTH
          ------------------------------------------- */

          const messages =
            [];


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
     LEGACY FOOTBALL FEED

     Home and Watch still temporarily use this format.
  ----------------------------------------------------- */

  const footballEvents =
    useMemo(
      () => {
        if (
          footballFallback
        ) {
          return footballFallback;
        }


        return toLegacyFootballEvents(
          footballV3
        );
      },
      [
        footballV3,
        footballFallback,
      ]
    );


  /* -----------------------------------------------------
     UNIVERSAL FOOTBALL FEED

     FootballPage now consumes this directly.
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
     F1 EVENTS FOR WATCH
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
     TEMPORARY WATCH FEED

     Football still enters Watch using legacy shape.

     Watch will later move to the universal event model.
  ----------------------------------------------------- */

  const allEvents =
    useMemo(
      () =>
        [
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
            (
              a,
              b
            ) =>
              new Date(
                a.date
              ).getTime() -
              new Date(
                b.date
              ).getTime()
          ),
      [
        footballEvents,
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
        Universal Football events use a Sports HQ ID,
        but existing watchlists use the ESPN provider ID.

        Preserve the provider ID during migration.
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

      /* -----------------------------------------------
         FOOTBALL

         Now uses universal Sports HQ events directly.
      ----------------------------------------------- */

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


      /* -----------------------------------------------
         FORMULA 1
      ----------------------------------------------- */

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


      /* -----------------------------------------------
         WWE
      ----------------------------------------------- */

      case 'wwe':
        return (
          <WWEPage
            events={
              wweEvents
            }

            {...shared}
          />
        );


      /* -----------------------------------------------
         CRICKET
      ----------------------------------------------- */

      case 'cricket':
        return (
          <CricketPage
            events={
              cricketEvents
            }

            {...shared}
          />
        );


      /* -----------------------------------------------
         FANTASY
      ----------------------------------------------- */

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


      /* -----------------------------------------------
         WATCH

         Still receives migration-format events.
      ----------------------------------------------- */

      case 'watch':
        return (
          <WatchPage
            events={
              allEvents
            }

            {...shared}
          />
        );


      /* -----------------------------------------------
         COMPETITIONS
      ----------------------------------------------- */

      case 'competitions':
        return (
          <CompetitionsPage
            onNavigate={
              setRoute
            }
          />
        );


      /* -----------------------------------------------
         CONTENT
      ----------------------------------------------- */

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


      /* -----------------------------------------------
         SETTINGS
      ----------------------------------------------- */

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


      /* -----------------------------------------------
         HOME

         Still receives legacy football temporarily.
      ----------------------------------------------- */

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