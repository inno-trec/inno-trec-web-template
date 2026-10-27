# Getting started

This guide takes you from nothing to a running tool with your own page, then covers connecting a backend, updating the design system and deploying.

## Before you begin

- Node 24 or newer (`nvm use` picks the version in the project's `.nvmrc`).
- npm 11 or newer.
- Git.

## 1. Create your tool

```sh
npm create @inno-trec/tool my-tool
cd my-tool
npm install
npm run dev
```

Vite serves the tool at <http://localhost:5173>. Open that address in a browser and sign in with the sample account `ana.ribeiro@example.org`, password `sample-password`.

The command copies the starter into `my-tool/`: the page frame, the account screens, the Users page and one example page. The components and tokens are npm packages (`@inno-trec/ui-web` and `@inno-trec/tokens`), so the folder holds only your tool's code. Put it in Git and push it to your own project:

```sh
git init
git add -A
git commit -m "Start from the INNO-TREC starter"
git remote add origin <your-project-url>
git push -u origin main
```

## 2. Make it your tool

Do these four things first.

1. **Set the tool name.** In `src/config.ts`, change `TOOL_NAME`. It appears in the top bar and on the sign-in screens. Set `PRIVACY_URL` and `FOOTER_LINKS` in the same file.
2. **Set the page title and icon.** In `index.html`, change `<title>` and add your icon.
3. **Replace the example page.** `src/pages/HomePage.tsx` lists sample records and shows the loading, empty and error states. Make it your tool's first page, or delete it with its route in `src/App.tsx` and its entry in `NAV` in `src/layouts/ToolShell.tsx`.
4. **Keep the footer** in `ToolShell.tsx`: it carries the EU funding emblem and statement.

The starter also holds the account screens (sign in, ask for an account, invitation, password reset, the person's account) and the Users page. Keep them, or delete the ones your identity provider replaces.

For complete pages, copy from the example apps in the [template repository](https://gitlab.up.pt/inno-trec/inno-trec-web-template):

- `apps/template-demo` holds the monitoring, PV performance and maintenance pages: an energy overview with charts, PV performance, data checks, alerts and assets. The demo on this site runs it. A page with a chart also needs `src/charts/`, `src/time/zone.ts` and the `echarts` dependency.
- `apps/credits-example` holds the credit screens. Read the [credit rules](design-rules.md#energy-credits) before you use them.

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

The pages call `src/data/api.ts`. Today it calls a sample backend (`src/data/fakeServer.ts`) that answers in the shapes of `src/data/types.ts`. To connect your backend:

1. Replace the types in `types.ts` with your backend's. If your backend publishes an OpenAPI description, `npx openapi-typescript <url> -o src/data/schema.d.ts` generates them.
2. Replace each call in `api.ts` with `fetch`. Turn your backend's errors into `ApiError`: a code for the whole request, and one message per field when it rejects a value. The forms show those messages under the fields.
3. Delete `fakeServer.ts`, and follow the compiler.

Keep the loading, empty and error states that the pages show.

### Accounts and sign-in

The screens without a session are in `src/pages/auth/` (sign in, ask for an account, accept an invitation, forgot and reset password); the person's own account is `src/pages/AccountPage.tsx`. `src/auth/session.tsx` holds who is signed in, sends people without a session to `/sign-in`, and hides pages by role (`roles` in `NAV`). The sample keeps the session in the browser; replace it with what your backend or identity provider gives you, and delete the "Sample accounts" note on the sign-in screen. If your tools share an OpenID Connect provider such as Keycloak, its sign-in pages replace these screens, and these screens are the design for its theme.

The design system has one rule here: **the interface displays what the backend reports and collects input.** Energy totals, shares, performance indicators, credit amounts and balances all come from the API. Do not calculate them in a component. The [design rules](design-rules.md#numbers-and-units) explain why.

Keep a short list of what your tool needs from the backend, because the components expect these shapes. They are typed in `node_modules/@inno-trec/ui-web/src/index.d.ts`: `Movement`, `Wallet`, `WalletRow`, `Recipient` and the transaction, purpose and wallet vocabularies.

## 5. Check your work

```sh
npm run typecheck    # types
npm run build        # type check and production build
npm test             # every page at 1440px and 400px: heading, no sideways scroll, no console errors
```

The first time, install the test browser with `npx playwright install chromium`. The tests find your pages through the side navigation, so a page you add to `NAV` is tested without changes to the tests.

Before you open a merge request, read the [design rules](design-rules.md) once. They are short.

## Update the design system

The components and tokens are npm packages. Each template release publishes both, with the same version. To take a new release:

```sh
npm outdated @inno-trec/ui-web @inno-trec/tokens   # what is new
npm update @inno-trec/ui-web @inno-trec/tokens     # within the version range in package.json
```

`npm update` brings every release with the same major version, for example from 1.0.0 to 1.4.2. Design system updates and fixes come this way. A new major version (2.0.0) means you must change your own code: read its section in the [changelog](https://gitlab.up.pt/inno-trec/inno-trec-web-template/-/blob/main/CHANGELOG.md) first, then install it with `npm install @inno-trec/ui-web@latest @inno-trec/tokens@latest`. Then:

1. Run `npm run build`. A type error usually means a component prop changed.
2. Look at your pages in the browser, and run `npm test`.
3. Commit the update as its own commit, so the change is easy to review.

Never change the packages inside `node_modules`. If something in the design system is wrong, tell the design system owners.

The pages, layouts and data code that `npm create` copied are yours, so an update does not change them. To take a fix to the starter's own pages, compare your file with the starter in the template repository (`apps/web-starter`).

## Deploy

`npm run build` writes static files to `dist/`. Any static host can serve them.

The app uses client-side routes such as `/wallets`. Configure the host to answer every unknown path with `index.html`, or opening `/wallets` directly returns a 404. If your host cannot do that, switch the router in `src/main.tsx` from `BrowserRouter` to `HashRouter`.

If the tool is served from a sub-path such as `/ledger/`, set `base: '/ledger/'` in `vite.config.ts`. The router and the navigation links follow it.
