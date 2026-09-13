import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import DataBanner from '../components/DataBanner.jsx';
import F1Circuit from '../components/F1Circuit.jsx';
import Section from '../components/Section.jsx';

import {
  findCircuitForEvent,
  loadCircuitCatalog,
} from '../services/f1/circuits.js';

import {
  formatLocalDateTime,
} from '../services/sports.js';


/* -------------------------------------------------------
   EVENT
------------------------------------------------------- */

function getEvent(data) {
  if (!data) {
    return null;
  }

  if (data.event) {
    return data.event;
  }

  if (
    Array.isArray(data.events) &&
    data.events.length
  ) {
    return data.events[0];
  }

  return null;
}


/* -------------------------------------------------------
   STATUS
------------------------------------------------------- */

function getStatus(event) {
  const value =
    event?.status;

  if (
    typeof value === 'string'
  ) {
    return value.toUpperCase();
  }

  return (
    event?.status?.type?.state ||
    event?.status?.type?.description ||
    event?.detail ||
    'UPCOMING'
  );
}


/* -------------------------------------------------------
   F1 PAGE
------------------------------------------------------- */

export default function F1Page({
  data,
  mode,
  notice,
}) {
  const event =
    getEvent(data);


  const [
    circuits,
    setCircuits,
  ] = useState([]);


  const [
    circuitMode,
    setCircuitMode,
  ] = useState('loading');


  /* -----------------------------------------------------
     LOAD CIRCUIT CATALOG
  ----------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    loadCircuitCatalog()
      .then((catalog) => {
        if (cancelled) {
          return;
        }

        setCircuits(
          catalog
        );

        setCircuitMode(
          'ready'
        );
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error(
          error
        );

        setCircuitMode(
          'error'
        );
      });


    return () => {
      cancelled = true;
    };
  }, []);


  /* -----------------------------------------------------
     MATCH EVENT TO CIRCUIT
  ----------------------------------------------------- */

  const circuit =
    useMemo(() => {
      if (
        !event ||
        !circuits.length
      ) {
        return null;
      }

      return findCircuitForEvent(
        event,
        circuits,
        2026
      );
    }, [
      event,
      circuits,
    ]);


  /* -----------------------------------------------------
     NO EVENT
  ----------------------------------------------------- */

  if (!event) {
    return (
      <div className="page-stack">

        <div className="page-heading">

          <p className="eyebrow">
            MOTORSPORT
          </p>

          <h1>
            Formula 1
          </h1>

          <p>
            Your race weekend
            dashboard.
          </p>

        </div>


        <DataBanner
          mode={mode}
          message={notice}
        />


        <div className="empty-state">
          F1 data is loading or no
          current Grand Prix was found.
        </div>

      </div>
    );
  }


  const title =
    event.name ||
    event.title ||
    event.shortName ||
    'Formula 1';


  const status =
    getStatus(event);


  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */

  return (
    <div className="page-stack">

      {/* HEADER */}

      <div className="page-heading">

        <p className="eyebrow">
          MOTORSPORT
        </p>

        <h1>
          Formula 1
        </h1>

        <p>
          Your race weekend dashboard.
        </p>

      </div>


      <DataBanner
        mode={mode}
        message={notice}
      />


      {/* GRAND PRIX HERO */}

      <section className="f1-hero">

        <div className="f1-hero__top">

          <div>

            <p className="eyebrow">
              CURRENT / NEXT
            </p>

            <h2>
              {title}
            </h2>


            {circuit && (

              <p className="f1-hero__location">

                {circuit.name}

                {' · '}

                {circuit.country}

              </p>

            )}

          </div>


          <span className="f1-status">
            {status}
          </span>

        </div>


        {/* REAL CIRCUIT */}

        <div className="f1-track">

          {circuitMode ===
            'loading' && (

            <div className="f1-circuit-missing">
              Loading circuit…
            </div>

          )}


          {circuitMode ===
            'error' && (

            <div className="f1-circuit-missing">
              Circuit catalog could
              not be loaded.
            </div>

          )}


          {circuitMode ===
            'ready' && (

            <F1Circuit
              circuit={circuit}
            />

          )}

        </div>


        {/* CIRCUIT STATS */}

        {circuit && (

          <div className="f1-circuit-stats">

            <div>

              <span>
                COUNTRY
              </span>

              <strong>
                {circuit.country}
              </strong>

            </div>


            <div>

              <span>
                LATITUDE
              </span>

              <strong>
                {Number(
                  circuit.latitude
                ).toFixed(3)}
              </strong>

            </div>


            <div>

              <span>
                LONGITUDE
              </span>

              <strong>
                {Number(
                  circuit.longitude
                ).toFixed(3)}
              </strong>

            </div>


            <div>

              <span>
                LAYOUT
              </span>

              <strong>
                {circuit.layoutId}
              </strong>

            </div>

          </div>

        )}


        {/* NEXT */}

        <div className="f1-next-session">

          <p className="eyebrow">
            NEXT
          </p>

          <strong>

            {formatLocalDateTime(
              event.date,
              {
                weekday:
                  'long',

                month:
                  'short',

                day:
                  'numeric',
              }
            )}

          </strong>

        </div>

      </section>


      {/* WEEKEND */}

      <Section
        eyebrow="RACE WEEKEND"
        title="Sessions"
      >

        <div className="f1-session-grid">

          {[
            'P1',
            'P2',
            'P3',
            'QUALI',
            'RACE',
          ].map(
            (session) => (

              <div
                className="f1-session"
                key={session}
              >

                <span>
                  {session}
                </span>

                <small>
                  Schedule pending
                </small>

              </div>

            )
          )}

        </div>

      </Section>


      {/* CIRCUIT */}

      <Section
        eyebrow="CIRCUIT"
        title="Track Data"
      >

        {circuit ? (

          <div className="f1-track-data">

            <div>

              <span>
                Circuit
              </span>

              <strong>
                {circuit.name}
              </strong>

            </div>


            <div>

              <span>
                Country
              </span>

              <strong>
                {circuit.country}
              </strong>

            </div>


            <div>

              <span>
                Active layout
              </span>

              <strong>
                {circuit.layoutId}
              </strong>

            </div>


            <div>

              <span>
                F1 seasons
              </span>

              <strong>
                {circuit.seasons}
              </strong>

            </div>


            <div>

              <span>
                Orientation
              </span>

              <strong>
                {circuit.orientation ??
                  '—'}°
              </strong>

            </div>


            <div>

              <span>
                Coordinates
              </span>

              <strong>
                {circuit.latitude},
                {' '}
                {circuit.longitude}
              </strong>

            </div>

          </div>

        ) : (

          <div className="empty-state">
            No circuit record matched
            this Grand Prix.
          </div>

        )}

      </Section>


      {/* WEATHER */}

      <Section
        eyebrow="CIRCUIT"
        title="Weather"
      >

        <div className="empty-state">

          Circuit coordinates are now
          available.

          The next upgrade will use
          them to load session-specific
          weather.

        </div>

      </Section>


      {/* RESULTS */}

      <Section
        eyebrow="WEEKEND"
        title="Results"
      >

        <div className="empty-state">

          Practice, qualifying,
          sprint and race results
          will appear here.

        </div>

      </Section>


      {/* STANDINGS */}

      <Section
        eyebrow="CHAMPIONSHIP"
        title="Standings"
      >

        <div className="f1-tabs-preview">

          <button
            className="f1-preview-tab is-active"
          >
            Drivers
          </button>

          <button
            className="f1-preview-tab"
          >
            Constructors
          </button>

        </div>


        <div className="empty-state">
          Championship data will be
          connected next.
        </div>

      </Section>


      {/* ANALYSIS */}

      <Section
        eyebrow="POST SESSION"
        title="Analysis"
      >

        <div className="f1-analysis-grid">

          <div className="f1-analysis-card">
            <strong>
              Tyre Strategy
            </strong>

            <span>
              Coming soon
            </span>
          </div>


          <div className="f1-analysis-card">
            <strong>
              Pit Stops
            </strong>

            <span>
              Coming soon
            </span>
          </div>


          <div className="f1-analysis-card">
            <strong>
              Grid → Finish
            </strong>

            <span>
              Coming soon
            </span>
          </div>


          <div className="f1-analysis-card">
            <strong>
              Lap Chart
            </strong>

            <span>
              Coming soon
            </span>
          </div>

        </div>

      </Section>


      {/* CALENDAR */}

      <Section
        eyebrow="2026"
        title="Season Calendar"
      >

        <div className="empty-state">
          The full season schedule
          will appear here.
        </div>

      </Section>

    </div>
  );
}