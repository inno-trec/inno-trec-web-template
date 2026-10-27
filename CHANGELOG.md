# Changelog

All notable changes to the template are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [semantic versioning](https://semver.org/). See "Releasing a version" in [Contributing](docs/contributing.md).

## [Unreleased]

### Changed

- **The starter is minimal, and the complete tool moved to `apps/template-demo`.** `web-starter` now holds the page frame, the account screens, the Users page, the client for the backend and one example page (`HomePage`) with the loading, empty and error states. It no longer depends on ECharts. The monitoring, PV performance, data checks, alerts and assets pages, the charts and the synthetic data are in `apps/template-demo` (`npm run dev:demo`), which the documentation site shows as the demo.
- `getting-started.md` names `src/config.ts` for the tool's name.
- **The template moved to gitlab.up.pt** (`inno-trec/inno-trec-web-template`). CI, the documentation site and releases run in GitLab CI (`.gitlab-ci.yml`); the GitHub workflows and Dependabot are removed. Teams copy the template into a new project instead of using GitHub's "Use this template".
- **The starter is no longer about credits.** `web-starter` now fits the monitoring, PV performance and maintenance tools: an energy overview with time-series charts and an asset list with maintenance suggestions, on synthetic data.
- **The credit pages moved to `apps/credits-example`** (ledger overview, wallets, send flow, "My wallet"). Run it with `npm run dev:credits`.
- The design rules separate the rules for every tool from the rules for credit screens, and add rules for charts.
- Times in the starter follow the community's time zone, which the fake backend sends, instead of the reader's. A reader in Tokyo and one in Lisbon see the same days, hours and totals. The backend also sets PV indicators and the reading interval.

### Added

- The component guide on the documentation site shows every component running. The examples are the design system's previews, copied by `npm run sync:ds` into `docs/reference/previews/` and built with the template's own React and `packages/ui-web` (`scripts/build-gallery.mjs`). Readers need no claude.ai account.
- Five components (design system): `Tabs`, `Pagination`, `EmptyState`, `Toast` and `FileUpload`. The Alerts page uses tabs by state with counts, pages and photos when an alert is resolved; the sample backend filters, counts and pages the alerts. Changes on the Alerts and Users pages end with a toast, and the starter's empty pages use `EmptyState`. New rules in "Forms" and "Lists and empty sections".
- Account screens in the starter: sign in (with "keep me signed in" and a return to the page asked for), ask for an account with a manager's approval on the Users page, accept an invitation, forgot and reset password, "Your account" (profile and password) and sign out. Pages without a session redirect to sign in, and `roles` in `NAV` hide pages from other roles. Pattern 10 describes them.
- `AuthLayout` and `PasswordField` (design system): the frame of the screens without a session, and a password field with a Show/Hide button.
- Documentation website (VitePress) built from `docs/`, with the starter as a live demo; the `pages` job publishes it to GitLab Pages. `npm run docs:dev` previews it.
- The starter's router follows `base` in `vite.config.ts`, so the app also works under a sub-path.
- The starter's sample backend answers in the shapes of `src/data/types.ts`; `api.ts` turns every failure into an `ApiError` with messages per field.
- PV performance page: indicators per system against history and the community, `BarChart` with a dotted reference line.
- Data checks page: agreement between data sources, with a tolerance band in `TimeSeriesChart`.
- Alerts page: corrective and predictive alerts with filters, acknowledge and resolve. Assets show their open alerts.
- Chart rules (design system): reference lines, bars, and comparing data sources.
- Form components (design system): `Textarea`, `DateField`, `DateRangeField`, `Checkbox`, `RadioGroup`, `Switch`, and `Dialog` on the browser's `<dialog>` element.
- "Users" page in the starter: invite, edit and deactivate users with forms in dialogs, field errors from the backend and a confirmation before deactivating. A smoke test runs the whole flow. New "Forms in dialogs" pattern and form rules in the docs.
- Chart series colors (design system): `series-consumption`, `series-pv`, `series-storage` and `series-grid`. Each has a fixed meaning. They were checked together for contrast and for colorblind readers. They are in `DESIGN.md` and in the brand book's new "Charts" section.
- `TimeSeriesChart` in the starter, built on Apache ECharts 6. It applies the chart rules (fixed colors, one y-axis, legend, dashed estimates, gaps for missing data) and loads on demand.
- Synthetic 15-minute readings for a small community (`src/data/synthetic.ts`), and a fake backend (`src/data/api.ts`) with loading, empty and error states. Add `?demo=empty` or `?demo=error` to the address.
- "My wallet" page in `credits-example`: a member screen with loading, empty and error states.
- `Footer` component (design system): the EU funding emblem, the Horizon Europe funding statement and legal links. Both apps show it on every page with a link to the privacy policy, and the smoke tests check for the emblem.
- `wallet` icon (design system).
- `npm run sync:ds` also copies the EU funding emblem to `packages/ui-web/assets/funding/`.
- Decisions 9 (Apache ECharts) and 10 (one neutral starter, one example per domain).


### Fixed

- `import { colors } from '@inno-trec/tokens'` failed in Vite, because the package shipped CommonJS only. It now also ships an ES module (`tokens.mjs`).
- The send flow no longer calculates the new balance in the interface. It reads `newBalance` from the (fake) backend and shows the backend's error code when the transfer is refused.
- `TransferForm` (design system) no longer shows "After this you will have…" on the check step. That line subtracted the amount from the available credits in the interface.
- Every failed send or request now says "Your credits were not moved.", also for `INSUFFICIENT_BALANCE` and for a custom `errorMessage`.
- The History and Suspend buttons on the Wallets page say in a comment that they are not connected yet.

## [0.1.0] - 2026-10-26

First release of the template.

### Added

- Design system tokens (`@inno-trec/tokens`) and React components (`@inno-trec/ui-web`), generated from the INNO-TREC design system by `npm run sync:ds`.
- The `web-starter` app: Vite, React 19, TypeScript 7, Tailwind 3.4 and React Router 8, with an overview, a wallet list and a send flow on sample data.
- Team documentation: getting started, page patterns, design rules, architecture and troubleshooting.
- Browser smoke tests (`npm test`) that open every page in the side navigation at 1440px and 400px wide and fail on sideways scroll, a missing heading or route, or a console error.
- `npm run check:generated`, which fails when a generated file was edited by hand. `npm run sync:ds` records a hash of every generated file in `design-system.lock.json`.
- CI on every pull request and push to `main`, on the Node in `.nvmrc` and on the newest Node release.
- Release workflow: pushing a `vX.Y.Z` tag publishes a GitHub release with the matching section of this file.
- Dependabot for npm packages and GitHub Actions.

### Requirements

- Node 24 LTS or newer, npm 11.

[Unreleased]: https://gitlab.up.pt/inno-trec/inno-trec-web-template/-/compare/v0.1.0...main
[0.1.0]: https://gitlab.up.pt/inno-trec/inno-trec-web-template/-/tags/v0.1.0
