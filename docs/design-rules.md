# Design rules

These are the rules from the design system that most often decide whether a screen is accepted. They are short on purpose. The full source is the [brand book](reference/brand-book.md) and [`DESIGN.md`](reference/DESIGN.md).

The first sections apply to every INNO-TREC tool. [Charts](#charts) applies to tools that plot data over time. [Energy credits](#energy-credits) applies only to screens that show credits.

## The look

- **Flat and square.** No shadows, no gradients, no rounded cards. Surfaces are separated by a 1px border and by the contrast between white cards and the pale gray page. The Tailwind preset removes `rounded-lg`, `shadow-md` and similar classes on purpose.
- **Brand colors are fills and accents, not text.** `green` and `orange` as text on a light background fail contrast. Light blue is the only brand color that works as text on white.
- **Each fill has its own text color.** Ink on green, white on light blue, black on orange. Do not set white text on green or orange.
- **One primary button per screen**, labeled with a verb ("Create work order", "Send credits").
- **Every tool shows the EU funding emblem.** INNO-TREC is funded by Horizon Europe. The `Footer` in `ToolShell.tsx` shows the emblem and the funding statement. Keep it, and never recolor or crop the emblem.
- **Focus is always visible.** A 2px light blue outline with a 2px offset on every interactive element. Components do this already. Keep it on anything you build yourself.

## Numbers and units

- **The backend computes every figure.** Energy totals, shares, yield, performance indicators, credit amounts and balances all come from the API. The interface formats and displays them.
- Write every number with its unit (kW, kWh, kWp, %) and with thousands separators: "1,284 kWh".
- Use a real minus sign (−), not a hyphen.
- **Missing data is never zero.** Show a gap in a chart and "No data" in a table.
- Pair every status with a word and an icon. Status is never color alone.

## Charts

The design system has four series colors with a fixed meaning. Use them through `@inno-trec/tokens` (`colors['series-pv']`) or the Tailwind classes (`bg-series-pv`). The starter's [`TimeSeriesChart`](../apps/web-starter/src/charts/TimeSeriesChart.tsx) applies all of these rules.

| Token | Series |
| --- | --- |
| `series-consumption` | Consumption |
| `series-pv` | PV production |
| `series-storage` | Storage |
| `series-grid` | Grid import and export |

- **A series keeps its color in every chart.** A chart that shows only PV still uses `series-pv`. Never assign colors in order of appearance.
- **Do not use the brand `green` or `orange` for chart marks.** They fail contrast as lines, and colorblind readers cannot tell them apart. The series colors were checked together for both problems.
- **One y-axis per chart.** Two units (kW and %) go in two charts that share the time axis.
- **Name every series.** Use a legend when there are two or more series, and label the lines directly when there is room.
- **Text stays ink.** Axis labels, legends and tooltips use `ink` and `ink-muted`, never a series color.
- **Estimated values are dashed** and the tooltip says "estimated".
- **Say which time zone** the times are in.
- **Offer a table** with the same numbers, for readers who cannot use the chart.

## Accessibility

- Text contrast of at least 4.5:1. Borders, icons, chart lines and focus rings at least 3:1.
- Every form field has a visible label.
- Test your page at 400px wide. Nothing may scroll sideways except a wide table inside its own container.

## Names and text

- Write the project name as **INNO-TREC** in text. **INNOTREC** without the hyphen appears only inside the logo.
- Use the logo files as supplied, in full color on light grounds and grayscale on dark grounds. Do not recolor, redraw, stretch or invert them, and keep a clear space of the logo's height divided by four on every side.
- The components contain English text. Use American English in anything you add.

## Energy credits

These rules apply to screens that show energy credits (the ECMS). [`apps/credits-example`](../apps/credits-example) applies them.

### What members see

- Use plain words: credits, send, exchange for money, community manager.
- Never show members: EC, wallet IDs, purpose codes, hashes, "issuance", "CEMA", formulas, conversion factors or rule names. These appear only on manager screens, or inside a closed "Technical details" section.
- Never ask members to type an ID or address. Let them choose from a list.
- Split tasks into short steps ("Step 1 of 3") with a Back button. Show a check step before anything moves, and a clear result after.
- Touch targets on member screens: buttons and inputs 52px tall, list rows at least 60px.
- Write errors as one sentence: what happened and what to do next. After a failed send, say that no credits moved.
- Do not show "pending" or "failed" transactions. Ledger records are final. Show requests that wait for the community manager as requests.

### Balances

- Use + or − in activity lists: "+350 credits".
- **A balance below zero is not an error.** Community and dependent wallets are normally below zero. Show the minus sign in normal text. Never color it red.
- Components never apply a valuation factor and never predict a balance.

### Things the specification leaves open

The ECMS specification and user stories are ambiguous in places (how members authorize a transfer, how to explain a negative balance, the states of a settlement request, and others). Components do not decide these. Read the [open questions](reference/open-questions.md) before you design a screen that touches one, and do not invent the answer in the interface. Ask the people who own the specification.

## A short checklist before a pull request

- [ ] One primary button per screen
- [ ] No shadows, gradients or rounded corners that you added
- [ ] Every number has its unit, and missing data is not shown as zero
- [ ] Every chart uses the series colors, one y-axis and a legend
- [ ] Every table in a `Card` uses `flush` and has no `caption`
- [ ] The footer with the EU funding emblem is still on every page
- [ ] Checked at 400px and at 1440px wide
- [ ] `npm run typecheck` and `npm run build` pass
- [ ] Credit screens only: no codes, IDs or formulas for members, and negative balances in normal text
