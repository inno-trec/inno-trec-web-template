# web-starter

The starter for an INNO-TREC web tool. Copy this app to start a tool of your own.

## What it shows

| Page | Pattern | File |
| --- | --- | --- |
| Overview | Headline numbers and a table in a card | `src/pages/DashboardPage.tsx` |
| Wallets | A list with a detail panel | `src/pages/WalletsPage.tsx` |
| Send credits | A step flow driven by a status | `src/pages/SendCreditsPage.tsx` |
| My wallet | A member screen with loading, empty and error states | `src/pages/MyWalletPage.tsx` |
| Any other address | A page not found | `src/pages/NotFoundPage.tsx` |

The frame around the pages (top bar, side navigation, page heading, footer) is `src/layouts/ToolShell.tsx`. The routes are in `src/App.tsx`.

The footer shows the EU funding emblem and statement. Every INNO-TREC tool keeps it.

## See the other states

`src/data/api.ts` is a fake backend: each request waits a moment and then answers. Add one of these to the address:

- `?demo=empty` shows a new member with no activity (My wallet).
- `?demo=error` makes every request fail (My wallet, and the last step of Send credits).

## Run it

From the repository root:

```sh
npm install
npm run dev
```

## Make it yours

1. Set `TOOL_NAME`, `USER` and `FOOTER_LINKS` (your privacy policy) in `src/layouts/ToolShell.tsx`.
2. Set the `<title>` and the icon in `index.html`.
3. Add your pages as described in [Getting started](../../docs/getting-started.md#3-add-a-page).
4. Replace `src/data/api.ts` and `src/data/sample.ts` with calls to your backend.

The data in `sample.ts` is example data from ECMS user story 4. Replace it before you show the tool to anyone.

## Where things come from

- `@inno-trec/ui-web` provides the components and `styles.css`.
- `@inno-trec/tokens` provides the Tailwind preset, used in `tailwind.config.js`.
- Neither package is edited here. Update them with `npm run sync:ds` from the root.

Documentation for everything else is in the root [`docs/`](../../docs) folder.
