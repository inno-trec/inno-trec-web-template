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

The packages are not published to npm. A team copies the repository with **Use this template** and keeps its own copy of the packages.

**Consequence.** Each team updates the design system on its own schedule with `npm run sync:ds`, and a team can fall behind.

**Revisit when** more than a few teams use the template. Publishing `@inno-trec/tokens` and `@inno-trec/ui-web` to a private package registry would remove the copies.

### 6. English for all interface text

The components and the design system documents are in English, and the template follows American English.

## Open

These need an owner and an answer. None blocks using the template today.

| Item | Why it matters |
| --- | --- |
| **Translation.** Components contain fixed English text, with no setting to change it. | A tool for a Portuguese-speaking or other audience cannot use the components as they are. |
| **Publishing the packages** (decision 5). | Decides how teams receive design system updates. |
| **Fonts on restricted networks.** The stylesheet loads fonts from Google Fonts. | Deployments inside closed networks fall back to system fonts. |
| **Top bar on phones.** The `TopBar` does not fit on narrow screens. | The starter works around it in `index.css`. Every team would otherwise rediscover it. |
| **Tests.** The template checks types and the production build only. | Pattern changes are verified by hand. |
| **License.** The template repository has no license file. | Needed before the repository is shared outside the project. |
| **Dark mode.** The design system has one light theme. | Tools used in low light have no alternative. |
| **Questions about the ECMS specification** in the [open questions](reference/open-questions.md). | Several decide what a screen shows, for example how a negative balance is explained. |
