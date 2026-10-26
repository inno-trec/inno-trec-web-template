# Changelog

All notable changes to the template are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [semantic versioning](https://semver.org/). See "Releasing a version" in [Contributing](docs/contributing.md).

## [Unreleased]

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
