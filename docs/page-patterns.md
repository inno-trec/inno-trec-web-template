# Page patterns

Two apps show the patterns most tools need. `web-starter` holds the patterns every tool uses (monitoring over time, list with detail). `credits-example` holds the patterns of credit tools (ledger overview, step flow, member screen). Each pattern is a real file you can copy. This page explains what each one is for and which rules shape it.

All patterns sit inside `ToolShell`, which draws the top bar, the side navigation and the page heading. A page returns its content only.

## Spacing between blocks

Put blocks in a column with `flex flex-col gap-space-4`. Put wide content in a grid with `gap-space-4`. Avoid margins between siblings, because margins collapse and double.

```tsx
<div className="flex flex-col gap-space-4">
  {/* blocks */}
</div>
```

## 1. Monitoring over time

Source: [`web-starter/src/pages/OverviewPage.tsx`](../apps/web-starter/src/pages/OverviewPage.tsx)

Use it for consumption, PV production and storage over a period. Put a period filter on top, two to four `StatTile` components with the totals, then one chart per unit.

```tsx
const POWER: SeriesSpec<Reading>[] = [
  { name: 'Consumption', color: colors['series-consumption'], value: (r) => r.consumption },
  { name: 'PV production', color: colors['series-pv'], value: (r) => r.pv },
];

<Card title="Power" subtitle="Every 15 minutes">
  <TimeSeriesChart points={readings} series={POWER} unit="kW" label="Power over time" />
</Card>
<Card title="Battery charge">
  <TimeSeriesChart points={readings} series={CHARGE} unit="%" min={0} max={100} height={200} label="Battery charge over time" />
</Card>
```

Rules for this pattern:

- **Filters go in one row above the charts.** Changing the period reloads the data from the backend.
- **One unit per chart.** Power (kW) and battery charge (%) are two charts, one above the other. Never add a second y-axis.
- **Use the series tokens.** Each series has its own color in every chart. See [Charts](design-rules.md#charts).
- **Totals come from the backend.** The `StatTile` values and the table rows arrive computed. The chart only plots the readings.
- **Show gaps and estimates.** A missing reading is `null` and draws a gap. Readings not yet confirmed are drawn dashed.
- **Use the community's clock.** Pass the `timeZone` from the backend to the chart and to the formatters, and name it on the page. Periods start at midnight in that time zone.
- **Offer the numbers as a table.** "Show as table" opens a `DataTable` with the same figures per hour or per day.
- **Load the chart on demand.** ECharts is large, so `LazyTimeSeriesChart` loads it only on pages that show a chart.

## 2. Overview: headline numbers and a table

Source: [`credits-example/src/pages/DashboardPage.tsx`](../apps/credits-example/src/pages/DashboardPage.tsx)

Use it for a landing page that answers "how is the community doing?". Put two to four `StatTile` components in a row, then a table.

```tsx
<div className="grid gap-space-4 sm:grid-cols-2 xl:grid-cols-4">
  <StatTile label="Members" value={100} accent="orange" />
  <StatTile label="Production this month" value={3000} unit="kWh" accent="green" />
</div>

<Card title="Latest ledger entries" flush>
  <DataTable columns={COLUMNS} rows={rows} rowKey="id" />
</Card>
```

Rules for this pattern:

- **Accent by theme.** Green for energy figures, light blue for wallet and platform figures, orange for community activity.
- **A table inside a `Card` needs `flush`.** The rows then run edge to edge. Leave the table's `caption` out in this case, because the card title already names the table. A `caption` inside a flush card leaves a white strip above the header.
- **A balance below zero is not an error.** Show it with a minus sign. The `StatTile` does this already. Never color it red.
- **Right-align numbers** with `align: 'right'` in the column. The table then lines up digits.

## 3. List with detail

Sources: [`web-starter/src/pages/AssetsPage.tsx`](../apps/web-starter/src/pages/AssetsPage.tsx) (assets and maintenance suggestions), [`credits-example/src/pages/WalletsPage.tsx`](../apps/credits-example/src/pages/WalletsPage.tsx) (wallets)

Use it when a person scans a list and opens one item. The list sits on the left, and the detail sits on the right at wide widths and below the list on narrow ones.

```tsx
<div className="grid items-start gap-space-4 lg:grid-cols-[minmax(0,1fr)_380px]">
  <Card title="All wallets" flush>
    <AccountList wallets={wallets} selectedId={id} onSelect={(w) => setId(w.id)} />
  </Card>
  <AccountCard member={...} />
</div>
```

Rules for this pattern:

- **Select the first item on load.** An empty detail panel with a "Choose a row" message wastes the space. Both examples select the first row.
- **Show the backend's suggestions as they come.** On the Assets page, each maintenance suggestion is an `InlineAlert` whose title and text the backend writes. The interface does not decide what to suggest.
- **Keep the detail in its own column.** Do not open a modal for something people compare across rows.
- **Manager screens may show identifiers and codes.** `AccountList` and `Identifier` already shorten long IDs and add a Copy button.

## 4. Step flow

Source: [`credits-example/src/pages/SendCreditsPage.tsx`](../apps/credits-example/src/pages/SendCreditsPage.tsx)

Use it for any action that moves credits or sends a request. The design system ships two flows, `TransferForm` and `SettlementRequestForm`. Each has short steps and a check step before anything moves.

```tsx
const [status, setStatus] = useState<FlowStatus>('idle');

<Card>
  <TransferForm
    recipients={recipients}
    available={available}
    status={status}
    onSubmit={handleSubmit}
    onFinish={() => navigate('/')}
  />
</Card>
```

You drive the form through `status`:

| Status | When to set it | What the person sees |
| --- | --- | --- |
| `idle` | Initially, and after the person finishes | The steps |
| `working` | As soon as you send the request | A disabled button labeled "Sending…" |
| `done` | The backend confirmed | A result screen that states the new balance |
| `error` | The backend refused | An error alert on the check step. Pass `errorCode` (for example `INSUFFICIENT_BALANCE`) or `errorMessage`. |

Rules for this pattern:

- **One column, at most 480px wide.** Wrap the card in `max-w-[480px]`. Member flows are a single column even on wide screens.
- **Say that nothing moved when it fails.** The form adds "Your credits were not moved." to every error, also to an `errorMessage` you pass.
- **Do not predict the balance.** The check step shows the amount and the person only. The result screen shows `newBalance` as the backend reports it.
- **Do not add steps, or fields the specification does not require.** For example, `TransferForm` does not ask for a purpose code, because P2P transfers have none (open question 4 in the [open questions](reference/open-questions.md)).
- **Let people choose from a list.** `RecipientPicker` lists the people the backend supplies. Never ask someone to type a wallet address.

## 5. A page with several blocks

Source: [`credits-example/src/pages/MyWalletPage.tsx`](../apps/credits-example/src/pages/MyWalletPage.tsx)

When a page needs more than one pattern, stack them in a column and keep each in its own `Card`:

```tsx
<div className="flex flex-col gap-space-4">
  <WalletBalance balance={balance} />
  <Card title="Recent activity" flush>
    <TransactionList transactions={recent} />
  </Card>
</div>
```

Components that already look like cards (`WalletBalance`, `EnergySummary`, `BalanceStatement`, `AccountCard`, `TransactionDetail`) do not go inside another `Card`. Nesting them draws a box inside a box.

## Loading, empty and error

Data from a backend arrives late, can be empty and can fail. Every page that loads data in both apps shows all three. Add `?demo=empty` or `?demo=error` to the address to see them.

| State | What to show |
| --- | --- |
| Loading | A short sentence that says what loads, for example "Loading energy data…", with `role="status"`. |
| Empty | An info `InlineAlert`, or the component's `emptyText`. Say what will appear there later. |
| Error | An error `InlineAlert` that says what failed, and one button to try again. On credit screens, also say that nothing changed. |

## Member screens and manager screens

Member screens are for people with little experience of digital tools:

- plain words (credits, send, exchange for money), never EC, wallet IDs or purpose codes
- one task per screen and one primary button
- controls 52px tall (`size="lg"`, `large` on fields), rows at least 60px, text at least 16px
- icons always next to words

Manager screens may be denser and may show identifiers, codes and data quality. The full list is in [Design rules](design-rules.md).

## Responsive behavior

- The shell turns its side navigation into a horizontal row below 720px and reduces the page padding to 16px.
- Use Tailwind breakpoints for your own grids: `sm:` (640px), `lg:` (1024px), `xl:` (1280px).
- Wide tables scroll inside their own container. The page itself must not scroll sideways. Check at 400px wide.
- The top bar does not fit a long tool name and user on phones. `index.css` hides them below 560px. See [Troubleshooting](troubleshooting.md).
