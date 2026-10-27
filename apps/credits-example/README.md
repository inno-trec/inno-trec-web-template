# credits-example

An example for INNO-TREC tools that work with energy credits (the Energy Credit Management System, ECMS). Start from [`web-starter`](../web-starter) and copy the pages you need from here. For monitoring, PV performance and maintenance pages, see [`template-demo`](../template-demo).

## What it shows

| Page | Pattern | File |
| --- | --- | --- |
| Overview | Headline numbers and a ledger table in a card | `src/pages/DashboardPage.tsx` |
| Wallets | A list with a detail panel (manager screen) | `src/pages/WalletsPage.tsx` |
| Send credits | A step flow driven by a status | `src/pages/SendCreditsPage.tsx` |
| My wallet | A member screen with loading, empty and error states | `src/pages/MyWalletPage.tsx` |
| Any other address | A page not found | `src/pages/NotFoundPage.tsx` |

## Run it

From the repository root:

```sh
npm install
npm run dev:credits
```

## See the other states

`src/data/api.ts` is a fake backend: each request waits a moment and then answers. Add one of these to the address:

- `?demo=empty` shows a new member with no activity (My wallet).
- `?demo=error` makes every request fail (My wallet, and the last step of Send credits).

## Rules for credit screens

These rules come from the design system and apply to every screen that shows credits. They are in [Design rules](../../docs/design-rules.md#energy-credits).

- The backend computes every credit amount, balance and limit. The interface displays them.
- A negative balance is normal: show it with a minus sign in normal text, never red.
- Member screens never show EC, wallet IDs, purpose codes, hashes or formulas.
- Do not decide anything listed in the [open questions](../../docs/reference/open-questions.md) in the interface.

The data in `src/data/sample.ts` is example data from ECMS user story 4.
