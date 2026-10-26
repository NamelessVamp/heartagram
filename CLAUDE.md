# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Static site: no build step, no framework, no runtime dependencies. `package.json` exists only to define `npm test`. CI uses Node 24.

```powershell
python -m http.server 8000        # serve the repo root, then open http://localhost:8000/
npm test                          # full QA suite; CI runs it before every deploy
node tests/<name>-qa.mjs          # one suite; run from the repo root (tests read files by relative path)
git diff --check                  # documented pre-push check
```

`npm test` chains every `tests/*-qa.mjs` with `&&`, so the first failure stops the run. The suites are plain `node:assert` scripts. Most of them grep `index.html`, the CSS, or the JS source for exact strings, class names, and `?v=` values, so renaming a class or changing a cache-bust string can fail a suite that looks unrelated.

Catalog scripts (Python, run from the repo root with the `.venv` interpreter):

```powershell
.\.venv\Scripts\python.exe scripts\validate_catalog.py            # reports on data/*.json
.\.venv\Scripts\python.exe scripts\validate_catalog.py --strict   # pre-publish gate (VERIFICAR = failure)
.\.venv\Scripts\python.exe scripts\validate_nintendo_mx_catalog.py
```

At the time of writing, `validate_catalog.py` exits with `[FAIL] 49 errores` on the curated set (unverified multiplayer fields), and `validate_nintendo_mx_catalog.py` needs `data/nintendo_probe/`, which is gitignored and absent from a fresh checkout.

## Deploy

Pushing to `main` deploys. `.github/workflows/pages.yml` runs `npm test` and, only if it passes, copies `index.html`, `css/`, `js/`, `data/`, and `assets/` into `_site` and publishes to GitHub Pages. Any new top-level static folder must be added to that workflow or it will not be deployed.

## Architecture

A single-page vanilla-ES-module app. There is no server and no AI. All user state lives in `localStorage`. `fetch()` is used for JSON, so the app must be served over HTTP; opening `index.html` from disk breaks loading.

**Screens.** `index.html` contains every screen as a `section.screen[data-screen]`. `showScreen(name)` in `js/main.js` toggles `hidden` and sets `body[data-screen]`. Navigation is built by `js/app-shell.js` from `PRIMARY_NAV_ITEMS` and `SECONDARY_NAV_ITEMS`. Button actions are dispatched through the handler map in `bindActions()` in `js/main.js`. A new screen therefore touches `index.html`, the nav constants, and that map.

**Boot.** `init()` in `js/main.js` loads the questions, archetypes, profile texts and combos, and `data/games.json` in parallel, then restores the saved profile once. The Nintendo catalog is separate: `js/catalog.js` `loadCatalog()` fetches `data/nintendo_catalog.json` on demand and memoizes the promise.

**Profile.** `data/questions.json` holds 12 questions. Each option adds a value in −2…+2 to six dimensions (`pace`, `social`, `structure`, `session`, `mood`, `challenge`, defined in `js/profile.js`) and adds weight to archetypes. `computeProfile()` in `js/profile.js` returns the primary and secondary archetype. The result is saved under `heartagram:profile`.

**Recommendations are two layers.**

- `js/recommender.js` scores curated `data/games.json` entries against the profile vector. It only considers entries with `status === "VERIFICADO"`. It also provides `buildSections` and `buildDuo`.
- `js/recommend-v2.js` is the layer the UI calls. `buildPool()` merges curated games with Nintendo products, translated into the same six-dimension vector by `nintendoToCandidate()`. `buildRecommendations()` applies daily rotation (seed `DAY_KEY|reroll`, set in `main.js`), diversity by saga (`familyKey`) and genre (`PER_GENRE`), and excludes owned games.
- Both are pure functions. Keep them free of DOM access.

**Catalog IDs.** `js/nintendo-catalog.js` adapts the raw store payload into the shape `catalog.js` expects. Nintendo products use IDs of the form `nintendo:MX:<nsuid>` (10–20 digits). Curated games use slugs such as `luigis-mansion-3`. The helpers `favoriteIdForCatalogGame` and `catalogIdFromFavoriteId` in `js/catalog.js` convert between the two forms.

**Persistence and events.** All state is in `localStorage` under `heartagram:*` keys: profile, favorites (Me interesa), library (Mi biblioteca), getting-started progress, sidebar state, and collection tab. `js/favorites.js` and `js/library.js` dispatch `heartagram:favorites-changed` and `heartagram:library-changed`. `main.js` listens for them and re-renders the home dashboard and wishlist.

**DOM boundary.** The recommendation and catalog logic modules are DOM-free. The DOM is touched by `main.js`, `ui.js`, and the feature modules (`catalog-ui.js`, `discover-ui.js`, `collection-ui.js`, `home-dashboard.js`, `getting-started.js`, `app-shell.js`, `bouquet.js`, `nintendo-product-detail.js`). `CODESTYLE.md` says DOM work belongs only in `ui.js` and `main.js`. That is not how the code is organised, so follow the existing feature-module split.

**Styling.** `index.html` loads the stylesheets in a fixed order: `tokens` → `base` → `layout` → `components` → `screens/*` → `theme-bouquet` → `theme-scrapbook`. `css-hygiene-qa.mjs` enforces that order, requires every CSS file to be linked, and forbids `!important`. Cascade order comes from the `@layer` declaration in `tokens.css`. `js/bouquet.js` draws the decorative motifs in its own module script.

**Cache busting is manual.** Every local JS and CSS URL carries a version query, and two constants in JS hold the data version. Bumping a version means changing all of these together:

- `?v=` on the module imports in `js/main.js`, and on `index.html`'s script and stylesheet tags. The current JS value is `v122`; the current CSS value is `ui13`.
- `DATA_VERSION` in `js/main.js` and `js/catalog.js`, currently `"122"`.
- The literal versions asserted in `tests/bouquet-qa.mjs`, `tests/css-hygiene-qa.mjs`, and `tests/scrapbook-qa.mjs`.

**Preview flag.** `?preview` in the URL makes `main.js` include unverified seed games through `toPreviewGame()`. This is for development only.

**Catalog pipeline (Python, offline).** The scripts in `scripts/` run in roughly this order, as their docstrings describe:

1. `probe_nintendo_mx.py` and `probe_nintendo_switch_mx.py` download public Nintendo Store MX responses into `data/nintendo_probe/`.
2. `build_nintendo_mx_combined.py` builds a draft combined catalog from those raw files.
3. `validate_nintendo_mx_catalog.py` checks the draft.
4. `publish_nintendo_mx_snapshot.py` copies the validated draft to `data/nintendo_catalog*.json`, writes metadata, and keeps a backup of the previous snapshot.

`enrich_nintendo_catalog_from_raw.py` and `inspect_nintendo_mx_records.py` are supporting and diagnostic tools. Treat `data/nintendo_catalog*.json` as generated output. These scripts make network requests, so run them only when a catalog update is requested. Their schema is in `docs/NINTENDO_PRODUCT_SCHEMA.md`.

## Conventions

- **Language.** Code, comments, file names, and commit messages are in English. Visible UI text is in Mexican Spanish (`es-MX`). Game titles keep their English terms.
- **Commits.** Imperative English with a prefix: `feat:`, `fix:`, `data:`, `style:`, `docs:`. `main` is the release branch; put features on `feat/<name>` branches.
- **Data placeholders.** Unconfirmed fields are `"VERIFICAR"` or `null`. Never invent values. Prices are integer MXN with a `price_checked` date (`YYYY-MM-DD`).
- **Restricted content.** No eShop codes, keys, or credentials anywhere in the repo, fixtures and tests included. `.env` holds local secrets and is gitignored; do not print or commit it.
- **Content rules.** No Unicode emoji in code, UI, or commits. No religious iconography in the UI.
- **Accessibility.** Use semantic elements (`main`, `section`, `button`), not `div` with `onclick`. Spanish `alt` text on every image. Quiz options must be keyboard-navigable. Respect `prefers-reduced-motion`. Base text is at least 16px.
- **Python scripts.** `pathlib` for paths, type hints, output tags `[OK]` / `[WARN]` / `[FAIL]`, and a non-zero exit code when validation fails.
- **Release hygiene.** `tests/release-hygiene-qa.mjs` requires `docs/ROADMAP.md` to mention `v1.2.3` and to be free of "NFC". Keep that section intact when updating the roadmap.
- **Gitignored and generated.** `data/*_backups/`, `data/nintendo_probe/`, and `install_*.py` / `prepare_ui_audit_*.py` patch scripts are local artifacts. They are not source.

## Project rules (do not override without explicit approval)

- Static runtime only (GitHub Pages). No backend.
- Nintendo-only scope.
- Visual direction: Midnight Bouquet (single theme, no theme switcher).
- Beginner-first: explain every feature and step; user has never owned a Switch.
- Do NOT reintroduce: Chat, Gemini, Python backend, IGDB, NFC.
- NSO guide: no prices and no comparison with the basic NSO tier.
- Code and technical docs in English; UI copy in Spanish (Mexico).
- Full history and decisions: see docs/Handoff.md
- Never read or print .env contents.
