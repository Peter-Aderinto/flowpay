import { isDate } from './invoices';
import type { Transaction, TransactionPage, TransactionQuery, TransactionSort } from './types';
export const PAGE_SIZE = 10;
const sorts: TransactionSort[] = ['date_desc', 'date_asc', 'amount_desc', 'amount_asc'];
export const defaultTransactionQuery: TransactionQuery = { search: '', status: '', method: '', from: '', to: '', sort: 'date_desc', page: 1 };
export function parseTransactionQuery(params: Pick<URLSearchParams, 'get'>) {
  const query = { ...defaultTransactionQuery };
  let ignored = false;
  query.search = (params.get('q') ?? '').slice(0, 200);
  const status = params.get('status');
  if (status && ['successful', 'pending', 'failed'].includes(status)) query.status = status as Transaction['status'];
  else if (status) ignored = true;
  const method = params.get('method');
  if (method && ['card', 'bank_transfer'].includes(method)) query.method = method as Transaction['method'];
  else if (method) ignored = true;
  for (const key of ['from', 'to'] as const) {
    const value = params.get(key);
    if (value && isDate(value)) query[key] = value;
    else if (value) ignored = true;
  }
  if (query.from && query.to && query.from > query.to) { query.from = ''; query.to = ''; ignored = true; }
  const sort = params.get('sort');
  if (sort && sorts.includes(sort as TransactionSort)) query.sort = sort as TransactionSort;
  else if (sort) ignored = true;
  const page = params.get('page');
  if (page && /^\d+$/.test(page) && Number(page) >= 1 && Number(page) <= 100000) query.page = Number(page);
  else if (page) ignored = true;
  return { query, ignored };
}
export function transactionQueryString(query: TransactionQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('q', query.search);
  for (const key of ['status', 'method', 'from', 'to'] as const) if (query[key]) params.set(key, query[key]);
  if (query.sort !== 'date_desc') params.set('sort', query.sort);
  if (query.page !== 1) params.set('page', String(query.page));
  return params.toString();
}
export function queryTransactions(transactions: Transaction[], query: TransactionQuery): TransactionPage {
  const search = query.search.trim().toLowerCase();
  const start = query.from ? Date.parse(`${query.from}T00:00:00+01:00`) : -Infinity;
  const end = query.to ? Date.parse(`${query.to}T23:59:59.999+01:00`) : Infinity;
  const items = transactions.filter(t =>
    (!search || [t.customer, t.email, t.reference].some(s => s.toLowerCase().includes(search))) &&
    (!query.status || t.status === query.status) && (!query.method || t.method === query.method) &&
    Date.parse(t.timestamp) >= start && Date.parse(t.timestamp) <= end
  ).sort((a, b) => {
    const difference = query.sort.startsWith('amount') ? a.amountKobo - b.amountKobo : Date.parse(a.timestamp) - Date.parse(b.timestamp);
    return difference ? (query.sort.endsWith('desc') ? -difference : difference) : a.id.localeCompare(b.id);
  });
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), pageCount);
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: items.length, datasetCount: transactions.length, page, pageCount };
}
