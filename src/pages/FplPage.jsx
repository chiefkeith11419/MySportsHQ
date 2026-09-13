import DataBanner from '../components/DataBanner.jsx';
import Section from '../components/Section.jsx';
import { formatLocalDateTime } from '../services/sports.js';


function getEvent(data) {
  if (!data) return null;

  if (data.event) {
    return data.event;
  }

  if (Array.isArray(data.events) && data.events.length) {
    return data.events[0];
  }

  return null;
}


function getCircuitName(event) {
  return (
    event?.venue?.fullName ||
    event?.venue?.name ||
    event?.circuit?.name ||
    event?.location ||
    'Circuit information unavailable'
  );
}


function getLocation(event) {
  const city =
    event?.venue?.address?.city ||
    event?.city;

  const country =
    event?.venue?.address?.country ||
    event?.country;

  return [city, country]
    .filter(Boolean)
    .join(', ');
}


export default function F1Page({
  data,
  mode,
  notice,
}) {
  const event = getEvent(data);

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
            Race weekends, results,
            standings and analysis.
          </p>
        </div>


        <DataBanner
          mode={mode}
          message={notice}
        />


        <div className="empty-state">
          F1 data is loading or no
          upcoming Grand Prix was found.
        </div>

      </div>
    );
  }


  const title =
    event.name ||
    event.title ||
    event.shortName ||
    'Formula 1';


  const circuit =
    getCircuitName(event);


  const location =
    getLocation(event);


  const status =
    event.status ||
    event.detail ||
    'Upcoming';


  return (
    <div className="page-stack">

      {/* PAGE HEADER */}

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

            <p className="f1-hero__location">
              {circuit}

              {location && (
                <>
                  {' · '}
                  {location}
                </>
              )}
            </p>

          </div>


          <span className="f1-status">
            {status}
          </span>

        </div>


        {/* TRACK PLACEHOLDER */}

        <div className="f1-track">

          <div className="f1-track__placeholder">

            <span>
              TRACK
            </span>

            <strong>
              {circuit}
            </strong>

          </div>

        </div>


        {/* EVENT DATE */}

        <div className="f1-next-session">

          <p className="eyebrow">
            NEXT
          </p>

          <strong>
            {formatLocalDateTime(
              event.date,
              {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
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

          <div className="f1-session">
            <span>P1</span>
            <small>
              Coming next
            </small>
          </div>

          <div className="f1-session">
            <span>P2</span>
            <small>
              Coming next
            </small>
          </div>

          <div className="f1-session">
            <span>P3</span>
            <small>
              Coming next
            </small>
          </div>

          <div className="f1-session">
            <span>QUALI</span>
            <small>
              Coming next
            </small>
          </div>

          <div className="f1-session">
            <span>RACE</span>
            <small>
              Coming next
            </small>
          </div>

        </div>

        <p className="f1-helper-text">
          Individual practice,
          qualifying and race times
          will be connected in the
          F1 data upgrade.
        </p>

      </Section>


      {/* WEATHER */}

      <Section
        eyebrow="CIRCUIT"
        title="Weather"
      >

        <div className="empty-state">
          Circuit weather will be
          powered by the free
          Open-Meteo feed.
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
          Driver and constructor
          standings will be connected
          through Jolpica.
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


      {/* THREADS */}

      <Section
        eyebrow="CONVERSATION"
        title="F1 Threads"
      >

        <div className="empty-state">
          Recent F1 conversation
          from Threads will appear
          here with quick-read posts
          and links back to Threads.
        </div>

      </Section>


      {/* SEASON */}

      <Section
        eyebrow="2026"
        title="Season Calendar"
      >

        <div className="empty-state">
          Completed, current and
          upcoming rounds will appear
          here.
        </div>

      </Section>

    </div>
  );
}