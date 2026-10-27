# Page patterns

Two apps show the patterns most tools need. `web-starter` holds the patterns of the monitoring, PV performance and maintenance tools (monitoring over time, performance against references, data checks, alerts, lists with detail, forms). `credits-example` holds the patterns of credit tools (ledger overview, step flow, member screen). Each pattern is a real file you can copy. This page explains what each one is for and which rules shape it.

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

## 6. Forms in dialogs

Source: [`web-starter/src/pages/UsersPage.tsx`](../apps/web-starter/src/pages/UsersPage.tsx)

Use it for short tasks that create or change one thing: invite a user, edit a role, confirm a deactivation. The list stays visible behind the dialog, so the person keeps their place.

```tsx
<Dialog
  open={open}
  title="Invite a user"
  onClose={close}
  actions={<>
    <Button onClick={close}>Cancel</Button>
    <Button variant="primary" type="submit" form="invite-user">Invite user</Button>
  </>}
>
  <form id="invite-user" onSubmit={onSubmit} noValidate>
    <TextField label="Email" required value={email} onChange={…} error={errors.email} />
    <RadioGroup label="Role" options={roles} value={role} onChange={setRole} />
  </form>
</Dialog>
```

Rules for this pattern:

- **One task per dialog.** A form with more than about six fields, or with sections, gets its own page.
- **Cancel first, main action last.** The main action is a verb ("Invite user", "Save changes"). It reads "Inviting…" and is disabled while the request runs.
- **The form checks only that required fields are filled in.** The backend checks everything else (a taken email, a date in the past) and answers with a message per field. Show each message under its field with `error`, and show a general failure as an error `InlineAlert` at the top of the form that says nothing was changed.
- **Confirm before taking something away.** Deactivating a user opens a small `Dialog` with a `danger` button. The question names the person ("Deactivate Rosa Almeida?") and the text says what happens and whether it can be undone.
- **Say what happened.** After a save, the dialog closes, the list shows the backend's answer, and a success `InlineAlert` names the change.
- **Choose the right control.** `RadioGroup` for one of two to five options (with a description when the effect is not obvious), `Select` for longer lists, `Checkbox` for a yes or no confirmed with the form, `Switch` for a setting that is on or off, `DateField` for one day, `Textarea` for long text.
- **The backend owns the options.** The roles and their descriptions come from the backend, which also decides what each role may do.

## 7. Performance against references

Source: [`web-starter/src/pages/PerformancePage.tsx`](../apps/web-starter/src/pages/PerformancePage.tsx)

Use it to evaluate PV systems: performance ratio, availability, specific yield and efficiency, each against the system's own history and the community as a whole.

```tsx
<LazyBarChart
  categories={systems.map((s) => s.name)}
  values={systems.map((s) => s.specificYield.value)}
  name="Specific yield"
  color={colors['series-pv']}
  unit="kWh/kWp"
  reference={{ name: 'Community', value: community.specificYieldKwhPerKwp }}
  label="Specific yield of each PV system, compared with the community"
/>
```

Rules for this pattern:

- **The backend computes the indicators and decides their status.** The page shows "Below normal" when the API says so. The definitions are still open (tracking D2).
- **A reference is a dotted line**, labeled with its name and value. Dashed lines mean estimates.
- **Bars have one color**, the series color of what is measured. Never color a bar by its status: the table carries a `Badge` instead.
- **Show the usual value next to each indicator** ("usually 81"), so a reader can judge it without a second chart.
- **Horizontal bars** keep long system names readable on phones.

## 8. Data checks: do the sources agree?

Source: [`web-starter/src/pages/DataChecksPage.tsx`](../apps/web-starter/src/pages/DataChecksPage.tsx)

Use it to validate the coherence between sources of the same quantity: a meter, inverter monitoring, a model such as the DSS. For each quantity the backend names one reference source and compares every other source with it.

Rules for this pattern:

- **List every source first**, with readings received, deviation, tolerance and status. Start with a source outside its tolerance selected, because that is what needs a look.
- **Chart one source at a time**: its deviation (%) from the reference over time, in the quantity's series color, with the tolerance as a `surface-muted` band and a line at zero (`TimeSeriesChart` with `band`). Never overlay several sources of one quantity.
- **A source with no data is a status, not a zero.** Say that nothing can be compared until it sends readings again.

## 9. Alerts inbox

Source: [`web-starter/src/pages/AlertsPage.tsx`](../apps/web-starter/src/pages/AlertsPage.tsx)

Use it for corrective alerts (a failure to repair) and predictive alerts (performance below normal). The alert engine raises them, writes their text and notifies the people responsible; this page shows them and records who handles them.

Rules for this pattern:

- **Tabs by state** (Open by default, then New, Acknowledged, Resolved, All) with the counts the backend sends, and a `Select` for the type above them.
- **The backend pages the list.** `Pagination` in the Card's footer shows "1–5 of 13 alerts" from the backend's `total`. A new tab or filter goes back to page 1.
- **Severity and state are words with color**: `Badge` in the list, an `InlineAlert` with the backend's text in the detail.
- **A predictive alert shows its indicator** with the usual value ("Performance ratio 66 % (usually 81 %)").
- **Acknowledge says someone is on it; resolve asks what was done.** Resolving opens a `Dialog` with a required `Textarea` and optional photos (`FileUpload`); the backend checks their type and size. The record keeps who acknowledged, what was done and the photos.
- **A `Toast` confirms each change** ("Alert resolved"). Errors stay on the page in an `InlineAlert`.
- **The asset page links here.** An asset shows its open alerts and an "Open alerts" button.

## 10. Account screens

Sources: [`web-starter/src/pages/auth/`](../apps/web-starter/src/pages/auth/SignInPage.tsx) (sign in, ask for an account, accept an invitation, forgot and reset password), [`AccountPage.tsx`](../apps/web-starter/src/pages/AccountPage.tsx) and the approval on [`UsersPage.tsx`](../apps/web-starter/src/pages/UsersPage.tsx)

Use them for everything around an account. People join in two ways: a manager invites them, or they ask for an account and a manager approves it on the Users page.

Rules for this pattern:

- **Screens without a session use `AuthLayout`**: the tool's top bar, one panel with one task and one primary button, and the same footer. The way to the other screen goes below the panel ("New here? Ask for an account").
- **Ask for a new password once, with `PasswordField`.** Its Show button replaces a second "repeat the password" field. The hint says the rule; the backend checks it.
- **Set `autoComplete` on every field**: `username` or `email`, `current-password`, `new-password`, `name`. Password managers depend on it.
- **Do not help an attacker.** Say "The email or password is wrong", not which one. After a reset request, show the same message whether the email exists or not.
- **Say why the person is on the sign-in screen**: signed out, session ended, or new password saved (`?reason=`). After signing in, return to the page they asked for (`?next=`), and only within the tool.
- **An expired link is a normal state**: say what happened and link to the step that sends a new one.
- **Roles hide pages, the backend enforces them.** A page with `roles` in `NAV` disappears from the navigation for other roles, and its address explains that access is missing.

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
