# web-starter

The starter for an INNO-TREC web tool. Copy this app to start a tool of your own. Its pages fit the monitoring, PV performance and maintenance tools; for a credit tool, take the credit pages from [`credits-example`](../credits-example) as well.

## What it shows

| Page | Pattern | File |
| --- | --- | --- |
| Overview | Monitoring over time: a period filter, totals, a power chart (kW), a battery chart (%) and a table view | `src/pages/OverviewPage.tsx` |
| Assets | A list with detail: status, data quality and maintenance suggestions | `src/pages/AssetsPage.tsx` |
| Any other address | A page not found | `src/pages/NotFoundPage.tsx` |

The frame around the pages (top bar, side navigation, page heading, footer) is `src/layouts/ToolShell.tsx`. The routes are in `src/App.tsx`. The footer shows the EU funding emblem and statement. Every INNO-TREC tool keeps it.

## Charts

`src/charts/TimeSeriesChart.tsx` draws a line chart over time with [Apache ECharts](https://echarts.apache.org). It applies the design system's [chart rules](../../docs/design-rules.md#charts):

- fixed series colors from `@inno-trec/tokens` (`colors['series-pv']`);
- one y-axis per chart;
- a legend, and line labels when there is room;
- dashed estimates and gaps for missing data;
- a tooltip in `ink`.

`LazyTimeSeriesChart` loads ECharts only on pages that show a chart. `src/charts/format.ts` formats numbers and times the same way in charts and tables.

To add another chart type (bars, for example), import it from `echarts/charts` and register it with `use([...])`, as `TimeSeriesChart.tsx` does for lines.

## Data

The data is synthetic. Nothing in it describes a real site.

- `src/data/synthetic.ts` generates 15-minute readings for a small community (24 households, 60 kWp of PV, a 100 kWh battery). The same day always gives the same values.
- `src/data/api.ts` is a fake backend over it. Each request waits a moment and then answers. It also computes the totals and the table rows, the way a real backend would, and sends the community's time zone (`Europe/Lisbon`).
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

1. Set `TOOL_NAME`, `USER` and `FOOTER_LINKS` (your privacy policy) in `src/layouts/ToolShell.tsx`.
2. Set the `<title>` and the icon in `index.html`.
3. Add your pages as described in [Getting started](../../docs/getting-started.md#3-add-a-page).
4. Replace `src/data/api.ts` and `src/data/synthetic.ts` with calls to your backend. Keep the loading, empty and error states.

## Where things come from

- `@inno-trec/ui-web` provides the components and `styles.css`.
- `@inno-trec/tokens` provides the Tailwind preset (used in `tailwind.config.js`) and the color constants the charts use.
- Neither package is edited here. Update them with `npm run sync:ds` from the root.

Documentation for everything else is in the root [`docs/`](../../docs) folder.
