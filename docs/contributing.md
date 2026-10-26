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
npm run typecheck
npm run build
```

Then open the starter app and look at every page at 1440px and at 400px wide:

```sh
npm run dev
```

Nothing may scroll sideways except a wide table in its own container, and the browser console must show no errors. Test a change to a pattern by clicking through it, because a build proves only that the code compiles.

## Adding an example app

1. Create `apps/<name>/`, starting from a copy of `apps/web-starter`.
2. Give it a `package.json` name that is unique, and keep `@inno-trec/tokens` and `@inno-trec/ui-web` as dependencies with version `*`.
3. Make the example teach one thing. Say what it teaches at the top of its README.
4. Use sample data and mark it as sample data in the code.
5. Add a row for it to the table in the root `README.md`.

## Writing documentation

- Write in American English.
- Start with what the reader does. Put the reason after the instruction.
- Show the file path next to every code excerpt.
- Check every command and every class name you write down. The docs in this repository were checked against a running copy.
- Link to `docs/reference/` for design system content instead of copying it.

## Preparing the repository as a GitHub template

In the repository settings on GitHub, turn on **Template repository**. Teams then get **Use this template** on the repository page.

Tag releases (`v0.1.0`, `v0.2.0`) when the template changes in ways teams should know about, and describe the change in the release notes. Teams do not receive updates automatically, because their copy has diverged.

## Telling teams about changes

A team that wants an update from the template can compare against it:

```sh
git remote add template <template-repository-url>
git fetch template
git diff HEAD template/main -- packages scripts docs apps/web-starter
```

Packages, scripts and docs are safe to take as they are. For `apps/web-starter`, apply only the changes that fit their tool.
