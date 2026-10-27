# Contributing to the template

This page is for people who change the template itself. If you are building a tool, you want [Getting started](getting-started.md).

## What belongs here

- Improvements to the starter app and its patterns
- Documentation
- New example apps that teach a pattern
- Updates to the generated packages, made by running the sync script

What does not belong here: a team's own tool, or changes to a component, a color or a brand rule. Those go to the design system repository.

## Rules for the generated files

`packages/tokens/dist/`, `packages/tokens/tokens.json`, `packages/ui-web/` (except its `package.json`), `docs/reference/` and `design-system.lock.json` come from `npm run sync:ds`. Never edit them by hand.

When you change one of the three scripts, run the sync and look at the diff of the generated files before you commit:

- `scripts/sync-design-system.mjs`
- `packages/tokens/scripts/build.mjs`

The sync script stops with a message when the design system's `bundle.js` changes shape. Fix the script, not the generated file.

## Checks before a pull request

```sh
npm run check:generated   # generated files match the last sync
npm run typecheck
npm run build
npm test                  # every page at 1440px and 400px wide
```

CI (`.github/workflows/ci.yml`) runs the same four commands, builds the documentation site and the npm packages, on every pull request and every push to `main`: once on the Node in `.nvmrc` and once on the newest Node. Only the `.nvmrc` run blocks a merge; a failure on the newest Node is an early warning to look into. Changes reach `main` only through a pull request whose checks pass.

`npm test` opens every page in the side navigation at 1440px and 400px wide. It fails when the page scrolls sideways (a wide table in its own container is fine), when the heading is missing, or when the console shows an error. It cannot judge whether a pattern reads well, so still click through a changed pattern with `npm run dev`.

Add a line for your change under `## [Unreleased]` in `CHANGELOG.md`.

## Adding an example app

1. Create `apps/<name>/`, starting from a copy of `apps/web-starter`.
2. Give it a `package.json` name that is unique, and keep `@inno-trec/tokens` and `@inno-trec/ui-web` as dependencies with version `*`.
3. Make the example teach one thing. Say what it teaches at the top of its README.
4. Use sample data and mark it as sample data in the code.
5. Add a row for it to the table in the root `README.md`, and a `dev:<name>` script to the root `package.json`.
6. Give its `playwright.config.ts` its own port, so `npm test` can run every app (`web-starter` uses 4173, `credits-example` 4174, `template-demo` 4175).

## Writing documentation

- Write in American English.
- Start with what the reader does. Put the reason after the instruction.
- Show the file path next to every code excerpt.
- Check every command and every class name you write down. The docs in this repository were checked against a running copy.
- Link to `docs/reference/` for design system content instead of copying it.
- The files in `docs/` are also the website. A new page needs an entry in the `sidebar` in `docs/.vitepress/config.mts`. Preview with `npm run docs:dev`. CI builds the site and fails on a broken link.
- The component guide shows each component running. `scripts/build-gallery.mjs` builds the examples into `docs/public/gallery/` from `docs/reference/previews/` (copied from the design system by `npm run sync:ds`) and the components in `packages/ui-web`. The guide shows them in frames (`docs/.vitepress/theme/ComponentPreview.vue`). Nothing is loaded from claude.ai, so readers need no account there. To change an example, change its `preview.html` in the design system and sync.

## The website and the demo

`.github/workflows/pages.yml` publishes `docs/` and the template demo (under `demo/`) to GitHub Pages after every push to `main`, at <https://inno-trec.github.io/inno-trec-web-template/>. It runs only in the template repository; the site's path is the repository name.

## How teams copy the template

Teams do not copy the repository. They create a tool with `npm create @inno-trec/tool` ([Getting started](getting-started.md#1-create-your-tool)), which copies `apps/web-starter`, and install the design system packages from npm. The pages that `npm create` copied are theirs, so a release does not change them. They learn about changes from the releases.

## Releasing a version

The template version is the `version` in the root `package.json`. It follows semantic versioning: a minor version for new patterns, docs or a design system sync, a major version when a team must change its own code to take the update.

1. On a branch, move the entries under `## [Unreleased]` in `CHANGELOG.md` into a new section, for example `## [1.1.0] - 2026-11-03`, and set the same version in the root `package.json` (`npm version minor --no-git-tag-version`, or `patch` / `major`). Open a pull request and merge it.
2. Tag the merged `main` and push the tag:

   ```sh
   git switch main && git pull
   git tag v1.1.0
   git push origin v1.1.0
   ```

   Only organization admins can create `v*` tags, and a pushed tag cannot be moved or deleted.

3. The tag runs `.github/workflows/release.yml`: all checks, then a check that the tag matches `package.json` and that `CHANGELOG.md` has a section for it, a GitHub release with that section as its notes (`release`), and the npm packages (`npm-publish`).

The `npm-publish` job runs `scripts/publish-packages.mjs`. It publishes `@inno-trec/tokens`, `@inno-trec/ui-web` and `@inno-trec/create-tool` with the root `package.json` version; the `version` inside each package folder is not used. It copies each package to `.publish/` and publishes the copy, so the repository does not change. `@inno-trec/create-tool` carries `apps/web-starter` as its template, with its README and `.gitignore` from `packages/create-tool/files/`. Run `npm run packages:pack` to build the packages into `.publish/` and try them before a release.

The job uses npm trusted publishing: on npmjs.com, each of the three packages trusts `release.yml` in the repository's `npm` environment, so no token is stored anywhere, and npm adds provenance to each version. A version that is already on npm is skipped, so the job can run again.

## Keeping versions current

The template uses the newest stable release of Node and of every dependency, so each copy starts with the longest support window.

- **Dependencies.** Once a month, run `npm outdated`, update minor and patch versions together in one pull request, and each major update in its own. Merge when CI passes. Read the changelog of a major update first. Never move to Tailwind 4: the mobile app's NativeWind 4 needs Tailwind 3.
- **Node.** When a new LTS release comes out (each October), change `.nvmrc` and `engines.node` in `package.json` to the new major version (the workflows read `.nvmrc`), and update the Node version in `README.md` and `docs/getting-started.md`. The `checks-node-current` job shows problems with newer Node releases early.

## Telling teams about changes

Teams receive the design system as npm packages: each release publishes `@inno-trec/tokens` and `@inno-trec/ui-web`, and a team takes it with `npm update` (see [Getting started](getting-started.md#update-the-design-system)). Write the changelog section for them: say what changed in the components and what a team must change in its own code.

The pages a team created with `npm create @inno-trec/tool` are its own and do not update. When the starter's pages get a fix that teams should take, say so in the changelog and name the files in `apps/web-starter`.
