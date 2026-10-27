# Decisions

Why the template is built this way, and what is still open. Each decision says what would make it worth revisiting.

## Decided

### 1. Web and mobile share tokens, not components

The components are DOM-based React written for the web. A React Native app needs its own components. The mobile app is built by one person, while several teams build web tools, so the web teams should not need React Native or `react-native-web`.

**Consequence.** Web and mobile look the same because they use the same tokens, and each has its own components. A change to a component has to be repeated on mobile by hand.

**Revisit when** more than one person works on mobile, or when keeping the two sets of components in step costs more than sharing would.

### 2. Vite and React Router, not a framework

These are internal tools behind a sign-in. They do not need server rendering or search indexing. A static build with client-side routes is the least that works and is easy to host anywhere.

**Revisit when** a tool needs server rendering, a public page, or sign-in handled on the server.

### 3. Tailwind 3.4, not 4

The mobile app uses NativeWind. The stable release is version 4, and its runtime package (`react-native-css-interop`) declares `tailwindcss ~3` as a peer dependency. Version 5 was still a release candidate when this was written. The web tools and the mobile app should read the same preset, so both stay on Tailwind 3.

**Consequence.** The preset is a JavaScript theme object, the Tailwind 3 format. Tailwind 3's tooling brings audit warnings in development dependencies (see [Troubleshooting](troubleshooting.md)).

**Revisit when** NativeWind 5 is stable. Then move web and mobile to Tailwind 4 together.

### 4. Components are consumed as generated code, not rewritten

`packages/ui-web` is a conversion of the design system's own `bundle.js` into an ES module. Nothing is hand-ported. The result looks identical to the design system by construction, and updates arrive by running one command.

**Consequence.** Component styles live in one stylesheet (`styles.css`), not in Tailwind classes. Tailwind handles layout around components.

**Revisit when** teams need to customize components beyond what the design system allows.

### 5. The template is copied, not installed

The packages are not published to npm. A team copies the repository into a new project (see Getting started) and keeps its own copy of the packages.

**Consequence.** Each team updates the design system on its own schedule with `npm run sync:ds`, and a team can fall behind.

**Revisit when** more than a few teams use the template. Publishing `@inno-trec/tokens` and `@inno-trec/ui-web` to a private package registry would remove the copies.

### 6. English for all interface text

The components and the design system documents are in English, and the template follows American English.

### 7. Newest stable versions, including Node

The template runs on the newest LTS release of Node (pinned in `.nvmrc`) and the newest stable release of every dependency, except where another decision holds one back (Tailwind, decision 3). Teams copy the template, so a copy made from an old version stays old for a long time. Starting each copy current gives it the longest support window.

**Consequence.** Someone checks for updates with `npm outdated` once a month (see `docs/contributing.md`); automatic updates are tracking item 22. CI also runs on the newest Node release, so a break shows up before that release becomes LTS. Release candidates and odd-numbered Node versions are not used.

**Revisit when** keeping up costs more than the support window is worth, for example when updates break the starter often.

### 8. Browser smoke tests, not unit tests

The starter has almost no logic: the backend computes values, and the components come from the design system. What breaks is layout and wiring. Playwright tests open the production build at 1440px and 400px wide and check every page in the side navigation for its heading, sideways scroll and console errors. A hash check fails CI when a generated file was edited by hand.

**Consequence.** The tests cover the checks that `docs/contributing.md` used to ask for by hand. They do not judge whether a pattern reads well.

**Revisit when** a tool adds logic of its own. That tool should add a unit test runner (Vitest fits the Vite setup).

### 9. Apache ECharts for charts

Three of the four INNO-TREC tools plot time series: a year of 15-minute readings is 35,000 points per series. ECharts draws that many points on a canvas without slowing down, and it has the tooltips, legends and time axes the chart rules ask for. Recharts slows down above a few thousand points; uPlot is smaller but leaves tooltips and legends to each team.

**Consequence.** ECharts is large (about 175 kB compressed for a line chart). The starter imports only the parts it uses and loads the chart on demand, so pages without a chart do not wait for it. The chart colors come from the design system's series tokens, not from ECharts themes.

**Revisit when** the design system ships its own chart component, or a tool needs a chart ECharts cannot draw.

### 10. One neutral starter, one example per domain

The starter holds the patterns every tool needs (monitoring over time, list with detail). Credit screens live in `apps/credits-example`. A team copies the starter and takes credit pages only when its tool shows credits.

**Consequence.** The credit rules in the design rules apply to credit screens only. A new domain with its own patterns gets its own example app.

### 11. The backend sets the data; the community sets the clock

The backend computes PV indicators (performance ratio, specific yield, expected yield) and sets the reading interval. The interface displays them and never assumes an interval. Times are shown in the community's time zone, which the backend sends as an IANA name ("Europe/Lisbon"), and every page with times names it.

The reader's own time zone would be simpler, and for readers in the community's time zone the result is the same. But it breaks for everyone else: days would not match the backend's daily totals, the solar peak would move away from midday, and alarm times would differ from what technicians see on site. INNO-TREC has pilots in more than one country, so readers in another time zone are expected.

**Consequence.** ECharts has no time zone setting. `TimeSeriesChart` moves each instant by the community's offset and reads the result as UTC, so its axis shows the community's clock. On the night summer time ends, one hour repeats and the line steps back for that hour. `src/time/zone.ts` holds the conversions, with the browser's `Intl` API and no library. The browser's time zone is the fallback only when the backend sends none.

**Revisit when** a tool compares communities in different time zones on one chart. That chart needs one shared clock, probably UTC, and says so.

### 12. Account screens in the template; each system owns its data API

The template gives every tool the screens around accounts: sign in, ask for an account (a manager approves it), accept an invitation, reset a password, the person's own account, and the list of users with roles. It does not define how a tool talks to its backend. Each system owns its API and its description; the starter's `src/data/types.ts` and `src/data/fakeServer.ts` are examples to replace.

An earlier draft of this decision put a data contract (OpenAPI) for all providers in the template. It was removed: the contract belongs to the systems that provide the data, and the template's job is the interface that teams in the work package reuse.

**Consequence.** The starter keeps its sample session in the browser so it runs without a server; a real tool takes the session from its backend or identity provider. If the tools adopt one OpenID Connect provider (for example Keycloak), the provider shows its own sign-in pages, and the template's screens are the design for its theme. Hiding a page by role is for clarity only; the backend checks the role on every request.

**Revisit when** the project chooses an identity provider (tracking D7).

## Open

These need an owner and an answer. None blocks using the template today.

| Item | Why it matters |
| --- | --- |
| **Translation.** Components contain fixed English text, with no setting to change it. | A tool for a Portuguese-speaking or other audience cannot use the components as they are. |
| **Publishing the packages** (decision 5). | Decides how teams receive design system updates. |
| **Fonts on restricted networks.** The stylesheet loads fonts from Google Fonts. | Deployments inside closed networks fall back to system fonts. |
| **Top bar on phones.** The `TopBar` does not fit on narrow screens. | The starter works around it in `index.css`. Every team would otherwise rediscover it. |
| **Dark mode.** The design system has one light theme. | Tools used in low light have no alternative. |
| **Questions about the ECMS specification** in the [open questions](reference/open-questions.md). | Several decide what a screen shows, for example how a negative balance is explained. |
| **Definitions of PV indicators** (performance ratio, specific yield, expected yield). The backend computes them (decision 11). | Every tool must use the same definition, and no document sets one yet. |
