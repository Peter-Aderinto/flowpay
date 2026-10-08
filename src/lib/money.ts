import type { LineItem } from './types';

// String arithmetic first: never multiply a floating-point decimal price.
export function parsePrice(input: string): number | null {
  const value = input.trim();
  if (!/^\d{1,14}(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const kobo = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(kobo) && kobo > 0 ? kobo : null;
}
export function lineTotal(item: LineItem): number | null {
  const total = item.quantity * item.unitPriceKobo;
  return Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
    Number.isSafeInteger(item.unitPriceKobo) && item.unitPriceKobo > 0 &&
    Number.isSafeInteger(total) ? total : null;
}
export function invoiceTotal(items: LineItem[]): number | null {
  if (!items.length) return null;
  let total = 0;
  for (const item of items) {
    const amount = lineTotal(item);
    if (amount === null || !Number.isSafeInteger(total + amount)) return null;
    total += amount;
  }
  return total;
}
