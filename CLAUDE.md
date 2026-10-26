# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Static site: no build step, no framework, no runtime dependencies. `package.json` exists only to define `npm test`. CI uses Node 24.

```powershell
python -m http.server 8000        # serve the repo root, then open http://localhost:8000/
npm test                          # full QA suite; CI runs it before every deploy
node tests/<name>-qa.mjs          # one suite; run from the repo root (tests read files by relative path)
git diff --check                  # documented pre-push check
node scripts/capture_screens.mjs  # screenshots of every screen (phone + desktop, --only mobile|desktop) into screens/ (gitignored); tall pages come out in several images
```

`npm test` chains every `tests/*-qa.mjs` with `&&`, so the first failure stops the run. The suites are plain `node:assert` scripts. Most of them grep `index.html`, the CSS, or the JS source for exact strings, class names, and `?v=` values, so renaming a class or changing a cache-bust string can fail a suite that looks unrelated.

Catalog scripts (Python, run from the repo root with the `.venv` interpreter):

```powershell
.\.venv\Scripts\python.exe scripts\validate_catalog.py            # reports on data/*.json
.\.venv\Scripts\python.exe scripts\validate_catalog.py --strict   # pre-publish gate (VERIFICAR = failure)
.\.venv\Scripts\python.exe scripts\validate_nintendo_mx_catalog.py
```

At the time of writing, `validate_catalog.py` exits with `[FAIL] 5 errores`: five curated games still have `gameshare: "VERIFICAR"`. `scripts/verify_curated_multiplayer.py` resolves them from the official product pages (`--apply` writes `games.json`), but it needs access to www.nintendo.com, which the work network blocks. `validate_nintendo_mx_catalog.py` needs `data/nintendo_probe/`, which is gitignored and absent from a fresh checkout.

## Deploy

Pushing to `main` deploys. `.github/workflows/pages.yml` runs `npm test` and, only if it passes, copies `index.html`, `css/`, `js/`, and `data/` into `_site` (minus `nintendo_catalog_extras.json` and `nintendo_catalog_meta.json`, which only `scripts/` uses) and publishes to GitHub Pages. Any new top-level static folder must be added to that workflow or it will not be deployed.

## Catalog refresh (GitHub Actions)

`.github/workflows/update-catalog.yml` refreshes the Nintendo Store snapshot every Monday (and on demand from the Actions tab, also from the phone). It runs the Python pipeline in order (probes, build, validate, publish, enrich), compares the result with the previous catalog using `scripts/catalog_refresh_report.mjs`, bumps `DATA_VERSION` to `YYYYMMDD`, runs `npm test`, force-pushes the branch `auto/catalog-refresh` and opens or updates a pull request whose body is the Spanish change summary. It never pushes to `main`: merging the PR is what deploys. A refresh that shrinks the catalog by more than 20% fails the job and opens nothing; a refresh where only `fetched_at` changed is skipped.

- Manual runs offer two extra inputs: `verify_multiplayer` (runs `verify_curated_multiplayer.py --apply`) and `capture_screens` (uploads `screens/` as an artifact).
- The repo setting Settings > Actions > General > "Allow GitHub Actions to create and approve pull requests" must be on; otherwise the job summary carries the compare URL instead.
- Commits made with `GITHUB_TOKEN` do not trigger other workflows, so `pages.yml` only runs when the PR is merged.
- GitHub disables scheduled workflows after 60 days without repository activity; re-enable it in the Actions tab.
- Tests must not depend on the live catalog: exact assertions use `tests/fixtures/nintendo_catalog_sample.json`, and the live file is only held to invariants.
- Untested against the real store: Nintendo may block GitHub runner IPs, and the scraping scripts were written against saved pages. Check the first manual run and the `nintendo-probe` artifact.

## Architecture

A single-page vanilla-ES-module app. There is no server and no AI. All user state lives in `localStorage`. `fetch()` is used for JSON, so the app must be served over HTTP; opening `index.html` from disk breaks loading.

**Screens.** `index.html` contains every screen as a `section.screen[data-screen]`. `showScreen(name)` in `js/main.js` toggles `hidden` and sets `body[data-screen]`. Navigation is built by `js/app-shell.js` from `PRIMARY_NAV_ITEMS` and `SECONDARY_NAV_ITEMS`. Button actions are dispatched through the handler map in `bindActions()` in `js/main.js`. A new screen therefore touches `index.html`, the nav constants, and that map.

**Boot.** `init()` in `js/main.js` loads the questions, archetypes, profile texts and combos, and `data/games.json` in parallel, then restores the saved profile once. The Nintendo catalog is separate: `js/catalog.js` `loadCatalog()` fetches `data/nintendo_catalog.json` on demand and memoizes the promise.

**Profile.** `data/questions.json` holds 12 questions. Each option adds a value in −2…+2 to six dimensions (`pace`, `social`, `structure`, `session`, `mood`, `challenge`, defined in `js/profile.js`) and adds weight to archetypes. `computeProfile()` in `js/profile.js` returns the primary and secondary archetype. The result is saved under `heartagram:profile`.

**Recommendations are two layers.**

- `js/recommender.js` holds `scoreGame` (profile-vector similarity plus archetype, vibe and horror adjustments) and `duoBadges`.
- `js/recommend-v2.js` is the layer the UI calls. `buildPool()` merges curated games with Nintendo products, translated into the same six-dimension vector by `nintendoToCandidate()`. `reasonFor()` builds the line shown for Nintendo products from catalog facts only (ways to play, features, genres, rating); the profile just picks which one. `tests/recommend-v2-qa.mjs` fails on filler phrases and on claims the data does not back, so new reasons must state a fact, never a mood. `buildRecommendations()` keeps only `status === "VERIFICADO"` entries, applies daily rotation (seed `DAY_KEY|reroll`, set in `main.js`), diversity by saga (`familyKey`) and genre (`PER_GENRE`), and excludes owned games.
- Both are pure functions. Keep them free of DOM access.

**Catalog IDs.** `js/nintendo-catalog.js` adapts the raw store payload into the shape `catalog.js` expects. Nintendo products use IDs of the form `nintendo:MX:<nsuid>` (10–20 digits). Curated games use slugs such as `luigis-mansion-3`. The helpers `favoriteIdForCatalogGame` and `catalogIdFromFavoriteId` in `js/catalog.js` convert between the two forms. The product dialog in Explorar is rendered entirely by `js/nintendo-product-detail.js` (minified); `catalog-ui.js` only opens it and gives its title the `catalog-dialog-title` id the dialog's `aria-labelledby` points to.

**Inicio actions.** The hero buttons (`#home-action-guide`, `#home-action-profile`) are plain HTML. `renderHomeDashboard()` in `js/home-dashboard.js` sets them from the profile and the guide progress: "Inicia aquí" is the primary button until all guide steps are done, then the profile action takes over. `showScreen("intro")` re-renders it so progress made on the guide screen shows up on return.

**Saved state.** `js/profile-storage.js` validates a saved profile on read and drops one it cannot use (older builds saved profiles without `vibes`, which used to stop startup). Favorites, library and profile writes fall back to memory when `localStorage` is blocked or full. A game can be saved under a curated id or a `nintendo:MX:` id, so ownership is also matched by normalized title (`omitOwned`, `titleKeys` in `js/recommend-v2.js`).

**Explorar.** `initializeCatalogExplorer()` is one memoized promise and binds listeners once. Favorite and library changes update the existing card buttons in place (`refreshCardButtons`) instead of rebuilding the grid, which would drop keyboard focus.

**Sales.** The catalog is a snapshot, so `activeSalePrice()` in `js/nintendo-catalog.js` counts a sale only until its `sale_end`; an expired one falls back to the regular price (the clock is a parameter, so tests pin it). Explorar has a "Solo en oferta" filter with its count, a "Mayor descuento" sort, a discount badge and end date on cards, the same in the game detail and in Mi lista, and a note with the snapshot date (`priced_at`, from the catalog's `generated_at`). Refresh the catalog with the `scripts/` pipeline before relying on prices.

**Counts and re-ranking.** Inicio shows the numbers Mi lista resolved (`initializeHomeCounts`, fed by `heartagram:collection-rendered`), so an id that no longer exists in the catalog is neither listed nor counted; it stays in storage untouched. When the catalog arrives while Descubrir is open, `main.js` sets `rerankPending` and re-ranks on the next screen change, so cards never reshuffle under the user.

**Persistence and events.** All state is in `localStorage` under `heartagram:*` keys: profile, favorites (Me interesa), library (Mi biblioteca), getting-started progress, sidebar state, and collection tab. `js/favorites.js` and `js/library.js` dispatch `heartagram:favorites-changed` and `heartagram:library-changed`. `main.js` listens for them and re-renders the home dashboard and wishlist.

**DOM boundary.** The recommendation and catalog logic modules are DOM-free. The DOM is touched by `main.js`, `ui.js`, and the feature modules (`catalog-ui.js`, `discover-ui.js`, `collection-ui.js`, `home-dashboard.js`, `getting-started.js`, `app-shell.js`, `bouquet.js`, `nintendo-product-detail.js`). `CODESTYLE.md` says DOM work belongs only in `ui.js` and `main.js`. That is not how the code is organised, so follow the existing feature-module split.

**Styling.** `index.html` loads the stylesheets in a fixed order: `tokens` → `base` → `layout` → `components` → `screens/*` → `theme-bouquet` → `theme-scrapbook`. `css-hygiene-qa.mjs` enforces that order, requires every CSS file to be linked, and forbids `!important`. Cascade order comes from the `@layer` declaration in `tokens.css`. `js/bouquet.js` draws the decorative motifs in its own module script.

**Cache busting is manual.** Every local JS and CSS URL carries a version query, and two constants in JS hold the data version. Bumping a version means changing all of these together:

- `?v=` on the module imports in `js/main.js`, and on `index.html`'s script and stylesheet tags. The current JS value is `v136`; the current CSS value is `ui20`. `favorites.js`, `library.js`, `profile-storage.js` and `getting-started.js` are imported without a query, so changing them does not bust the cache by itself; `catalog-labels.js` is versioned because its exports changed (a stale copy next to new modules breaks the whole import graph).
- Every import of `./catalog.js` (in `main.js`, `catalog-ui.js`, `ui.js`, `nintendo-product-detail.js`) must use the same `?v=`. A different query string loads a second module instance with its own catalog cache.
- `DATA_VERSION` in `js/main.js` and `js/catalog.js`, currently a `YYYYMMDD` string once the weekly refresh has run. Bump it whenever a `data/*.json` file changes; the refresh workflow does it automatically.
- The literal versions asserted in `tests/bouquet-qa.mjs`, `tests/css-hygiene-qa.mjs`, and `tests/scrapbook-qa.mjs`.

**Catalog pipeline (Python, offline).** The scripts in `scripts/` run in roughly this order, as their docstrings describe:

1. `probe_nintendo_mx.py` and `probe_nintendo_switch_mx.py` download public Nintendo Store MX responses into `data/nintendo_probe/`.
2. `build_nintendo_mx_combined.py` builds a draft combined catalog from those raw files.
3. `validate_nintendo_mx_catalog.py` checks the draft.
4. `publish_nintendo_mx_snapshot.py` copies the validated draft to `data/nintendo_catalog*.json`, writes metadata, and keeps a backup of the previous snapshot.

`enrich_nintendo_catalog_from_raw.py` and `inspect_nintendo_mx_records.py` are supporting and diagnostic tools. Each catalog product carries a `url_key`; its official page is `https://www.nintendo.com/es-mx/store/products/<url_key>/`. In Explorar, the "Modo" filter reads `ways_to_play`, because `game_modes` is always empty for Nintendo products. Treat `data/nintendo_catalog*.json` as generated output. These scripts make network requests, so run them only when a catalog update is requested. Their schema is in `docs/NINTENDO_PRODUCT_SCHEMA.md`.

## Conventions

- **Language.** Code, comments, file names, and commit messages are in English. Visible UI text is in Mexican Spanish (`es-MX`). Game titles keep their English terms.
- **Commits.** Imperative English with a prefix: `feat:`, `fix:`, `data:`, `style:`, `docs:`. `main` is the release branch; put features on `feat/<name>` branches.
- **Data placeholders.** Unconfirmed fields are `"VERIFICAR"` or `null`. Never invent values. Prices are integer MXN with a `price_checked` date (`YYYY-MM-DD`).
- **Restricted content.** No eShop codes, keys, or credentials anywhere in the repo, fixtures and tests included. `.env` holds local secrets and is gitignored; do not print or commit it.
- **Language.** All visible text is Spanish, including toasts and labels built in `js/bouquet.js`. Only game titles and proper nouns stay in English.
- **Tips and tricks.** Every tip in the guide must be confirmed by a Nintendo page or a reliable outlet; `docs/TIPS_SOURCES.md` records the source and confidence of each, and what was left out and why. Add a row there with any new tip, and keep `tests/guide-tips-qa.mjs` in step.
- **Content rules.** Relevant emoji, symbols (`✦ ♡ ◈ →`) and micro-ASCII are welcome in the UI in moderation; keep code and commits emoji-free. In HTML, wrap each emoji in a `span` with `aria-hidden="true"` (`bouquet-qa.mjs` checks this). No religious iconography in the UI.
- **Accessibility.** Use semantic elements (`main`, `section`, `button`), not `div` with `onclick`. Spanish `alt` text on every image. Quiz options must be keyboard-navigable. Respect `prefers-reduced-motion`. Base text is at least 16px.
- **Python scripts.** `pathlib` for paths, type hints, output tags `[OK]` / `[WARN]` / `[FAIL]`, and a non-zero exit code when validation fails.
- **Release hygiene.** `tests/release-hygiene-qa.mjs` requires `docs/ROADMAP.md` to mention `v1.2.3` and to be free of "NFC". Keep that section intact when updating the roadmap.
- **Gitignored and generated.** `data/*_backups/`, `data/nintendo_probe/`, `docs/Handoff.md` (a local memory-transfer note), and `install_*.py` / `prepare_ui_audit_*.py` patch scripts are local artifacts. They are not source.

## Project rules (do not override without explicit approval)

- Static runtime only (GitHub Pages). No backend.
- Nintendo-only scope.
- Visual direction: Midnight Bouquet (single theme, no theme switcher).
- Beginner-first: explain every feature and step; user has never owned a Switch.
- Do NOT reintroduce: Chat, Gemini, Python backend, IGDB, NFC.
- NSO guide: no prices and no comparison with the basic NSO tier.
- Code and technical docs in English; UI copy in Spanish (Mexico).
- Never read or print .env contents.
