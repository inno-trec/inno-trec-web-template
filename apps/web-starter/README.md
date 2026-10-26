# web-starter

The starter for an INNO-TREC web tool. Copy this app to start a tool of your own.

## What it shows

| Page | Pattern | File |
| --- | --- | --- |
| Overview | Headline numbers and a table in a card | `src/pages/DashboardPage.tsx` |
| Wallets | A list with a detail panel | `src/pages/WalletsPage.tsx` |
| Send credits | A step flow driven by a status | `src/pages/SendCreditsPage.tsx` |
| Any other address | A page not found | `src/pages/NotFoundPage.tsx` |

The frame around the pages (top bar, side navigation, page heading) is `src/layouts/ToolShell.tsx`. The routes are in `src/App.tsx`.

## Run it

From the repository root:

```sh
npm install
npm run dev
```

## Make it yours

1. Set `TOOL_NAME` and `USER` in `src/layouts/ToolShell.tsx`.
2. Set the `<title>` and the icon in `index.html`.
3. Add your pages as described in [Getting started](../../docs/getting-started.md#3-add-a-page).
4. Replace `src/data/sample.ts` with calls to your backend.

The data in `sample.ts` is example data from ECMS user story 4. Replace it before you show the tool to anyone.

## Where things come from

- `@inno-trec/ui-web` provides the components and `styles.css`.
- `@inno-trec/tokens` provides the Tailwind preset, used in `tailwind.config.js`.
- Neither package is edited here. Update them with `npm run sync:ds` from the root.

Documentation for everything else is in the root [`docs/`](../../docs) folder.
