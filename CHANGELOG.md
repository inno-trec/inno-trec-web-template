# Changelog

All notable changes to the template are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [semantic versioning](https://semver.org/). See "Releasing a version" in [Contributing](docs/contributing.md).

## [Unreleased]

### Added

- CI on every pull request and push to `main`: generated-file check, type check, build and browser tests, on the Node in `.nvmrc` and on the newest Node release.
- Browser smoke tests (`npm test`) that open every page in the side navigation at 1440px and 400px wide.
- `npm run check:generated`, which fails when a generated file was edited by hand. `npm run sync:ds` now records a hash of every generated file in `design-system.lock.json`.
- Release workflow: pushing a `vX.Y.Z` tag publishes a GitHub release with the matching section of this file.
- Dependabot for npm packages and GitHub Actions.
- Decisions 7 (newest stable versions) and 8 (browser smoke tests).

### Changed

- Node 24 LTS is required (was 20), and `.nvmrc` pins 24.
- React Router 7 → 8, TypeScript 5.9 → 7.0, Vite 8.3.5, PostCSS 8.5.31.

## [0.1.0] - 2026-10-26

### Added

- First version: design system tokens and React components, the `web-starter` app, and team documentation.

[Unreleased]: https://github.com/joaocarlos/inno-treck-template/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/joaocarlos/inno-treck-template/releases/tag/v0.1.0
