# INNO-TREC template

A starting point for INNO-TREC web tools. It packages the INNO-TREC design system (colors, type, components) with a working React app, so a team can build a new tool by changing pages instead of setting up styling and navigation from scratch.

The repository holds the template and example apps only. Each team builds its own solution from it.

## Start in two minutes

```sh
npm install
npm run dev          # serves the starter at http://localhost:5173
```

You get a tool with a top bar, side navigation and three example pages: an overview with a table, a wallet list with a detail panel, and a three-step send flow. Edit `apps/web-starter/src/pages/` and the browser updates.

To build a tool of your own, read [Getting started](docs/getting-started.md).

## What is inside

| Path | What it is |
| --- | --- |
| `apps/web-starter/` | The starter app: Vite, React 19, TypeScript, Tailwind. Copy it to start a tool. |
| `packages/ui-web/` | The design system components for React on the web, with their styles and logos. Generated. |
| `packages/tokens/` | The design tokens as a Tailwind preset, CSS variables and JavaScript constants. Generated. |
| `docs/` | The documentation. Start with the table below. |
| `scripts/` | `sync-design-system.mjs` copies the design system into `packages/` and `docs/reference/`. `export-tokens.mjs` copies the tokens into another project. |
| `design-system.lock.json` | Which version of the design system this copy came from, and a hash of every generated file. |
| `CHANGELOG.md` | What changed in each version of the template. |

The two packages are generated from the design system repository. Do not edit them by hand: change the design system, then run `npm run sync:ds`.

## Documentation

| Read this | When you want to |
| --- | --- |
| [Getting started](docs/getting-started.md) | Create a tool, add a page, connect your backend, deploy |
| [Page patterns](docs/page-patterns.md) | Build an overview, a list with detail, a step flow, or a form the way the design system expects |
| [Design rules](docs/design-rules.md) | Check what the design system requires before you design a screen |
| [Components](docs/reference/components.md) | Look up when to use each of the 25 components and what it needs |
| [Tokens and Tailwind](docs/tokens-and-tailwind.md) | Use the right class names, colors and spacing |
| [Architecture](docs/architecture.md) | Understand how the repository fits together |
| [Troubleshooting](docs/troubleshooting.md) | Fix a problem someone has already hit |
| [Contributing](docs/contributing.md) | Change the template itself |
| [Decisions](docs/decisions.md) | Learn why it is built this way, and what is still open |
| [Mobile](docs/mobile.md) | See how the mobile app shares tokens with the web tools |
| [Open questions](docs/reference/open-questions.md) | See where the ECMS specification is ambiguous. Components do not decide these. |

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the starter app with hot reload |
| `npm run typecheck` | Checks types in every workspace |
| `npm run build` | Type checks and builds every app into its own `dist/` folder |
| `npm test` | Runs the browser smoke tests of every app at 1440px and 400px wide |
| `npm run check:generated` | Fails if a generated file was edited by hand |
| `npm run tokens` | Rebuilds the tokens package from `tokens.json` |
| `npm run sync:ds` | Copies the latest design system into this repository |
| `npm run export:tokens -- <folder>` | Copies the tokens into another project, such as the mobile app |

## What this template does not include

- **A mobile app.** The mobile app lives elsewhere and shares only the tokens. See [Mobile](docs/mobile.md).
- **Authentication, an API client or state management.** The starter uses sample data in `src/data/sample.ts`. Replace it with your backend.
- **Unit tests.** The starter has browser smoke tests (`npm test`), not unit tests. Add a unit test runner when your tool has logic of its own.
- **Deployment setup.** `npm run build` produces static files. Where they go is your team's choice.

## Versions this was verified with

Node 24 (LTS) and 26, npm 11, React 19.3, Vite 8, TypeScript 7, Tailwind 3.4, React Router 8. The design system components were written for React 18 and render correctly on 19 in the starter. See [Decisions](docs/decisions.md) for why Tailwind stays on 3.4.
