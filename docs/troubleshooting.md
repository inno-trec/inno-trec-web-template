# Troubleshooting

Problems that have already come up, with the cause and the fix.

## A white strip appears above a table's header

**Cause.** A `DataTable` with a `caption` sits in a container without padding, usually a `Card` with `flush`. The component styles the caption for a padded container, so it sits flush at the top on a white background above the gray header.

**Fix.** Inside a `Card`, set `flush` and remove the `caption`. The card title already names the table. Use a `caption` only when the table sits in a container that has padding.

## A Tailwind class does nothing (`rounded-lg`, `shadow-md`)

**Cause.** The preset removes rounded corners and shadows on purpose. The design system is flat and square.

**Fix.** Use `rounded-none`, `rounded-sm` or `rounded-full`, and a border instead of a shadow. See [Tokens and Tailwind](tokens-and-tailwind.md#what-the-preset-removes).

## Plain headings, paragraphs and buttons look unstyled

**Cause.** Tailwind's reset is switched off, because the component styles expect browser defaults around them.

**Fix.** Use components (`Button`, `Card`) for anything interactive or boxed. For text, add Tailwind classes: `font-display text-title m-0`. The shell already draws the page heading.

## The top bar overflows on a phone

**Cause.** The design system's `TopBar` does not shrink: the tool name and the user's name and role do not fit below about 560px.

**Fix.** The starter hides them below 560px in `src/index.css`. This is a gap in the design system. Remove the workaround when the design system handles it.

## Opening a page directly gives a 404 in production

**Cause.** The app uses client-side routes (`/wallets`). The static host looks for a file with that name.

**Fix.** Configure the host to return `index.html` for unknown paths. If it cannot, use `HashRouter` in `src/main.tsx`. See [Getting started](getting-started.md#deploy).

## Fonts do not load, and text is in a system font

**Cause.** `styles.css` loads Figtree and Open Sans from Google Fonts when the page opens. A network that blocks Google, or an offline machine, falls back to the system font.

**Fix.** On a restricted network, host the font files yourself and replace the `@import` line at the top of `packages/ui-web/src/styles.css`. That file is generated, so make the change in the design system repository and sync, or ask for a self-hosted option.

## A type error appears after `npm run sync:ds`

**Cause.** A component prop was added, renamed or removed in the design system.

**Fix.** Read the diff of `packages/ui-web/src/index.d.ts` and `docs/reference/components.md`, then update your pages. Commit the sync separately so the cause is easy to find.

## `Cannot find module '@inno-trec/ui-web'`

**Cause.** Dependencies were installed inside an app folder (such as `apps/web-starter`) instead of at the root. The packages are npm workspaces and link only from the root.

**Fix.** Run `npm install` in the repository root.

## `Invalid hook call` or two copies of React

**Cause.** Another package brought its own React, so components and your app use different copies.

**Fix.** Run `npm ls react` from the root. Every entry should point to one version. Align the versions in the `package.json` files and reinstall.

## `import logo from '...png'` fails the type check

**Cause.** TypeScript does not know about image imports.

**Fix.** Keep `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) in your app.

## `npm audit` reports vulnerabilities

**Cause.** The reports come from development tools, mostly the packages Tailwind 3 uses to read files. `npm audit --omit=dev` reports none for the code that ships.

**Fix.** There is nothing to fix in your tool. Do not run `npm audit fix --force`: it installs Tailwind 4, a breaking change that the preset and the mobile app do not support yet. The warnings go away when the project moves to Tailwind 4.

## A component shows English text I need in another language

**Cause.** The components contain fixed English text ("Send credits", "Credits sent", "Step 1 of 3").

**Fix.** There is no translation setting yet. This is still an open question. If your tool needs another language, tell the design system owners before you work around it.

## `npm test` says the browser executable does not exist

**Cause.** Playwright downloads its browser separately from `npm install`.

**Fix.** Run `npx -w web-starter playwright install chromium` once. On Linux, add `--with-deps` to install the system libraries as well.

## `npm run check:generated` fails

**Cause.** A file in `packages/tokens/`, `packages/ui-web/src/`, `packages/ui-web/assets/` or `docs/reference/` differs from what the last `npm run sync:ds` wrote. Usually someone edited it by hand.

**Fix.** Undo the edit with `git checkout -- <file>`. If the change is needed, make it in the design system repository and run `npm run sync:ds`, which also records the new hashes.
