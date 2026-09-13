const CURRENT_SEASON = 2026;

const BASE_URL = import.meta.env.BASE_URL;

let circuitCache = null;


/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function seasonMatches(
  value,
  season = CURRENT_SEASON
) {
  if (!value) return false;

  return String(value)
    .split(',')
    .some((part) => {
      const item = part.trim();

      if (item.includes('-')) {
        const [start, end] =
          item
            .split('-')
            .map(Number);

        return (
          season >= start &&
          season <= end
        );
      }

      return Number(item) === season;
    });
}


function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]+/g,
      ' '
    )
    .trim();
}


function countryLabel(value = '') {
  return String(value)
    .split('-')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(' ');
}


/* -------------------------------------------------------
   LOAD LOCAL CATALOG
------------------------------------------------------- */

export async function loadCircuitCatalog() {
  if (circuitCache) {
    return circuitCache;
  }

  const response =
    await fetch(
      `${BASE_URL}data/f1/circuits.json`
    );

  if (!response.ok) {
    throw new Error(
      'Unable to load F1 circuit catalog.'
    );
  }

  circuitCache =
    await response.json();

  return circuitCache;
}


/* -------------------------------------------------------
   CURRENT LAYOUT
------------------------------------------------------- */

export function getCurrentLayout(
  circuit,
  season = CURRENT_SEASON
) {
  if (
    !circuit?.layouts?.length
  ) {
    return null;
  }

  return (
    circuit.layouts.find(
      (layout) =>
        seasonMatches(
          layout.seasons,
          season
        )
    ) ||
    circuit.layouts[
      circuit.layouts.length - 1
    ]
  );
}


/* -------------------------------------------------------
   NORMALIZED CIRCUIT
------------------------------------------------------- */

export function createCircuitRecord(
  circuit,
  season = CURRENT_SEASON
) {
  if (!circuit) {
    return null;
  }

  const layout =
    getCurrentLayout(
      circuit,
      season
    );

  const layoutId =
    layout?.layoutId ||
    null;

  return {
    id:
      circuit.id,

    name:
      circuit.name,

    countryId:
      circuit.countryId,

    country:
      countryLabel(
        circuit.countryId
      ),

    latitude:
      circuit.latitude,

    longitude:
      circuit.longitude,

    layoutId,

    orientation:
      layout?.[
        'f1-orientation'
      ] ?? null,

    seasons:
      layout?.seasons ||
      null,

    svg:
      layoutId
        ? `${BASE_URL}tracks/f1/${layoutId}.svg`
        : null,

    raw:
      circuit,
  };
}


/* -------------------------------------------------------
   EVENT → CIRCUIT MATCHING
------------------------------------------------------- */

export function findCircuitForEvent(
  event,
  circuits,
  season = CURRENT_SEASON
) {
  if (
    !event ||
    !circuits?.length
  ) {
    return null;
  }

  const searchableText =
    normalizeText(
      [
        event.name,
        event.title,
        event.shortName,
        event.location,

        event.venue?.name,
        event.venue?.fullName,

        event.circuit?.name,
      ]
        .filter(Boolean)
        .join(' ')
    );


  const aliases = {
    madring: [
      'madring',
      'madrid',
      'spanish grand prix',
    ],

    monza: [
      'monza',
      'italian grand prix',
    ],

    'spa-francorchamps': [
      'spa',
      'francorchamps',
      'belgian grand prix',
    ],

    silverstone: [
      'silverstone',
      'british grand prix',
    ],

    monaco: [
      'monaco',
      'monte carlo',
    ],

    suzuka: [
      'suzuka',
      'japanese grand prix',
    ],

    zandvoort: [
      'zandvoort',
      'dutch grand prix',
    ],

    interlagos: [
      'interlagos',
      'sao paulo',
      'brazil',
    ],

    'las-vegas': [
      'las vegas',
    ],

    'marina-bay': [
      'singapore',
      'marina bay',
    ],

    'mexico-city': [
      'mexico',
      'hermanos rodriguez',
    ],

    austin: [
      'austin',
      'circuit of the americas',
      'united states grand prix',
    ],

    miami: [
      'miami',
    ],

    bahrain: [
      'bahrain',
      'sakhir',
    ],

    jeddah: [
      'jeddah',
      'saudi',
    ],

    shanghai: [
      'shanghai',
      'chinese grand prix',
    ],

    melbourne: [
      'melbourne',
      'albert park',
      'australian grand prix',
    ],

    catalunya: [
      'catalunya',
      'barcelona catalunya',
    ],

    hungaroring: [
      'hungaroring',
      'hungarian grand prix',
    ],

    baku: [
      'baku',
      'azerbaijan',
    ],

    lusail: [
      'lusail',
      'qatar',
    ],

    'yas-marina': [
      'yas marina',
      'abu dhabi',
    ],

    spielberg: [
      'spielberg',
      'red bull ring',
      'austrian grand prix',
    ],

    montreal: [
      'montreal',
      'gilles villeneuve',
      'canadian grand prix',
    ],
  };


  for (
    const [id, values]
    of Object.entries(aliases)
  ) {
    const matched =
      values.some(
        (alias) =>
          searchableText.includes(
            normalizeText(alias)
          )
      );

    if (!matched) {
      continue;
    }

    const circuit =
      circuits.find(
        (item) =>
          item.id === id
      );

    if (circuit) {
      return createCircuitRecord(
        circuit,
        season
      );
    }
  }


  const directMatch =
    circuits.find(
      (circuit) => {
        const name =
          normalizeText(
            circuit.name
          );

        return (
          name &&
          searchableText.includes(
            name
          )
        );
      }
    );


  return directMatch
    ? createCircuitRecord(
        directMatch,
        season
      )
    : null;
}