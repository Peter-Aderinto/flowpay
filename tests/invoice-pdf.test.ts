import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createInvoicePdf, invoicePdfFilename } from '../src/lib/invoice-pdf';
import { fixtures } from '../src/lib/fixtures';
import { invoiceTotal } from '../src/lib/money';
const font = readFileSync('public/fonts/DejaVuSans.ttf').toString('base64');
test('PDF filenames prevent paths and unsafe characters', () => {
  assert.equal(invoicePdfFilename({ id: 'inv_0001', number: 'INV-0001' }), 'FlowPay-Invoice-INV-0001.pdf');
  assert.equal(invoicePdfFilename({ id: 'fallback', number: '../../unsafe / invoice' }), 'FlowPay-Invoice-unsafe-invoice.pdf');
  assert.equal(invoicePdfFilename({ id: 'fallback', number: '///' }), 'FlowPay-Invoice-demo.pdf');
});
test('seed PDF is A4 with an embedded Unicode font and leaves the invoice untouched', () => {
  const invoice = structuredClone(fixtures.invoices[0]);
  const before = JSON.stringify(invoice);
  const bytes = Buffer.from(createInvoicePdf(invoice, font));
  assert.ok(bytes.subarray(0, 8).toString().startsWith('%PDF-1.'));
  const pdf = bytes.toString('latin1');
  const dimensions = /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf);
  assert.ok(dimensions);
  assert.ok(Math.abs(Number(dimensions[1]) - 595.28) < 0.01);
  assert.ok(Math.abs(Number(dimensions[2]) - 841.89) < 0.01);
  assert.match(pdf, /\/FontFile2/);
  assert.match(pdf, /\/ToUnicode/);
  assert.equal(JSON.stringify(invoice), before);
});
test('long invoices paginate while preserving their source data and rejecting mismatched totals', () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ description: `Item ${i + 1}: ${'Long merchandise description '.repeat(6)}`, quantity: i + 1, unitPriceKobo: 12555 }));
  const invoice = { ...fixtures.invoices[3], items, amountKobo: invoiceTotal(items)!, notes: 'Long optional note. '.repeat(100) };
  const before = JSON.stringify(invoice);
  const pdf = Buffer.from(createInvoicePdf(invoice, font)).toString('latin1');
  assert.ok((pdf.match(/\/Type \/Page\b/g) ?? []).length >= 3);
  assert.equal(JSON.stringify(invoice), before);
  assert.throws(() => createInvoicePdf({ ...invoice, amountKobo: invoice.amountKobo + 1 }, font), /do not match/);
});
test('legacy invoice without stored line items or issue date still produces a PDF', () => {
  const invoice = { ...fixtures.invoices[3], items: undefined, createdAt: undefined, notes: undefined };
  assert.ok(createInvoicePdf(invoice, font).byteLength > 1000);
});
