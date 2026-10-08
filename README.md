# FlowPay — Phase 3

A portfolio demonstration of a Nigerian merchant payments dashboard for the fictional **Olive & Stitch** business. All sample financial data is fictional. There is no real payment provider, authentication, external database, or money movement. Enter fictional customer details only.

## Run in WSL Ubuntu

Requires Node.js **20.9 or newer**. The existing Next.js 16.4 / React 19.3 framework versions and Webpack configuration are retained.

```bash
npm ci
npm run dev
```

Open **http://localhost:3000**; `/` redirects to `/dashboard`. If a preview is already running, source edits refresh automatically. Verification uses a separate build directory and port so it does not replace the preview's `.next` output.

## Implemented workflows

- **Overview:** 7/30/90-day reporting, four derived metrics, successful collection trend, accessible chart points with hover/focus values and arrow-key navigation, exact chart-data table, and five recent payments. Total collected uses a deep emerald card. No invented percentage changes or balances.
- **Transactions:** search by customer/email/reference; status, card/bank-transfer and inclusive Lagos date filters; date/amount ordering; service-side filtering and sorting before 10-row pagination; results count; Clear filters. The `q`, `status`, `method`, `from`, `to`, `sort`, and `page` URL parameters restore on refresh and browser Back/Forward. Invalid values are ignored safely; page numbers are clamped to available results. Filter and sort changes reset pagination.
- **Transaction details:** native modal dialog showing amount, reference, customer/email, status, method, timestamp, and linked invoice preview. Copy reference reports success or failure. Escape/close dismiss the modal, focus stays inside it, and focus returns to the opening control.
- **Invoices:** search by invoice/customer/email, paid/unpaid/overdue filter, previews, and creation with customer details, due date, line items and notes. Add/remove items while keeping at least one. Prices are parsed from decimal strings to integer kobo; quantities must be positive safe integers. Negative/zero prices, excess decimal places, invalid fields and unsafe line/invoice/reporting totals are rejected. Submission is guarded against double clicks; cancelling a pending form aborts the write.
- **Responsive interface:** semantic desktop tables, mobile record cards, labelled inputs, field-level validation, visible keyboard focus, compact navigation, tabular monetary numerals, and reduced-motion support.

## Fixed sample date and financial rules

The demo is frozen at **8 October 2026, end of day in Africa/Lagos (UTC+01:00)**. Sixty seeded transactions cover **11 July–8 October 2026 inclusive**, with unique references, fictional customer names, example.com emails, explicit timestamp timezones, integer kobo amounts and NGN currency.

Collected totals and the chart include **successful** transactions only. Pending totals include only pending transactions; failed transactions are excluded from both. Recent transactions include all statuses within the selected period. Outstanding invoices include every unpaid or overdue invoice **across all time**, independent of the reporting window. Six seeded invoices contain three paid examples, one unpaid and two overdue; each paid invoice has exactly one linked full successful payment. There are no refunds, partial payments, tax, discounts or simulated invoice payments.

New invoices are stored as unpaid. Their displayed overdue status is derived from the fixed demo date, not the computer's current date. A due date of 8 October remains unpaid through that day's end; earlier dates appear overdue. Invoice totals are calculated from validated line items and are reflected in the dashboard after creation or reset.

## Mock API and browser persistence

`src/lib/mock-api.ts` provides typed promise-based requests with a short delay and AbortSignal support. **It does not make HTTP requests.** UI components never import fixtures. The service queries the shared repository, including filtering/sorting before pagination. Request keys and abort cleanup stop old responses overwriting new selections.

`src/lib/repository.ts` stores the full demo dataset under the versioned localStorage key **`flowpay.demo.v1`** with a `{ version: 1, data }` envelope. Fixtures are seeded only when no valid stored dataset exists. The decoder validates shapes, integer amounts, item totals, unique identifiers and paid-invoice links. Malformed or incompatible data is replaced with the original sample data and a recovery notice. Unavailable/full storage falls back to memory, keeps the current session working, and displays a warning that changes may be lost on reload. Storage access starts after hydration; initial server/client rendering uses the same loading state.

Created invoices are saved **only in this browser/profile**, not to GitHub or a server. Repository subscribers refresh relevant views after writes, and storage events refresh open views when another tab changes the dataset. Simultaneous writes from multiple tabs are not a database transaction; this is a single-browser portfolio demo, not a production financial system.

## Exercise request states and reset

Expand **Demo controls** below any main page:

- **Normal:** return the saved demo dataset.
- **Empty:** return an empty view without deleting anything saved.
- **Error (once):** fail the next request once; **Retry** then recovers. Switch away and back to Error to repeat it.
- **Reset demo data:** confirm to remove browser-created invoices and restore the original sample dataset. Cancel leaves the saved data intact.

All requests are deterministic; there are no random failures. Lists distinguish an empty dataset from no matching filters. Dashboard and lists include loading and error/retry states. A persistence warning appears when browser storage fails.

## Structure

- `src/lib/types.ts`, `fixtures.ts`, `demo.ts`: types and seed dataset.
- `src/lib/analytics.ts`, `transaction-query.ts`: reporting and URL/query logic.
- `src/lib/money.ts`, `invoices.ts`: exact kobo parsing, totals, dates and invoice validation.
- `src/lib/repository.ts`, `mock-api.ts`: persistence, notifications and asynchronous services.
- `src/lib/format.ts`: centralized Intl NGN and Lagos date/time formatting.
- `src/components`: shared shell, native dialog, request states, demo controls and workflow components.
- `src/app/(merchant)`: shared layout and the three routes.

## Verification

```bash
npm run lint
npm run typecheck
npm test
FLOWPAY_DIST_DIR=.next-verify npm run build
```

The optional `FLOWPAY_DIST_DIR` preserves running development output; normal builds use `npm run build` followed by `npm start`. To inspect the isolated build independently:

```bash
FLOWPAY_DIST_DIR=.next-verify npm start -- --port 3100
```

Focused tests cover financial/status exclusions, Lagos date boundaries, query parsing and combined filters, sorting/pagination, exact money calculations, invoice validation, dataset integrity, persistence/recovery, unavailable storage, one-shot errors, cancellation, reset and preservation through empty/error responses. Browser verification exercises URL history, details keyboard behaviour, invoice creation/reload persistence, dashboard totals and mobile layouts.

The existing npm dependency tree reports five high-severity advisories in the ESLint tooling chain. npm's proposed automatic fix downgrades the Next.js ESLint configuration to v14; it has not been applied to this v16 application.
