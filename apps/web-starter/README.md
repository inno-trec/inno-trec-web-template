# web-starter

The starter for an INNO-TREC web tool. Copy this app to start a tool of your own. Its pages fit the monitoring, PV performance and maintenance tools, and every tool needs its user management; for a credit tool, take the credit pages from [`credits-example`](../credits-example) as well.

## What it shows

| Page | Pattern | File |
| --- | --- | --- |
| Overview | Monitoring over time: a period filter, totals, a power chart (kW), a battery chart (%) and a table view | `src/pages/OverviewPage.tsx` |
| PV performance | Indicators per system (performance ratio, availability, specific yield, efficiency) against each system's history and the community, with a bar chart and a reference line | `src/pages/PerformancePage.tsx` |
| Data checks | Agreement between data sources (meters, inverters, DSS): deviations, coverage and status, and one source's deviation over time with a tolerance band | `src/pages/DataChecksPage.tsx` |
| Alerts | Corrective and predictive alerts: tabs by state, pages, severity, acknowledge, and resolve with photos | `src/pages/AlertsPage.tsx` |
| Assets | A list with detail: status, data quality and the asset's open alerts | `src/pages/AssetsPage.tsx` |
| Users | Forms in dialogs: invite, approve or decline account requests, edit (role, access end date, alerts, note) and confirm deactivation, with the backend's errors under each field. Administrators and managers only | `src/pages/UsersPage.tsx` |
| Your account | The signed-in person's profile and password, from "Account" in the top bar | `src/pages/AccountPage.tsx` |
| Sign in, ask for an account, accept an invitation, forgot and reset password | Account screens in `AuthLayout`, without a session | `src/pages/auth/` |
| Any other address | A page not found | `src/pages/NotFoundPage.tsx` |

The frame around the pages (top bar, side navigation, page heading, footer) is `src/layouts/ToolShell.tsx`; the screens without a session use `src/layouts/SignedOutFrame.tsx`. The routes are in `src/App.tsx`. `src/auth/session.tsx` keeps who is signed in and sends everyone else to `/sign-in`. Sample sign-in: `ana.ribeiro@example.org`, password `sample-password`. The footer shows the EU funding emblem and statement. Every INNO-TREC tool keeps it.

## Charts

`src/charts/TimeSeriesChart.tsx` draws a line chart over time and `src/charts/BarChart.tsx` compares categories, both with [Apache ECharts](https://echarts.apache.org). It applies the design system's [chart rules](../../docs/design-rules.md#charts):

- fixed series colors from `@inno-trec/tokens` (`colors['series-pv']`);
- one y-axis per chart;
- a legend, and line labels when there is room;
- dashed estimates and gaps for missing data;
- a tooltip in `ink`.

`LazyCharts.tsx` loads ECharts only on pages that show a chart. `src/charts/format.ts` formats numbers and times the same way in charts and tables.

To add another chart type (bars, for example), import it from `echarts/charts` and register it with `use([...])`, as `TimeSeriesChart.tsx` does for lines.

## Data

The data is synthetic. Nothing in it describes a real site.

- `src/data/synthetic.ts` generates 15-minute readings for a small community (24 households, 60 kWp of PV, a 100 kWh battery). The same day always gives the same values.
- `src/data/fakeServer.ts` plays the backend. It answers in the shapes of `src/data/types.ts`, waits a moment, and computes totals, indicators and statuses, as a real backend would. It sends the community's time zone (`Europe/Lisbon`). It also keeps the sample accounts, until the page reloads.
- `src/data/api.ts` is the client the pages call. It turns the JSON into what the screens need, and every failure into an `ApiError` with messages per field.
- `src/time/zone.ts` converts instants to the community's clock. Charts, tables and periods use it, so a reader in another time zone sees the same days and hours as the community.

To see the other states, add one of these to the address:

- `?demo=empty` shows a period with no readings and a community with no assets.
- `?demo=error` makes every request fail.

## Run it

From the repository root:

```sh
npm install
npm run dev
```

## Make it yours

1. Set `TOOL_NAME` and `PRIVACY_URL` in `src/config.ts`.
2. Set the `<title>` and the icon in `index.html`.
3. Add your pages as described in [Getting started](../../docs/getting-started.md#3-add-a-page).
4. In `src/data/api.ts`, replace the calls to `fakeServer` with `fetch` to your API, then delete `fakeServer.ts` and `synthetic.ts`. Keep the loading, empty and error states.
5. Connect `src/auth/session.tsx` to your backend or identity provider, and delete the "Sample accounts" note in `src/pages/auth/SignInPage.tsx`.

## Where things come from

- `@inno-trec/ui-web` provides the components and `styles.css`.
- `@inno-trec/tokens` provides the Tailwind preset (used in `tailwind.config.js`) and the color constants the charts use.
- Neither package is edited here. Update them with `npm run sync:ds` from the root.

Documentation for everything else is in the root [`docs/`](../../docs) folder.
