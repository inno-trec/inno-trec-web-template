# Getting started

This guide takes you from nothing to a running tool with your own page, then covers connecting a backend, updating the design system and deploying.

## Before you begin

- Node 24 or newer. The repository pins the current LTS release in `.nvmrc`, so `nvm use` picks it.
- npm 11 or newer.
- Git.

## 1. Create your repository from the template

On GitHub, open this repository and choose **Use this template**, then **Create a new repository**. Clone your new repository and install:

```sh
git clone <your-repository-url>
cd <your-repository>
npm install
npm run dev
```

Vite serves the starter tool at <http://localhost:5173>. Open that address in a browser.

You now own a copy. It contains the design system packages and the starter app. Nothing connects it to this repository except what you choose to pull in later (see [Update the design system](#update-the-design-system)).

## 2. Make it your tool

Do these four things first.

1. **Rename the app.** In `apps/web-starter/package.json`, change `"name"`. If you rename the folder as well, update the `dev` script in the root `package.json`.
2. **Set the tool name.** In `apps/web-starter/src/layouts/ToolShell.tsx`, change `TOOL_NAME`. It appears in the top bar.
3. **Set the page title and icon.** In `apps/web-starter/index.html`, change `<title>` and add your icon.
4. **Remove the example pages you do not need.** Delete the files in `src/pages/`, their routes in `src/App.tsx`, and their entries in `NAV` in `ToolShell.tsx`. Delete `src/data/fakeServer.ts` and `src/data/synthetic.ts` when your own API replaces them. Keep the footer in `ToolShell.tsx`: it carries the EU funding emblem and statement.

The starter's pages fit monitoring, PV performance and maintenance tools. For a tool that shows energy credits, copy the pages you need from `apps/credits-example/src/pages/` (and its `src/data/`), and read the [credit rules](design-rules.md#energy-credits).

If your repository will hold only one tool, you can keep `apps/web-starter` as it is. If it will hold several, copy the folder once per tool and give each copy its own name.

## 3. Add a page

A page takes three steps.

**1. Create the page** in `src/pages/`:

```tsx
// src/pages/SettlementsPage.tsx
import { Card, DataTable } from '@inno-trec/ui-web';

export function SettlementsPage() {
  return (
    <Card title="Requests" flush>
      <DataTable columns={[{ key: 'member', header: 'Member' }]} rows={[]} emptyText="No requests yet." />
    </Card>
  );
}
```

**2. Add the route** in `src/App.tsx`:

```tsx
<Route path="settlements" element={<SettlementsPage />} />
```

**3. Add the menu entry** in the `NAV` list in `src/layouts/ToolShell.tsx`:

```tsx
{ id: '/settlements', href: '/settlements', label: 'Settlements', icon: 'exchange' },
```

The `label` is also the page heading. The shell draws it, so your page does not render its own title.

For the shape of common pages (overview, list with detail, step flow), see [Page patterns](page-patterns.md). For which component to pick, see the [component guide](reference/components.md).

## 4. Connect your backend

The pages call `src/data/api.ts`, the client of the INNO-TREC data API. Today it calls a simulated provider (`src/data/fakeServer.ts`) that answers in the shapes of the draft contract (`packages/api-contract/openapi.yaml`, see [API contract](api-contract.md)). To connect your backend, replace those calls with `fetch` and delete `fakeServer.ts` and `synthetic.ts`. When the contract changes, run `npm run api:types`: the compiler then lists every screen that must follow. Keep the loading, empty and error states that the pages show.

The design system has one rule here: **the interface displays what the backend reports and collects input.** Energy totals, shares, performance indicators, credit amounts and balances all come from the API. Do not calculate them in a component. The [design rules](design-rules.md#numbers-and-units) explain why.

Keep a short list of what your tool needs from the backend, because the components expect these shapes. They are typed in `packages/ui-web/src/index.d.ts`: `Movement`, `Wallet`, `WalletRow`, `Recipient` and the transaction, purpose and wallet vocabularies.

## 5. Check your work

```sh
npm run typecheck    # types in every workspace
npm run build        # type check and production build
npm test             # every page at 1440px and 400px: heading, no sideways scroll, no console errors
```

The first time, install the test browser with `npx -w web-starter playwright install chromium`. The tests find your pages through the side navigation, so a page you add to `NAV` is tested without changes to the tests.

Before you open a pull request, read the [design rules](design-rules.md) once. They are short.

## Update the design system

The components and tokens in `packages/` are copies. When the design system changes, update them:

```sh
# the design system repository sits next to yours
npm run sync:ds -- ../inno-trec-design-system
```

You can also set `INNO_TREC_DS=/path/to/design-system` once and run `npm run sync:ds`.

The script rewrites `packages/tokens/`, `packages/ui-web/` and `docs/reference/`, and updates `design-system.lock.json` with the design system version it copied. Then:

1. Read the diff in `packages/` and `docs/reference/`. Generated files change often when the design system changes.
2. Run `npm run build`. A type error usually means a component prop changed.
3. Look at your pages in the browser.
4. Commit the sync as its own commit, so the change is easy to review.

Never edit the files the script writes. The next sync overwrites them. If something in the design system is wrong, change it in the design system repository.

## Deploy

`npm run build -w web-starter` writes static files to `apps/web-starter/dist/`. Any static host can serve them.

The app uses client-side routes such as `/wallets`. Configure the host to answer every unknown path with `index.html`, or opening `/wallets` directly returns a 404. If your host cannot do that, switch the router in `src/main.tsx` from `BrowserRouter` to `HashRouter`.

If the tool is served from a sub-path such as `/ledger/`, set `base: '/ledger/'` in `vite.config.ts` and `basename="/ledger"` on the router.
