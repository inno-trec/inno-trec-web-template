# Tracking (provisional)

What the template still needs to serve the four INNO-TREC tools, and who must decide what. This page is a working list: update it in the same pull request as the work, and remove it once the list is empty or moves to an issue tracker.

Last reviewed: 26 Oct 2026, against the task objectives of the four tools (monitoring, PV performance, maintenance, energy credits).

Status: **To do**, **In progress**, **Done** (keep done items until the next release, then delete them), **Blocked** (waiting for a decision or for another work package).

## Work items

| # | Item | Tools | Priority | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Data contract with WP2: OpenAPI as the compatibility rule, a first contract and typed clients | All | 1 | Done (draft) | Draft 0.1 in [API contract](api-contract.md) and `packages/api-contract`, decision 12. Next: WP2 review (D1), credits mapping (item 16). |
| 2 | Alerts inbox: corrective and predictive alerts with severity and state (new, acknowledged, resolved) | 2, 3 | 1 | Done | [Alerts page](../apps/web-starter/src/pages/AlertsPage.tsx), pattern 9. Notifications stay with the alert engine (outside the template). |
| 3 | PV performance page: PR, availability, specific yield and efficiency per system, against historical and community references; bar chart and reference line | 2 (base for 3) | 1 | Done | [PV performance page](../apps/web-starter/src/pages/PerformancePage.tsx), pattern 7, `BarChart`. Indicator definitions are open (D2). |
| 4 | Source coherence: compare the same quantity from several sources (meter, inverter, DSS) and show deviations | 1 | 1 | Done | [Data checks page](../apps/web-starter/src/pages/DataChecksPage.tsx), pattern 8, tolerance band in `TimeSeriesChart`. |
| 5 | Work order form (the Assets button is a placeholder) | 3 | 2 | To do | |
| 6 | Remote device control: a command with confirmation and the device's answer (sent, done, failed) | 3 | 2 | To do | Needs a safety review: which commands, who may send them. |
| 7 | Member screens for tools 1–3 (for example "My energy" with `EnergySummary`) | 1, 3 | 2 | To do | All starter pages are manager screens today. |
| 8 | Continuous updates: "Updated 2 minutes ago" and automatic refresh | 1, 2, 4 | 2 | To do | Polling or push depends on the WP2 contract (item 1). |
| 9 | Free date range and export (CSV) on the Overview | 1 | 2 | To do | `DateRangeField` exists. |
| 10 | Virtual energy allocation per member (manager view) | 1, 4 | 2 | To do | |
| 11 | Credit rules per community (configuration page) | 4 | 3 | Blocked | Waits for ECMS open questions 1, 3 and 11. |
| 12 | Market insights for members (credit value, prices) | 4 | 3 | To do | Needs a chart rule and a data source. |
| 13 | File upload (maintenance photos) | 3 | 3 | To do | Design system component. |
| 14 | Settings page (PV system registration: kWp, tilt, azimuth, commissioning date) | 2, 3 | 3 | To do | |
| 15 | "Read-only for your role" pattern | All | 3 | To do | The template has no sign-in; roles come from the shared identity (decision 12). |
| 16 | Map the ECMS credit data (wallets, transactions, settlements) into the contract | 4 | 2 | To do | Follows the ECMS Technical Specification; `credits-example` still uses its own sample data. |
| 17 | Describe live updates (new readings, alerts) in AsyncAPI | 1, 3 | 3 | To do | Only when polling is not enough (item 8). |

## Decisions waiting for an owner

| # | Decision | Why it matters | Owner |
| --- | --- | --- | --- |
| D1 | WP2 accepts OpenAPI 3.1 as the contract format for every data provider | Without it, each tool integrates each source by hand | WP2 lead |
| D2 | Definitions of PV indicators (performance ratio, availability, specific yield, efficiency, expected yield) | Every tool must show the same numbers | PV performance task |
| D3 | Translation of the interface (components contain fixed English text) | "User-friendly for all community members" | Project |
| D4 | ECMS open questions ([list](reference/open-questions.md)), especially 2 (how members authorize a transfer) | Blocks the secure P2P flow and the credit rules page | ECMS specification owners |
| D5 | The mobile app (energy credits) lives in another repository and receives only tokens; check that it covers wallet management | The credit platform's interface is a mobile app | Mobile team |
| D6 | Publishing the packages instead of copying them (decision 5) | How teams receive design system updates | Project |
| D7 | Identity provider for all tools (OpenID Connect, for example Keycloak) and where users and roles are kept | One sign-in and one list of users for every tool (decision 12) | WP2 |

## Outside the template

These belong to other work packages; the template only displays what they deliver: the DSS, the blockchain ledger, the computation of indicators, the alert engine and its notifications, device control on site, and the mobile app.
