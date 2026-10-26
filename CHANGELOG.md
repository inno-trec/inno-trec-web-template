# Changelog

All notable changes to the template are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [semantic versioning](https://semver.org/). See "Releasing a version" in [Contributing](docs/contributing.md).

## [Unreleased]

### Added

- `Footer` component (design system): the EU funding emblem, the Horizon Europe funding statement and legal links. The starter shows it on every page with a link to the privacy policy, and the smoke tests check for the emblem.
- `wallet` icon (design system). The Wallets entry in the side navigation uses it.
- "My wallet" page in the starter: a member screen with loading, empty and error states.
- `src/data/api.ts`: a fake backend with a delay. Add `?demo=empty` or `?demo=error` to the address to see the other states.
- `npm run sync:ds` also copies the EU funding emblem to `packages/ui-web/assets/funding/`.

### Fixed

- The send flow no longer calculates the new balance in the interface. It reads `newBalance` from the (fake) backend and shows the backend's error code when the transfer is refused.
- The History and Suspend buttons on the Wallets page say in a comment that they are not connected yet.
- `TransferForm` (design system) no longer shows "After this you will have…" on the check step. That line subtracted the amount from the available credits in the interface.
- Every failed send or request now says "Your credits were not moved.", also for `INSUFFICIENT_BALANCE` and for a custom `errorMessage`.

## [0.1.0] - 2026-10-26

First release of the template.

### Added

- Design system tokens (`@inno-trec/tokens`) and React components (`@inno-trec/ui-web`), generated from the INNO-TREC design system by `npm run sync:ds`.
- The `web-starter` app: Vite, React 19, TypeScript 7, Tailwind 3.4 and React Router 8, with an overview, a wallet list and a send flow on sample data.
- Team documentation: getting started, page patterns, design rules, architecture, troubleshooting and decisions.
- Browser smoke tests (`npm test`) that open every page in the side navigation at 1440px and 400px wide and fail on sideways scroll, a missing heading or route, or a console error.
- `npm run check:generated`, which fails when a generated file was edited by hand. `npm run sync:ds` records a hash of every generated file in `design-system.lock.json`.
- CI on every pull request and push to `main`, on the Node in `.nvmrc` and on the newest Node release.
- Release workflow: pushing a `vX.Y.Z` tag publishes a GitHub release with the matching section of this file.
- Dependabot for npm packages and GitHub Actions.

### Requirements

- Node 24 LTS or newer, npm 11.

[Unreleased]: https://github.com/joaocarlos/inno-trec-template/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/joaocarlos/inno-trec-template/releases/tag/v0.1.0
