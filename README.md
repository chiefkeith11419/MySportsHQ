# Sports HQ — v0.1

A personal, mobile-first sports dashboard built for GitHub Pages with a hard **$0 recurring-cost** requirement.

## What is included

- Threads-inspired slide-out sports drawer
- Personal-club priority cards for Barcelona and NYCFC
- Football feed grouped around followed leagues
- Watchlist stored in browser `localStorage`
- Match notes that become saved content ideas
- Separate Formula 1, WWE, FPL and Content sections
- Free-data adapters kept in `src/services/`
- Clearly labeled demo fallback if a free external feed cannot be reached
- GitHub Pages deployment workflow

## Data sources in v0.1

- Football: ESPN public-facing JSON scoreboard endpoints (unofficial / not guaranteed)
- Formula 1: ESPN public-facing F1 scoreboard endpoint (unofficial / not guaranteed)
- FPL: public Fantasy Premier League JSON endpoints
- WWE: curated local data in `src/data/wwe.js`

External services are intentionally isolated so they can be replaced without rewriting the UI.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Publish on GitHub Pages

1. Create a new public GitHub repository.
2. Put these files in the repository.
3. Push to the `main` branch.
4. In GitHub: **Settings → Pages → Source → GitHub Actions**.
5. The included `.github/workflows/deploy.yml` builds and publishes the site.

The Vite config uses relative asset paths, so you do not need to hard-code the repository name.

## Important free-data limitation

This is a personal dashboard, not a commercial live-score product. Free and undocumented endpoints can change or reject browser requests. The app therefore has a provider layer and demo fallback. If FPL or another source is blocked by browser CORS, the next zero-cost step is a GitHub Actions cache that periodically writes JSON into the repository.

## Suggested v0.2 work

1. Football match detail: scorers, cards, lineups and standings.
2. Full F1 schedule + driver/constructor standings.
3. Weekend timeline across all sports.
4. GitHub Actions data cache for endpoints that block browser requests.
5. WWE schedule/results updater using a stable free source if one is found.
6. Export/import local notes so iPhone and desktop can share your saved takes without a paid database.
