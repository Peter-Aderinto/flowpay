# FlowPay — Phase 2

A fictional Nigerian merchant dashboard for Olive & Stitch. No real payment provider, authentication, credentials, or database. No real money movement.

## Run in WSL Ubuntu

Node.js >=20.9 is required. Framework versions and the working Webpack development configuration are retained.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. `/` redirects to `/dashboard`. `/transactions` and `/invoices` are honest previews of features for a future phase, with working shared navigation.

## Mock architecture

- `src/lib/types.ts`: typed transactions, invoices, periods, and scenarios. Amounts are integer kobo; currency is NGN.
- `src/lib/fixtures.ts`: 60 deterministic transactions with unique IDs/references, fictional customers and example.com emails, successful/pending/failed statuses, card/bank-transfer methods, and timezone-explicit timestamps. Six related invoices include three paid, one unpaid, and two overdue. Each paid invoice has one full successful linked payment; no partial payments or refunds.
- `src/lib/demo.ts`: fixed as-of time **8 October 2026, end of day in Africa/Lagos**. The 90-calendar-day dataset covers **11 July–8 October 2026 inclusive**. The 7/30/90-day windows include the complete final Lagos calendar day, rather than depending on the viewer's current clock.
- `src/lib/mock-api.ts`: typed asynchronous in-memory service with a 450ms delay and AbortSignal cancellation. It returns promises; it does **not** make real HTTP requests. Components obtain data only through this layer. Each dashboard owns its service instance.
- `src/lib/analytics.ts`: shared filtering, financial summaries, and trend buckets. Collected totals and charts use only successful payments. Pending totals use only pending payments. Outstanding invoices include unpaid and overdue invoices across all time, independent of the selector. The recent list includes all statuses in the selected period.
- `src/lib/format.ts`: consistent Intl NGN formatting and Lagos date formatting.
- `src/components`: responsive shell, request states, summary cards, recent payments, and an SVG chart with exact values in an accessible data table. No chart dependency is needed.

Requests are aborted on selection changes and unmount; a request sequence guard prevents older responses from overwriting newer selections. Initial loading is deterministic and uses sized skeletons.

## Exercise the demo

1. Open Overview and switch between 7, 30, and 90 days; cards, chart, and recent payments use the same window.
2. Expand **View chart data** for a table of exact successful collection totals. The 90-day view uses 7-day buckets (the final bucket is shorter); other views use daily totals.
3. Expand **Demo controls** below the dashboard. Normal loads the sample data. Empty returns no transactions or invoices. Error fails the next request once; press **Retry** to recover. Switch away and back to Error to repeat it. No random failures occur.
4. Follow Transactions or Invoices in the sidebar (or mobile menu). These pages describe planned functionality without fake actions.

## Checks

```bash
npm run lint
npm run typecheck
npm test
FLOWPAY_DIST_DIR=.next-verify npm run build
```

Verification uses a separate output directory so it does not overwrite a running development server's `.next` directory. `next.config.ts` supports `FLOWPAY_DIST_DIR` but defaults to the original `.next`. Production normally uses `npm run build` and `npm start`.

Tests cover collection/status exclusions, pending and all-time invoice totals, inclusive date boundaries and timezone equivalence, dataset/payment-link integrity, chart/summary agreement, empty results, one-shot error recovery, and cancellation.

The npm dependency tree reports five high-severity advisories in the existing ESLint tooling chain. npm's suggested fix downgrades the Next.js ESLint configuration to v14; it has not been applied to this v16 project.
