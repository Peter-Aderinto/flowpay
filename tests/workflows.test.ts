import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixtures } from '../src/lib/fixtures';
import { defaultTransactionQuery, parseTransactionQuery, queryTransactions, transactionQueryString } from '../src/lib/transaction-query';
import { invoiceTotal, lineTotal, parsePrice } from '../src/lib/money';
import { invoiceStatus, validateInvoice } from '../src/lib/invoices';
import { createRepository, decodeStoredData, STORAGE_KEY, type DemoStorage } from '../src/lib/repository';
import { createMockApi } from '../src/lib/mock-api';
import { summarize } from '../src/lib/analytics';
import type { InvoiceDraft, Transaction } from '../src/lib/types';
const draft: InvoiceDraft = {
  customer: 'Demo Customer', email: 'demo@example.com', dueDate: '2026-10-15',
  items: [{ description: 'Sample item', quantity: '2', unitPrice: '125.55' }], notes: 'Fictional data',
};
function memoryStorage(initial: string | null = null): DemoStorage {
  let value = initial;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}
test('combined search, status, method and inclusive Lagos dates are applied before pagination', () => {
  const query = { ...defaultTransactionQuery, search: 'ada', status: 'successful' as const, method: 'bank_transfer' as const, from: '2026-07-11', to: '2026-10-08' };
  const result = queryTransactions(fixtures.transactions, query);
  const expected = fixtures.transactions.filter(t => t.customer.toLowerCase().includes('ada') && t.status === 'successful' && t.method === 'bank_transfer');
  assert.equal(result.total, expected.length);
  assert.deepEqual(result.items.map(t => t.id), expected.map(t => t.id));
  assert.equal(queryTransactions(fixtures.transactions, { ...defaultTransactionQuery, search: 'customer1@example.com' }).total, 1);
  assert.equal(queryTransactions(fixtures.transactions, { ...defaultTransactionQuery, search: 'FP-2026-0001' }).total, 1);
  const base = fixtures.transactions[0];
  const edges: Transaction[] = [
    { ...base, id: 'before', timestamp: '2026-10-07T22:59:59.999Z' },
    { ...base, id: 'start', timestamp: '2026-10-07T23:00:00.000Z' },
    { ...base, id: 'end', timestamp: '2026-10-08T22:59:59.999Z' },
    { ...base, id: 'after', timestamp: '2026-10-08T23:00:00.000Z' },
  ];
  assert.deepEqual(queryTransactions(edges, { ...defaultTransactionQuery, from: '2026-10-08', to: '2026-10-08' }).items.map(t => t.id), ['end', 'start']);
});
test('sort before pagination, clamp pages, and retain stable ordering', () => {
  const query = { ...defaultTransactionQuery, sort: 'amount_desc' as const };
  const first = queryTransactions(fixtures.transactions, query);
  const second = queryTransactions(fixtures.transactions, { ...query, page: 2 });
  assert.equal(first.total, 60); assert.equal(first.items.length, 10); assert.equal(first.pageCount, 6);
  assert.ok(first.items.every((t, i) => !i || first.items[i - 1].amountKobo >= t.amountKobo));
  assert.ok(first.items[9].amountKobo >= second.items[0].amountKobo);
  assert.equal(queryTransactions(fixtures.transactions, { ...query, page: 10000 }).page, 6);
  assert.equal(queryTransactions([], query).page, 1);
  const oldest = queryTransactions(fixtures.transactions, { ...query, sort: 'date_asc' });
  assert.equal(oldest.items[0].id, 'txn_0060');
});
test('query values round-trip and invalid URLs fall back safely', () => {
  const query = { ...defaultTransactionQuery, search: 'Ada & Stitch', status: 'pending' as const, method: 'card' as const, from: '2026-09-01', to: '2026-10-08', sort: 'amount_asc' as const, page: 2 };
  assert.deepEqual(parseTransactionQuery(new URLSearchParams(transactionQueryString(query))).query, query);
  const invalid = parseTransactionQuery(new URLSearchParams('status=unknown&method=cash&from=2026-02-30&to=bad&sort=oops&page=-3'));
  assert.deepEqual(invalid.query, defaultTransactionQuery); assert.equal(invalid.ignored, true);
  const reverse = parseTransactionQuery(new URLSearchParams('from=2026-10-08&to=2026-07-11&page=Infinity'));
  assert.equal(reverse.query.from, ''); assert.equal(reverse.query.to, ''); assert.equal(reverse.query.page, 1);
});
test('decimal prices become exact integer kobo; unsafe and malformed prices are rejected', () => {
  assert.equal(parsePrice('0.01'), 1); assert.equal(parsePrice('125.55'), 12555); assert.equal(parsePrice('1.2'), 120);
  assert.equal(parsePrice(' 001.09 '), 109);
  for (const input of ['-1', '1.234', '1e3', 'Infinity', 'NaN', '0', '', '1,000', '90071992547409.92']) assert.equal(parsePrice(input), null, input);
  assert.equal(lineTotal({ description: 'Item', quantity: 3, unitPriceKobo: 109 }), 327);
  assert.equal(lineTotal({ description: 'Item', quantity: 1.5, unitPriceKobo: 109 }), null);
  assert.equal(lineTotal({ description: 'Item', quantity: Number.MAX_SAFE_INTEGER, unitPriceKobo: 2 }), null);
  assert.equal(invoiceTotal([{ description: 'A', quantity: 1, unitPriceKobo: Number.MAX_SAFE_INTEGER }, { description: 'B', quantity: 1, unitPriceKobo: 1 }]), null);
});
test('invoice validation gives field errors and exact multi-item totals', () => {
  assert.equal(validateInvoice(draft).amountKobo, 25110); assert.equal(validateInvoice(draft).valid, true);
  const invalid = validateInvoice({ ...draft, customer: ' ', email: 'bad', dueDate: '2026-02-30', items: [{ description: '', quantity: '1.5', unitPrice: '-1' }] });
  for (const key of ['customer', 'email', 'dueDate', 'items.0.description', 'items.0.quantity', 'items.0.unitPrice']) assert.ok(invalid.errors[key]);
  assert.equal(validateInvoice({ ...draft, items: [] }).valid, false);
  assert.equal(validateInvoice({ ...draft, notes: 'a'.repeat(2001) }).valid, false);
  assert.equal(validateInvoice({ ...draft, items: [{ description: 'A', quantity: '9007199254740991', unitPrice: '1' }] }).errors.items, 'The total is too large. Reduce the quantities or prices.');
});
test('valid storage survives service/repository recreation and dashboard outstanding totals update', async () => {
  const storage = memoryStorage();
  const repository = createRepository(() => storage);
  let notifications = 0; repository.subscribe(() => { notifications++; });
  const api = createMockApi(1, repository);
  const before = summarize(await api.getDashboard('normal'), 30).outstanding;
  const created = await api.createInvoice(draft);
  assert.equal(created.status, 'unpaid'); assert.equal(created.amountKobo, 25110); assert.equal(notifications, 1);
  const reloaded = createRepository(() => storage);
  assert.equal(reloaded.read().invoices[0].number, created.number);
  assert.equal(summarize(reloaded.read(), 7).outstanding, before + 25110);
  const overdue = reloaded.createInvoice({ ...draft, dueDate: '2026-10-07' });
  assert.equal(overdue.status, 'overdue');
  assert.equal(invoiceStatus({ ...overdue, dueAt: '2026-10-08T23:59:59.999+01:00' }), 'unpaid');
  assert.equal(invoiceStatus({ ...overdue, status: 'paid' }), 'paid');
  assert.notEqual(overdue.id, created.id);
});
test('invalid, wrong-version and malformed nested storage recovers without crashing', () => {
  for (const raw of ['bad json', JSON.stringify({ version: 2, data: fixtures }), JSON.stringify({ version: 1, data: { transactions: [], invoices: [{}] } })]) {
    const storage = memoryStorage(raw); const repo = createRepository(() => storage);
    assert.equal(repo.read().invoices.length, 6); assert.match(repo.getWarning() ?? '', /invalid/);
    assert.ok(decodeStoredData(storage.getItem(STORAGE_KEY)));
  }
  const corrupt = structuredClone(fixtures); corrupt.invoices[0].amountKobo++;
  assert.equal(decodeStoredData(JSON.stringify({ version: 1, data: corrupt })), null);
  assert.equal(decodeStoredData(JSON.stringify({ version: 1, data: { transactions: [], invoices: [] } }))?.invoices.length, 0);
});
test('unavailable/read-only storage keeps session mutations and reports warning', () => {
  for (const storage of [null, { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }, { getItem() { return null; }, setItem() { throw new Error('quota'); } }]) {
    const repo = createRepository(() => storage);
    assert.equal(repo.read().invoices.length, 6);
    assert.match(repo.getWarning() ?? '', /storage|session/i);
    repo.createInvoice(draft); assert.equal(repo.read().invoices.length, 7);
    assert.match(repo.getWarning() ?? '', /session only/);
  }
});
test('empty/error requests never erase data; reset restores seed only after explicit mutation', async () => {
  const storage = memoryStorage(); const repo = createRepository(() => storage); const api = createMockApi(1, repo);
  await api.createInvoice(draft);
  const saved = storage.getItem(STORAGE_KEY);
  assert.equal((await api.getDashboard('empty')).invoices.length, 0);
  api.failNextRequest(); await assert.rejects(api.getDashboard('error'));
  assert.equal(storage.getItem(STORAGE_KEY), saved);
  assert.equal((await api.getDashboard('error')).invoices.length, 7);
  await api.resetDemoData(); assert.equal(repo.read().invoices.length, 6);
  assert.equal(createRepository(() => storage).read().invoices.length, 6);
});
test('unsafe aggregate totals and cancelled submissions do not mutate persisted invoices', async () => {
  const storage = memoryStorage(); const repo = createRepository(() => storage); const api = createMockApi(10, repo);
  repo.read(); const before = storage.getItem(STORAGE_KEY);
  assert.throws(() => repo.createInvoice({ ...draft, items: [{ description: 'Large item', quantity: '1', unitPrice: '90071992547409.91' }] }), /safe reporting total/);
  assert.equal(storage.getItem(STORAGE_KEY), before);
  const controller = new AbortController(); const request = api.createInvoice(draft, controller.signal); controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
  assert.equal(storage.getItem(STORAGE_KEY), before);
});
