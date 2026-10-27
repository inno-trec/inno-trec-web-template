# {{name}}

An INNO-TREC web tool, created from the INNO-TREC starter (Vite, React 19, TypeScript, Tailwind 3.4, React Router).

```sh
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run build        # static files in dist/
npm test             # Playwright smoke tests (first time: npx playwright install chromium)
```

Sign in with the sample account `ana.ribeiro@example.org`, password `sample-password`.

## What to change first

1. Set `TOOL_NAME`, `PRIVACY_URL` and `FOOTER_LINKS` in `src/config.ts`.
2. Set the `<title>` and the icon in `index.html`.
3. Replace `src/pages/HomePage.tsx` with your first page.
4. In `src/data/api.ts`, replace the calls to `fakeServer` with `fetch` to your backend, then delete `fakeServer.ts`.
5. Connect `src/auth/session.tsx` to your backend or identity provider.

Keep the footer with the EU funding emblem on every page.

## Design system

The components come from [`@inno-trec/ui-web`](https://www.npmjs.com/package/@inno-trec/ui-web) and the colors, type and spacing from [`@inno-trec/tokens`](https://www.npmjs.com/package/@inno-trec/tokens). Update both with:

```sh
npm update @inno-trec/ui-web @inno-trec/tokens
```

Guides, design rules, page patterns and every component running: <https://glpages.up.pt/inno-trec/inno-trec-web-template/>
