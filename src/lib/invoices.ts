import { DEMO_AS_OF } from './demo';
import { invoiceTotal, parsePrice } from './money';
import type { Invoice, InvoiceDraft, LineItem } from './types';

export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2100-12-31') return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function invoiceStatus(invoice: Invoice): Invoice['status'] {
  if (invoice.status === 'paid') return 'paid';
  return Date.parse(invoice.dueAt) < Date.parse(DEMO_AS_OF) ? 'overdue' : 'unpaid';
}
export function validateInvoice(draft: InvoiceDraft) {
  const errors: Record<string, string> = {};
  if (!draft.customer.trim() || draft.customer.trim().length > 100) errors.customer = 'Enter a customer name (1–100 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) || draft.email.length > 254) errors.email = 'Enter a valid customer email address.';
  if (!isDate(draft.dueDate)) errors.dueDate = 'Choose a valid due date between 2000 and 2100.';
  if (draft.notes.length > 2000) errors.notes = 'Keep notes within 2,000 characters.';
  if (!draft.items.length || draft.items.length > 50) errors.items = 'Include between 1 and 50 line items.';
  const items: LineItem[] = draft.items.map((item, index) => {
    if (!item.description.trim() || item.description.trim().length > 200) errors[`items.${index}.description`] = 'Enter a description (1–200 characters).';
    const quantity = /^\d+$/.test(item.quantity) ? Number(item.quantity) : 0;
    if (!Number.isSafeInteger(quantity) || quantity < 1) errors[`items.${index}.quantity`] = 'Use a positive whole-number quantity.';
    const price = parsePrice(item.unitPrice);
    if (price === null) errors[`items.${index}.unitPrice`] = 'Enter a positive price with at most 2 decimal places.';
    return { description: item.description.trim(), quantity, unitPriceKobo: price ?? 0 };
  });
  const amountKobo = invoiceTotal(items);
  if (Object.keys(errors).length === 0 && amountKobo === null) errors.items = 'The total is too large. Reduce the quantities or prices.';
  return { errors, items, amountKobo, valid: Object.keys(errors).length === 0 && amountKobo !== null };
}
