# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

When asked to explain something, explain it using the spirit of ASD STE100. Keep sentence structures direct, limit procedural steps to single actions and avoid unnecessary synonyms.

## What this repository is

A starter template for INNO-TREC web tools: energy monitoring (consumption, PV, storage), PV yield and performance, asset maintenance, and the energy credit system (ECMS). It packages the INNO-TREC design system (tokens, React components, brand rules) with a working React app, so teams copy the repository ("Use this template") and build their own tool on top of it. The goal is a setup that different frontend and backend stacks can reuse: the tokens package is the stack-neutral layer (Tailwind preset, CSS variables, JS constants), and `ui-web` is the React-on-the-web layer.

The design system itself lives in a separate repository (by default `../inno-trec-design-system`, also published in Claude Design). It is the source of truth for anything visual.

## Commands

Run everything from the repository root. The packages are npm workspaces and link only from the root (`npm install` inside an app breaks `@inno-trec/*` resolution).

```sh
npm install
npm run dev                          # web-starter at http://localhost:5173
npm run dev:credits                  # credits-example (ECMS pages)
npm run typecheck                    # tsc --noEmit in every workspace
npm run build                        # typecheck + vite build for every app (apps/*/dist/)
npm test                             # Playwright smoke tests (needs: npx -w web-starter playwright install chromium)
npx -w web-starter playwright test -g "unknown"   # run one test by name
npm run check:generated              # fail if a generated file differs from its hash in design-system.lock.json
npm run build -w web-starter         # build one app
npm run tokens                       # rebuild packages/tokens/dist from tokens.json
npm run sync:ds [-- <path-to-ds>]    # copy the design system in (or set INNO_TREC_DS)
npm run export:tokens -- <folder>    # copy tokens into another project (e.g. the Expo app)
```

There is no linter and no unit test runner. CI (`.github/workflows/ci.yml`) runs `check:generated`, `typecheck`, `build` and `npm test` on the Node in `.nvmrc` (required) and on the newest Node (warning only). The smoke tests in `apps/web-starter/e2e/` open every page listed in the side navigation at 1440px and 400px wide and fail on sideways scroll, a missing heading or a console error. They read the pages from the rendered nav, so a new `NAV` entry is tested automatically. A wide table in its own scroll container does not count as sideways scroll.

Versions: the template version is the root `package.json` version, recorded in `CHANGELOG.md` (Keep a Changelog). Pushing a `vX.Y.Z` tag runs `.github/workflows/release.yml`, which checks the tag against `package.json` and `CHANGELOG.md` and creates the GitHub release. Add every user-visible change under `## [Unreleased]` in `CHANGELOG.md`.

Node: `.nvmrc` pins the newest LTS release (24); `engines` requires >= 24. The policy is "newest stable": see decision 7 in `docs/decisions.md`.

## Architecture

```text
design system repo ──npm run sync:ds──► packages/tokens, packages/ui-web, docs/reference, design-system.lock.json
                                              │
                                              ▼
                                      apps/web-starter (Vite + React 19 + TS + Tailwind 3.4 + React Router 8 + ECharts 6)
                                      apps/credits-example (same stack, credit pages)
```

### Generated files: never edit by hand

`scripts/sync-design-system.mjs` overwrites these; edits are lost at the next sync:

- `packages/tokens/tokens.json` and `packages/tokens/dist/*`
- `packages/ui-web/src/*` and `packages/ui-web/assets/` (logos and the EU funding emblem; its `package.json` is hand-maintained)
- `docs/reference/*`
- `design-system.lock.json`

Generated files start with a `GENERATED` banner. The sync records a SHA-256 hash of each one in `design-system.lock.json`, and `npm run check:generated` fails in CI when a file differs. Only re-running the sync updates the hashes. To change a color, component or brand rule, change the design system repository and re-sync. If the sync script fails because `bundle.js` changed shape, fix the script, not the output.

### How the generated packages are produced

- **`@inno-trec/tokens`**: `packages/tokens/scripts/build.mjs` reads `tokens.json` (resolving `{alias}` color references) and writes a Tailwind preset (`tailwind-preset.cjs`), `tokens.css` (`:root` variables) and constants as `tokens.mjs` (ES module, what Vite imports), `tokens.cjs` and `tokens.d.ts`. The preset holds literal values only, no CSS variables, so NativeWind on mobile can use it too. It disables preflight, replaces `borderRadius` with `none`/`sm`/`full`, and removes shadows.
- **`@inno-trec/ui-web`**: the sync script rewrites the design system's `bundle.js` (an IIFE that sets `window.InnoTrec` and reads `window.React`) into an ES module with named exports. It strips the global from `index.d.ts` and concatenates the Google Fonts import, `tokens.css` and `bundle.css` into `styles.css`. There is no build step; Vite compiles it as source.

### Styling split

1. Components own their appearance through `@inno-trec/ui-web/styles.css` (classes prefixed `it-`).
2. Tailwind handles layout around components only (grids, gaps, widths, responsive behavior), using token class names such as `gap-space-4`, `text-ink-muted` and `bg-light-blue text-on-light-blue`. Do not restyle components with Tailwind.
3. Preflight is off, so bare `<h1>`/`<p>` keep browser margins. The `AppShell` draws the page heading, so pages do not render their own title.

### Starter app wiring (`apps/web-starter`)

- `src/main.tsx`: `BrowserRouter`, imports `styles.css` and then `index.css`.
- `src/App.tsx`: routes nested under `ToolShell`.
- `src/layouts/ToolShell.tsx`: wraps the design system `AppShell`. The `NAV` array drives both the side navigation and the page heading (`label`). `TOOL_NAME` and `USER` are placeholders. It passes a `Footer` with the EU funding emblem (`@inno-trec/ui-web/assets/funding/eu-funded-negative.png`) and `FOOTER_LINKS`; every tool keeps the footer.
- Adding a page takes three edits: a file in `src/pages/`, a `<Route>` in `App.tsx`, and a `NAV` entry.
- Pages: `OverviewPage.tsx` (monitoring: period filter, `StatTile` totals, power chart in kW, battery chart in %, table view) and `AssetsPage.tsx` (list with detail, status, data quality, maintenance suggestions from the backend). Both show loading, empty and error states.
- `src/charts/TimeSeriesChart.tsx` wraps Apache ECharts (tree-shaken imports from `echarts/core`). It takes `SeriesSpec`s whose `color` must be a series token (`colors['series-pv']` from `@inno-trec/tokens`), draws one y-axis, a legend, end labels when they fit, dashed estimates and gaps for `null`. Pages import `LazyTimeSeriesChart`, which loads ECharts on demand. `src/charts/format.ts` holds the shared number and time formats.
- Times follow the community's time zone, sent by the backend (`EnergyReport.timeZone`), never the reader's. `src/time/zone.ts` converts with `Intl` only; `TimeSeriesChart` shifts instants by the zone offset and sets `useUTC`, because ECharts has no time zone option. Pass `timeZone` to the chart and to the `format.ts` functions.
- `src/data/synthetic.ts` generates deterministic synthetic 15-minute readings. `src/data/api.ts` is a fake backend over it that also computes totals and table rows (a delay, and `?demo=empty` / `?demo=error` in the address to show the other states). There is no real API client, auth or state library.
- `src/index.css` holds a workaround that hides the `TopBar` title and user below 560px. Remove it when the design system fixes the gap.

`apps/credits-example` holds the ECMS pages (ledger overview, wallets, send flow, member wallet) with ECMS sample data, its own fake backend and the same smoke tests on port 4174. `apps/*` may hold more example apps. Each one depends on `@inno-trec/tokens` and `@inno-trec/ui-web` at version `*`, should teach one domain or pattern, and needs its own Playwright port (see `docs/contributing.md`).

## Design-system rules that shape code

The full lists are in `docs/design-rules.md` and `docs/page-patterns.md`. These are the rules most often broken:

All tools:

- The backend computes every figure (energy totals, shares, PV indicators, credit amounts, balances). The interface formats and displays them.
- Every number has its unit. Missing data is never zero: a gap in a chart, "No data" in a table.
- Charts use the series tokens (`series-consumption`, `series-pv`, `series-storage`, `series-grid`), each with a fixed meaning, never the brand `green`/`orange`. One y-axis per chart, a legend, text in `ink`.
- A `DataTable` inside a `Card` uses `flush` and no `caption`.
- Allow one primary button per screen. Pair every icon and color with text. No shadows, gradients or rounded cards.
- Keep the `Footer` with the EU funding emblem on every page.

Credit screens only:

- A negative balance is normal: show it with a real minus sign (−) in normal text, never red. Never predict a balance in the UI.
- Member screens never show EC, wallet IDs, purpose codes, hashes or formulas.
- Do not decide anything listed in `docs/reference/open-questions.md` in the UI; flag it instead.
- Use American English for interface text and docs, and write the project name as "INNO-TREC".

## Constraints to keep (see `docs/decisions.md`)

- Stay on Tailwind 3.4. NativeWind 4 (mobile) needs `tailwindcss ~3`, and web and mobile share the preset. Never run `npm audit fix --force`, because it upgrades to Tailwind 4.
- Web and mobile share tokens, not components. The Expo app lives in a separate repository and receives tokens via `export:tokens`.
- Use Vite with client-side routing, not a framework. Deployment is static; for sub-path hosting set `base` in `vite.config.ts` and `basename` on the router.
- The packages are copied into each team's repository, not published.
- Charts use Apache ECharts with tree-shaken imports, loaded on demand (decision 9).

## Documentation map

The `docs/` files were checked against a running copy; keep them accurate when behavior changes. Start with `docs/getting-started.md` (team workflow), `docs/architecture.md`, `docs/tokens-and-tailwind.md` (class names), `docs/troubleshooting.md` (known issues) and `docs/reference/components.md` (when to use each of the 26 components; props are typed in `packages/ui-web/src/index.d.ts`).
