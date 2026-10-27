# web-starter

The starter for an INNO-TREC web tool. Copy this app to start a tool of your own. It holds what every tool needs, and one example page to replace with your first page.

For complete pages to copy, see the example apps: [`template-demo`](../template-demo) (monitoring, PV performance, maintenance, charts) and [`credits-example`](../credits-example) (credit screens).

## What it holds

| Page | What it does | File |
| --- | --- | --- |
| Home | An example page: a list of sample records, with the loading, empty and error states. Replace it with your first page | `src/pages/HomePage.tsx` |
| Users | Forms in dialogs: invite, approve or decline account requests, edit (role, access end date, alerts, note) and confirm deactivation, with the backend's errors under each field. Administrators and managers only | `src/pages/UsersPage.tsx` |
| Your account | The signed-in person's profile and password, from "Account" in the top bar | `src/pages/AccountPage.tsx` |
| Sign in, ask for an account, accept an invitation, forgot and reset password | Account screens in `AuthLayout`, without a session | `src/pages/auth/` |
| Any other address | A page not found | `src/pages/NotFoundPage.tsx` |

The frame around the pages (top bar, side navigation, page heading, footer) is `src/layouts/ToolShell.tsx`; the screens without a session use `src/layouts/SignedOutFrame.tsx`. The routes are in `src/App.tsx`. `src/auth/session.tsx` keeps who is signed in and sends everyone else to `/sign-in`. Sample sign-in: `ana.ribeiro@example.org`, password `sample-password`. The footer shows the EU funding emblem and statement. Every INNO-TREC tool keeps it.

## Data

- `src/data/fakeServer.ts` plays the backend. It answers in the shapes of `src/data/types.ts`, waits a moment, and does the backend's checks (taken email, password length, expired links). It keeps the sample accounts until the page reloads.
- `src/data/api.ts` is the client the pages call. It turns every failure into an `ApiError` with messages per field.
- `src/format.ts` formats numbers and dates; `src/labels.ts` holds the words and tones for the codes the API sends.

To see the other states, add one of these to the address:

- `?demo=empty` shows no records and no users.
- `?demo=error` makes every request fail.

## Run it

From the repository root:

```sh
npm install
npm run dev
```

## Make it yours

1. Set `TOOL_NAME`, `PRIVACY_URL` and `FOOTER_LINKS` in `src/config.ts`.
2. Set the `<title>` and the icon in `index.html`.
3. Replace `src/pages/HomePage.tsx` with your first page, and add more as described in [Getting started](../../docs/getting-started.md#3-add-a-page).
4. In `src/data/api.ts`, replace the calls to `fakeServer` with `fetch` to your API, then delete `fakeServer.ts`. Keep the loading, empty and error states.
5. Connect `src/auth/session.tsx` to your backend or identity provider, and delete the "Sample accounts" note in `src/pages/auth/SignInPage.tsx`.

## Where things come from

- `@inno-trec/ui-web` provides the components and `styles.css`.
- `@inno-trec/tokens` provides the Tailwind preset (used in `tailwind.config.js`) and the color constants.
- Neither package is edited here. Update them with `npm run sync:ds` from the root.

Documentation for everything else is in the root [`docs/`](../../docs) folder.
