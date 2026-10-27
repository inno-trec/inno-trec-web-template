# Getting started

This guide takes you from nothing to a running tool with your own page, then covers connecting a backend, updating the design system and deploying.

## Before you begin

- Node 24 or newer. The repository pins the current LTS release in `.nvmrc`, so `nvm use` picks it.
- npm 11 or newer.
- Git.

## 1. Create your repository from the template

On gitlab.up.pt, create an empty project for your tool (no README). Then copy the template into it and install:

```sh
git clone git@gitlab.up.pt:inno-trec/inno-trec-web-template.git my-tool
cd my-tool
git remote rename origin template          # keep the template to compare updates later
git remote add origin <your-project-ssh-url>
git push -u origin main
npm install
npm run dev
```

SSH to gitlab.up.pt works only from the University of Porto network or its VPN. Elsewhere, use the HTTPS addresses with a personal access token.

Vite serves the starter at <http://localhost:5173>. Open that address in a browser.

You now own a copy. It contains the design system packages, the starter app (`apps/web-starter`) and two example apps (`apps/template-demo` and `apps/credits-example`). Nothing connects it to this repository except what you choose to pull in later (see [Update the design system](#update-the-design-system)).

## 2. Make it your tool

Do these four things first.

1. **Rename the app.** In `apps/web-starter/package.json`, change `"name"`. If you rename the folder as well, update the `dev` script in the root `package.json`.
2. **Set the tool name.** In `apps/web-starter/src/config.ts`, change `TOOL_NAME`. It appears in the top bar and on the sign-in screens. Set `PRIVACY_URL` and `FOOTER_LINKS` in the same file.
3. **Set the page title and icon.** In `apps/web-starter/index.html`, change `<title>` and add your icon.
4. **Replace the example page.** `src/pages/HomePage.tsx` lists sample records and shows the loading, empty and error states. Make it your tool's first page, or delete it with its route in `src/App.tsx` and its entry in `NAV` in `ToolShell.tsx`. Keep the footer in `ToolShell.tsx`: it carries the EU funding emblem and statement.

The starter also holds the account screens (sign in, ask for an account, invitation, password reset, the person's account) and the Users page. Keep them, or delete the ones your identity provider replaces.

For complete pages, copy from the example apps:

- `apps/template-demo` (run it with `npm run dev:demo`) holds the monitoring, PV performance and maintenance pages: an energy overview with charts, PV performance, data checks, alerts and assets. A page with a chart also needs `src/charts/` and the `echarts` dependency.
- `apps/credits-example` (`npm run dev:credits`) holds the credit screens. Read the [credit rules](design-rules.md#energy-credits) before you use them.

Delete the example apps from your copy when you no longer need them. The `pages` job in `.gitlab-ci.yml` publishes `apps/template-demo` as the demo: if you delete that app, delete the job too, or change `scripts/build-pages.mjs` to build your own app.

If your repository will hold only one tool, keep `apps/web-starter` and rename it. If it will hold several, copy the folder once per tool and give each copy its own name.

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

Keep a short list of what your tool needs from the backend, because the components expect these shapes. They are typed in `packages/ui-web/src/index.d.ts`: `Movement`, `Wallet`, `WalletRow`, `Recipient` and the transaction, purpose and wallet vocabularies.

## 5. Check your work

```sh
npm run typecheck    # types in every workspace
npm run build        # type check and production build
npm test             # every page at 1440px and 400px: heading, no sideways scroll, no console errors
```

The first time, install the test browser with `npx -w web-starter playwright install chromium`. The tests find your pages through the side navigation, so a page you add to `NAV` is tested without changes to the tests.

Before you open a merge request, read the [design rules](design-rules.md) once. They are short.

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

If the tool is served from a sub-path such as `/ledger/`, set `base: '/ledger/'` in `vite.config.ts`. The router and the navigation links follow it.
