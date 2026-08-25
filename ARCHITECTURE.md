# Sports HQ architecture

## Product rule

Sports HQ is not trying to replace FotMob or ESPN. It answers four personal questions:

1. What matters to me right now?
2. What am I planning to watch?
3. What happened in the sports I follow?
4. What did I think about it / what might I post?

## Priority model

### Personal
- Barcelona
- NYCFC
- WWE

### Regular viewing
- Formula 1
- Premier League
- La Liga beyond Barcelona
- MLS beyond NYCFC
- Serie A
- Champions League
- FPL

## Navigation model

The slide-out drawer changes sports context:

- Home
- Football
- Formula 1
- WWE
- Fantasy PL

Bottom navigation changes workflow:

- Home
- Watch
- Content
- Settings

This prevents one infinitely long dashboard while preserving quick movement between sports.

## Data boundary

UI components never construct provider URLs directly.

- `src/services/espn.js` → football + F1
- `src/services/fpl.js` → Fantasy Premier League
- `src/data/wwe.js` → local WWE data

If a free source stops working, replace the service adapter rather than redesigning the site.

## Storage

For v0.1:

- Watchlist → `localStorage`
- Content notes → `localStorage`
- FPL entry ID → `localStorage`

No login and no paid database.
