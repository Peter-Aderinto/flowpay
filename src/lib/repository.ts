import { fixtures } from './fixtures';
import { DEMO_AS_OF } from './demo';
import { invoiceStatus, isDate, validateInvoice } from './invoices';
import { invoiceTotal } from './money';
import type { DashboardData, Invoice, InvoiceDraft, Transaction } from './types';
export const STORAGE_KEY = 'flowpay.demo.v1';
export interface DemoStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function amount(value: unknown) { return typeof value === 'number' && Number.isSafeInteger(value) && value > 0; }
function timestamp(value: unknown) { return typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)); }
function validTransaction(t: unknown): t is Transaction {
  return record(t) && typeof t.id === 'string' && typeof t.reference === 'string' && typeof t.customer === 'string' &&
    typeof t.email === 'string' && amount(t.amountKobo) && t.currency === 'NGN' &&
    ['successful', 'pending', 'failed'].includes(String(t.status)) && ['card', 'bank_transfer'].includes(String(t.method)) &&
    timestamp(t.timestamp) && (t.invoiceId === undefined || typeof t.invoiceId === 'string');
}
function validInvoice(i: unknown): i is Invoice {
  if (!record(i) || typeof i.id !== 'string' || typeof i.number !== 'string' || typeof i.customer !== 'string' ||
    typeof i.email !== 'string' || !amount(i.amountKobo) || i.currency !== 'NGN' || !timestamp(i.dueAt) ||
    !['paid', 'unpaid', 'overdue'].includes(String(i.status)) || !Array.isArray(i.items) || !i.items.length ||
    (i.notes !== undefined && typeof i.notes !== 'string') || !timestamp(i.createdAt)) return false;
  const items = i.items;
  if (!items.every(item => record(item) && typeof item.description === 'string' && item.description.trim() &&
    typeof item.quantity === 'number' && Number.isSafeInteger(item.quantity) && item.quantity > 0 && amount(item.unitPriceKobo))) return false;
  return invoiceTotal(items as NonNullable<Invoice['items']>) === i.amountKobo &&
    (i.transactionId === undefined || typeof i.transactionId === 'string');
}
export function decodeStoredData(raw: string | null): DashboardData | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 1 || !record(value.data)) return null;
    const { transactions, invoices } = value.data;
    if (!Array.isArray(transactions) || !transactions.every(validTransaction) || !Array.isArray(invoices) || !invoices.every(validInvoice)) return null;
    if (new Set(transactions.map(t => t.id)).size !== transactions.length || new Set(transactions.map(t => t.reference)).size !== transactions.length ||
      new Set(invoices.map(i => i.id)).size !== invoices.length || new Set(invoices.map(i => i.number)).size !== invoices.length) return null;
    for (const invoice of invoices) {
      const payments = transactions.filter(t => t.invoiceId === invoice.id);
      if (invoice.status === 'paid') {
        if (payments.length !== 1 || payments[0].id !== invoice.transactionId || payments[0].status !== 'successful' || payments[0].amountKobo !== invoice.amountKobo) return null;
      } else if (invoice.transactionId !== undefined || payments.length) return null;
    }
    if (transactions.some(t => t.invoiceId && !invoices.some(i => i.id === t.invoiceId))) return null;
    if (!Number.isSafeInteger(transactions.reduce((sum, t) => sum + t.amountKobo, 0)) ||
      !Number.isSafeInteger(invoices.reduce((sum, i) => sum + i.amountKobo, 0))) return null;
    return { transactions, invoices };
  } catch { return null; }
}
export function createRepository(getStorage: () => DemoStorage | null) {
  let data: DashboardData | null = null;
  let warning: string | null = null;
  let revision = 0;
  const listeners = new Set<() => void>();
  const notify = () => { revision++; for (const listener of listeners) listener(); };
  function save() {
    try {
      const storage = getStorage();
      if (!storage) throw new Error('Unavailable storage');
      storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data }));
      warning = null;
    } catch { warning = 'Browser storage is unavailable or full. Changes are kept for this session only and may be lost on reload.'; }
  }
  function load(): DashboardData {
    if (data) return data;
    try {
      const storage = getStorage();
      if (!storage) throw new Error('Unavailable storage');
      const raw = storage.getItem(STORAGE_KEY);
      data = decodeStoredData(raw);
      if (!data) {
        data = structuredClone(fixtures); save();
        if (raw !== null && warning === null) warning = 'Saved demo data was invalid. The original sample data has been restored.';
      }
    } catch { data = structuredClone(fixtures); warning = 'Browser storage is unavailable. Changes are kept for this session only and may be lost on reload.'; }
    return data;
  }
  return {
    read() { const value = structuredClone(load()); value.invoices = value.invoices.map(i => ({ ...i, status: invoiceStatus(i) })); return value; },
    createInvoice(draft: InvoiceDraft) {
      const result = validateInvoice(draft);
      if (!result.valid || result.amountKobo === null || !isDate(draft.dueDate)) throw new Error('Please correct the invoice fields.');
      const current = load();
      if (!Number.isSafeInteger(current.invoices.reduce((sum, i) => sum + i.amountKobo, 0) + result.amountKobo))
        throw new Error("The invoice would exceed the safe reporting total. Reduce its quantities or prices.");
      let next = 1;
      while (current.invoices.some(i => i.id === `inv_${String(next).padStart(4, '0')}` || i.number === `INV-${String(next).padStart(4, '0')}`)) next++;
      const invoice: Invoice = {
        id: `inv_${String(next).padStart(4, '0')}`, number: `INV-${String(next).padStart(4, '0')}`,
        customer: draft.customer.trim(), email: draft.email.trim(), currency: 'NGN', amountKobo: result.amountKobo,
        status: 'unpaid', dueAt: `${draft.dueDate}T23:59:59.999+01:00`, items: result.items,
        notes: draft.notes.trim(), createdAt: DEMO_AS_OF,
      };
      current.invoices.unshift(invoice); save(); notify();
      return { ...invoice, status: invoiceStatus(invoice) };
    },
    reset() { data = structuredClone(fixtures); save(); notify(); },
    invalidate() { data = null; notify(); },
    getWarning: () => warning,
    getRevision: () => revision,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
export const demoRepository = createRepository(() => typeof window === 'undefined' ? null : window.localStorage);
export type DemoRepository = ReturnType<typeof createRepository>;
