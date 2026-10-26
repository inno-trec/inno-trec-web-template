# Architecture

## The pieces

```text
INNO-TREC design system repository          (source of truth: tokens, components, brand rules)
        │
        │  npm run sync:ds
        ▼
┌──────────────────────────── this repository ────────────────────────────┐
│  packages/tokens     tokens.json → Tailwind preset, CSS variables, JS    │
│  packages/ui-web     components as an ES module + one stylesheet + logos │
│  docs/reference      brand book, component guide, open questions         │
│  packages/api-contract  draft data contract with WP2 (OpenAPI) and types │
│                                                                          │
│  apps/web-starter    starter app: monitoring and maintenance pages       │
│  apps/credits-example  example pages for energy credit tools             │
└──────────────────────────────────────────────────────────────────────────┘
        │
        │  "Use this template"
        ▼
each team's own repository                  (their tools, their backend)
```

The design system repository decides how things look and behave. This repository decides how a team starts a tool with that look. Each team's repository decides what the tool does.

## Which part owns what

| You want to change | Change it in |
| --- | --- |
| A color, a font size, a spacing step | The design system repository, then `npm run sync:ds` |
| How a component looks or behaves | The design system repository, then `npm run sync:ds` |
| Brand or content rules | The design system repository, then `npm run sync:ds` |
| The page frame, example pages or setup | This template (`apps/web-starter`) |
| Your tool's pages, data and routes | Your own repository |

`packages/tokens` and `packages/ui-web` are generated. Each generated file starts with a `GENERATED` comment. Edits to them are lost at the next sync.

## How styling works

Two layers, with a clear split:

1. **Components own their appearance.** `@inno-trec/ui-web/styles.css` holds the fonts, the token variables (`--ink`, `--light-blue` and so on) and the styles of every component. A `Button` looks the same everywhere because its styles live in one stylesheet.
2. **Tailwind owns layout around components.** Use it for grids, gaps, widths and responsive behavior. The token preset gives Tailwind the design system's colors, type scale, spacing and square corners, so classes like `gap-space-4` and `text-ink-muted` match the components.

Do not restyle a component with Tailwind classes (for example, a different background on a `Button`). If a component does not fit your need, raise it with the design system.

Tailwind's own reset (preflight) is switched off in the preset. The component styles set their own base styles, and the reset would change how plain elements next to them render. Details are in [Tokens and Tailwind](tokens-and-tailwind.md).

## The packages

### `@inno-trec/tokens`

Built by `packages/tokens/scripts/build.mjs` from `tokens.json`. It produces:

| Output | Use it for |
| --- | --- |
| `@inno-trec/tokens/tailwind-preset` | The Tailwind preset. Add it to `presets` in `tailwind.config.js`. |
| `@inno-trec/tokens/tokens.css` | The CSS variables on their own. `ui-web/styles.css` already includes them. |
| `@inno-trec/tokens` | Plain constants (`colors`, `fontSize`, `spacing`) for places a class name cannot go, such as chart colors. It ships as an ES module (`tokens.mjs`, used by Vite) and as CommonJS (`tokens.cjs`). |

The preset holds literal values only, with no CSS variables. That keeps it usable by NativeWind in the mobile app. See [Mobile](mobile.md).

### `@inno-trec/ui-web`

`scripts/sync-design-system.mjs` converts the design system's `bundle.js` (a script that sets `window.InnoTrec`) into an ES module with named exports, and copies its type definitions and stylesheet. You import components like any library:

```tsx
import { Button, Card } from '@inno-trec/ui-web';
import '@inno-trec/ui-web/styles.css';
```

The package has no build step. Vite compiles it as source.

## The starter app

```text
apps/web-starter/src/
  main.tsx              entry: router, global styles
  App.tsx               the list of routes
  index.css             Tailwind, and one workaround for the top bar on phones
  layouts/ToolShell.tsx top bar, side navigation, page heading, footer
  pages/                one file per screen (Overview, PV performance, Data checks, Alerts, Assets, Users, not found)
  charts/               TimeSeriesChart (ECharts), its lazy loader, number and time formats
  data/api.ts           the API client the pages call (types from @inno-trec/api-contract)
  data/fakeServer.ts    simulated WP2 provider in the contract's shapes (?demo=empty, ?demo=error)
  data/synthetic.ts     synthetic 15-minute readings behind the simulated provider
  labels.ts             words and tones for the codes the API sends
```

`apps/credits-example` has the same structure, with the credit pages (ledger overview, wallets, send flow, member wallet) and ECMS sample data.

`ToolShell` uses the design system's `AppShell` and turns its navigation items into router links. Pages render inside it.

## Web and mobile

The components in `ui-web` are DOM-based React and run on the web only. The mobile app, built with Expo and NativeWind, does not use them. Web and mobile share the tokens, so both look the same, and each has its own components. See [Decisions](decisions.md) for the reasoning.
