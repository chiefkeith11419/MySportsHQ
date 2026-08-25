const FPL_BASE = 'https://fantasy.premierleague.com/api';

export async function fetchFplEntry(entryId) {
  if (!entryId) throw new Error('Add your FPL entry ID in Settings.');

  const entryResponse = await fetch(`${FPL_BASE}/entry/${entryId}/`);
  if (!entryResponse.ok) throw new Error(`FPL entry returned ${entryResponse.status}.`);
  const entry = await entryResponse.json();

  let picks = null;
  const currentEvent = entry.current_event || entry.started_event || null;
  if (currentEvent) {
    const picksResponse = await fetch(`${FPL_BASE}/entry/${entryId}/event/${currentEvent}/picks/`);
    if (picksResponse.ok) picks = await picksResponse.json();
  }

  return { entry, picks };
}
