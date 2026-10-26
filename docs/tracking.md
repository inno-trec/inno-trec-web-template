# Tracking (provisional)

What the template still needs to serve the four INNO-TREC tools, and who must decide what. This page is a working list: update it in the same merge request as the work, and remove it once the list is empty or moves to an issue tracker.

Last reviewed: 26 Oct 2026. Focus: a template that the teams of the work package reuse, with components, account screens and documentation. Data APIs belong to each system, not to the template (decision 12).

Status: **To do**, **In progress**, **Done** (keep done items until the next release, then delete them), **Blocked** (waiting for a decision or for another work package), **Dropped** (out of the template's scope; keep until the next release, then delete).

## Work items

| # | Item | Tools | Priority | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Data contract with WP2 (OpenAPI) | All | — | Dropped | Belongs to the systems that provide data. The draft is in the history (commit `bee526e`). The starter keeps example types in `src/data/types.ts`. |
| 2 | Alerts inbox: corrective and predictive alerts with severity and state (new, acknowledged, resolved) | 2, 3 | 1 | Done | [Alerts page](../apps/web-starter/src/pages/AlertsPage.tsx), pattern 9. Notifications stay with the alert engine (outside the template). |
| 3 | PV performance page: PR, availability, specific yield and efficiency per system, against historical and community references; bar chart and reference line | 2 (base for 3) | 1 | Done | [PV performance page](../apps/web-starter/src/pages/PerformancePage.tsx), pattern 7, `BarChart`. Indicator definitions are open (D2). |
| 4 | Source coherence: compare the same quantity from several sources (meter, inverter, DSS) and show deviations | 1 | 1 | Done | [Data checks page](../apps/web-starter/src/pages/DataChecksPage.tsx), pattern 8, tolerance band in `TimeSeriesChart`. |
| 5 | Work order form (the Assets button is a placeholder) | 3 | 2 | To do | |
| 6 | Remote device control: a command with confirmation and the device's answer (sent, done, failed) | 3 | 2 | To do | Needs a safety review: which commands, who may send them. |
| 7 | Member screens for tools 1–3 (for example "My energy" with `EnergySummary`) | 1, 3 | 2 | To do | All starter pages are manager screens today. |
| 8 | Continuous updates: "Updated 2 minutes ago" and automatic refresh | 1, 2, 4 | 2 | To do | The pattern only; polling or push is each tool's choice. |
| 9 | Free date range and export (CSV) on the Overview | 1 | 2 | To do | `DateRangeField` exists. |
| 10 | Virtual energy allocation per member (manager view) | 1, 4 | 2 | To do | |
| 11 | Credit rules per community (configuration page) | 4 | 3 | Blocked | Waits for ECMS open questions 1, 3 and 11. |
| 12 | Market insights for members (credit value, prices) | 4 | 3 | To do | Needs a chart rule and a data source. |
| 13 | File upload (maintenance photos) | 3 | 3 | To do | Design system component. |
| 14 | Settings page (PV system registration: kWp, tilt, azimuth, commissioning date) | 2, 3 | 3 | To do | |
| 15 | Roles in the interface: hide pages a role cannot open, explain when access is missing | All | 2 | Done | `roles` in `NAV`, `allowed()` in `src/auth/session.tsx`. Read-only views inside a page are still to do. |
| 16 | Map the ECMS credit data into the contract | 4 | — | Dropped | Went with item 1. |
| 17 | Describe live updates in AsyncAPI | 1, 3 | — | Dropped | Went with item 1. |
| 18 | Account screens: sign in, ask for an account with manager approval, accept an invitation, forgot and reset password, your account, sign out | All | 1 | Done | `src/pages/auth/`, `AccountPage`, approval on the Users page. Design system: `AuthLayout`, `PasswordField`. |
| 19 | Documentation site with the starter as a live demo | All | 1 | Done | GitLab Pages (`pages` job in `.gitlab-ci.yml`). Decisions, tracking and the ECMS open questions stay out of the site (`INTERNAL` in `docs/.vitepress/config.mts`). |
| 21 | Move to gitlab.up.pt: repository, CI, Pages, releases | All | 1 | Done | GitHub repositories archived. CI runs on a temporary group runner on les2-turbo-01 until FEUP provides one. The release job runs for the first time at v0.2.0. |
| 22 | Automatic dependency updates (Dependabot did this on GitHub) | All | 3 | To do | Today: `npm outdated` once a month. Renovate is an option if the runners allow it. |
| 20 | More shared components for the work package's tools (list to agree with the teams) | All | 1 | To do | Candidates: file upload (item 13), empty state, tabs, pagination, toast for saved changes. |

## Decisions waiting for an owner

| # | Decision | Why it matters | Owner |
| --- | --- | --- | --- |
| D2 | Definitions of PV indicators (performance ratio, availability, specific yield, efficiency, expected yield) | Every tool must show the same numbers | PV performance task |
| D3 | Translation of the interface (components contain fixed English text) | "User-friendly for all community members" | Project |
| D4 | ECMS open questions ([list](reference/open-questions.md)), especially 2 (how members authorize a transfer) | Blocks the secure P2P flow and the credit rules page | ECMS specification owners |
| D5 | The mobile app (energy credits) lives in another repository and receives only tokens; check that it covers wallet management | The credit platform's interface is a mobile app | Mobile team |
| D6 | Publishing the packages instead of copying them (decision 5) | How teams receive design system updates | Project |
| D7 | Identity provider for all tools (OpenID Connect, for example Keycloak), if any | With one provider, its sign-in pages replace the template's screens and use them as the theme design (decision 12) | Project |

## Outside the template

These belong to other work packages or to each system; the template only displays what they deliver: the data APIs and their contracts, the DSS, the blockchain ledger, the computation of indicators, the alert engine and its notifications, device control on site, user storage and email, and the mobile app.
