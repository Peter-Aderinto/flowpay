import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectionTrend, filterTransactions, periodBounds, summarize } from '../src/lib/analytics';
import { fixtures } from '../src/lib/fixtures';
import { DEMO_AS_OF, DEMO_START } from '../src/lib/demo';
import { createMockApi } from '../src/lib/mock-api';
import type { DashboardData, Transaction } from '../src/lib/types';
const make = (status: Transaction['status'], amountKobo: number, timestamp = DEMO_AS_OF): Transaction => ({ id: status + timestamp, reference: status, customer: 'Test Customer', email: 'test@example.com', amountKobo, currency: 'NGN', status, method: 'card', timestamp });
test('collected includes successful payments only; pending and all-time invoices are separate', () => {
  const data: DashboardData = { transactions: [make('successful', 10001), make('pending', 20002), make('failed', 90000)], invoices: [
    { id: 'a', customer: 'Test', currency: 'NGN', amountKobo: 50000, status: 'unpaid', dueAt: DEMO_AS_OF },
    { id: 'b', customer: 'Test', currency: 'NGN', amountKobo: 30000, status: 'overdue', dueAt: DEMO_START },
    { id: 'c', customer: 'Test', currency: 'NGN', amountKobo: 90000, status: 'paid', dueAt: DEMO_START },
  ] };
  for (const days of [7, 30, 90] as const) { const s = summarize(data, days); assert.equal(s.collected, 10001); assert.equal(s.successful, 1); assert.equal(s.pending, 20002); assert.equal(s.outstanding, 80000); }
});
test('calendar windows include both boundaries and exclude older and future timestamps', () => {
  for (const days of [7, 30, 90] as const) {
    const { start, end } = periodBounds(days);
    const list = [start - 1, start, end, end + 1].map(time => make('successful', 100, new Date(time).toISOString()));
    assert.deepEqual(filterTransactions(list, days).map(t => Date.parse(t.timestamp)), [end, start]);
    const equivalentTimezone = make('successful', 200, '2026-10-08T22:59:59.999Z');
    assert.equal(filterTransactions([equivalentTimezone], days).length, 1);
  }
  assert.equal(periodBounds(90).start, Date.parse(DEMO_START));
});
test('fixture IDs, amounts, range, and paid invoice links are consistent', () => {
  assert.ok(fixtures.transactions.length >= 40);
  assert.equal(new Set(fixtures.transactions.map(t => t.id)).size, fixtures.transactions.length);
  assert.equal(new Set(fixtures.transactions.map(t => t.reference)).size, fixtures.transactions.length);
  assert.equal(filterTransactions(fixtures.transactions, 90).length, fixtures.transactions.length);
  for (const t of fixtures.transactions) { assert.ok(Number.isSafeInteger(t.amountKobo)); assert.ok(t.email.endsWith('@example.com')); }
  for (const invoice of fixtures.invoices.filter(i => i.status === 'paid')) {
    const linked = fixtures.transactions.filter(t => t.invoiceId === invoice.id);
    assert.equal(linked.length, 1); assert.equal(linked[0].id, invoice.transactionId); assert.equal(linked[0].status, 'successful'); assert.equal(linked[0].amountKobo, invoice.amountKobo);
  }
});
test('trend totals equal successful collections for each reporting period', () => {
  for (const days of [7, 30, 90] as const) assert.equal(collectionTrend(fixtures.transactions, days).reduce((sum, b) => sum + b.amountKobo, 0), summarize(fixtures, days).collected);
  assert.equal(summarize({ transactions: [], invoices: [] }, 30).collected, 0);
});
test('mock error fails once, retry recovers, empty is deterministic, and requests cancel', async () => {
  const api = createMockApi(2);
  api.failNextRequest();
  await assert.rejects(api.getDashboard('error'), /could not load/);
  assert.equal((await api.getDashboard('error')).transactions.length, 60);
  assert.deepEqual(await api.getDashboard('empty'), { transactions: [], invoices: [] });
  const controller = new AbortController(); const request = api.getDashboard('normal', controller.signal); controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
});
