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

CI runs the same four commands on every pull request, on the Node version in `.nvmrc` and on the newest Node release. Only the `.nvmrc` run blocks a merge; a failure on the newest Node is an early warning to look into.

`npm test` opens every page in the side navigation at 1440px and 400px wide. It fails when the page scrolls sideways (a wide table in its own container is fine), when the heading is missing, or when the console shows an error. It cannot judge whether a pattern reads well, so still click through a changed pattern with `npm run dev`.

Add a line for your change under `## [Unreleased]` in `CHANGELOG.md`.

## Adding an example app

1. Create `apps/<name>/`, starting from a copy of `apps/web-starter`.
2. Give it a `package.json` name that is unique, and keep `@inno-trec/tokens` and `@inno-trec/ui-web` as dependencies with version `*`.
3. Make the example teach one thing. Say what it teaches at the top of its README.
4. Use sample data and mark it as sample data in the code.
5. Add a row for it to the table in the root `README.md`, and a `dev:<name>` script to the root `package.json`.
6. Give its `playwright.config.ts` its own port, so `npm test` can run every app (`web-starter` uses 4173, `credits-example` 4174).

## Writing documentation

- Write in American English.
- Start with what the reader does. Put the reason after the instruction.
- Show the file path next to every code excerpt.
- Check every command and every class name you write down. The docs in this repository were checked against a running copy.
- Link to `docs/reference/` for design system content instead of copying it.
- The files in `docs/` are also the website. A new page needs an entry in the `sidebar` in `docs/.vitepress/config.mts`. Preview with `npm run docs:dev`. CI builds the site and fails on a broken link.

## The website and the demo

`.github/workflows/pages.yml` publishes `docs/` and the starter (under `demo/`) to GitHub Pages after every push to `main`. It runs only in the template repository (`is_template`). Before the first run, turn on Pages in the repository settings with **Source: GitHub Actions**. The site is public (only GitHub Enterprise Cloud organizations can limit it to members), so internal pages stay out of it: `INTERNAL` in `docs/.vitepress/config.mts` lists them (decisions, tracking, ECMS open questions), and links to them open the file on GitHub. Add a page there when it should not be public.

## Preparing the repository as a GitHub template

In the repository settings on GitHub, turn on **Template repository**. Teams then get **Use this template** on the repository page.

Teams do not receive updates automatically, because their copy has diverged. They learn about changes from the releases.

## Releasing a version

The template version is the `version` in the root `package.json`. It follows semantic versioning: a minor version for new patterns, docs or a design system sync, a major version when a team must change its own code to take the update.

1. On `main`, move the entries under `## [Unreleased]` in `CHANGELOG.md` into a new section, for example `## [0.2.0] - 2026-11-03`, and commit.
2. Bump the version and create the tag:

   ```sh
   npm version minor -m "Release v%s"    # or patch / major
   git push --follow-tags
   ```

3. The `Release` workflow runs all checks, confirms that the tag matches `package.json` and that `CHANGELOG.md` has a section for it, and publishes a GitHub release with that section as its notes.

## Keeping versions current

The template uses the newest stable release of Node and of every dependency (decision 7 in [Decisions](decisions.md)).

- **Dependencies.** Dependabot opens a weekly pull request that groups minor and patch updates, and one pull request per major update. Merge them when CI passes. Read the changelog of a major update first. Dependabot skips Tailwind 4 (decision 3).
- **Node.** CI warns when a newer LTS release exists than the one in `.nvmrc`. Then change `.nvmrc` and `engines.node` in `package.json` to the new major version, and update the Node version in `README.md` and `docs/getting-started.md`.

## Telling teams about changes

A team that wants an update from the template can compare against it:

```sh
git remote add template <template-repository-url>
git fetch template
git diff HEAD template/main -- packages scripts docs apps/web-starter
```

Packages, scripts and docs are safe to take as they are. For `apps/web-starter`, apply only the changes that fit their tool.
