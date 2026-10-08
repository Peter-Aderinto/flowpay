import { DAY_MS, DEMO_AS_OF } from './demo';
import type { DashboardData, Period, Transaction } from './types';
export function periodBounds(days: Period) {
  const end = Date.parse(DEMO_AS_OF);
  return { start: end + 1 - days * DAY_MS, end };
}
export function filterTransactions(transactions: Transaction[], days: Period) {
  const { start, end } = periodBounds(days);
  return transactions.filter(t => {
    const time = Date.parse(t.timestamp);
    return time >= start && time <= end;
  }).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}
export function summarize(data: DashboardData, days: Period) {
  const transactions = filterTransactions(data.transactions, days);
  return {
    collected: transactions.filter(t => t.status === 'successful').reduce((sum, t) => sum + t.amountKobo, 0),
    successful: transactions.filter(t => t.status === 'successful').length,
    pending: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amountKobo, 0),
    outstanding: data.invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amountKobo, 0),
    recent: transactions.slice(0, 5),
    transactions,
  };
}
export function collectionTrend(transactions: Transaction[], days: Period) {
  const { start } = periodBounds(days);
  const bucketDays = days === 90 ? 7 : 1;
  const buckets = Array.from({ length: Math.ceil(days / bucketDays) }, (_, i) => ({
    timestamp: new Date(start + i * bucketDays * DAY_MS).toISOString(),
    endTimestamp: new Date(Math.min(start + (i + 1) * bucketDays * DAY_MS - 1, Date.parse(DEMO_AS_OF))).toISOString(),
    amountKobo: 0,
  }));
  for (const t of filterTransactions(transactions, days)) {
    if (t.status === 'successful') buckets[Math.floor((Date.parse(t.timestamp) - start) / (bucketDays * DAY_MS))].amountKobo += t.amountKobo;
  }
  return buckets;
}
