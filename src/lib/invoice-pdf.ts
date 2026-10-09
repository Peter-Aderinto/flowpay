import { jsPDF } from 'jspdf';
import { DEMO_AS_OF } from './demo';
import { formatFullDate, formatNGN } from './format';
import { invoiceStatus } from './invoices';
import { invoiceTotal, lineTotal } from './money';
import type { Invoice } from './types';

export const PDF_FOOTER = 'Demo invoice — fictional data. No real money movement.';
export function invoicePdfFilename(invoice: Pick<Invoice, 'number' | 'id'>): string {
  const identifier = (invoice.number || invoice.id).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'demo';
  return `FlowPay-Invoice-${identifier}.pdf`;
}
let fontRequest: Promise<string> | null = null;
async function loadFont(): Promise<string> {
  if (!fontRequest) {
    fontRequest = fetch('/fonts/DejaVuSans.ttf').then(async response => {
      if (!response.ok) throw new Error('Could not load the invoice font. Please try again.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
      return btoa(binary);
    }).catch(error => { fontRequest = null; throw error; });
  }
  return fontRequest;
}

// Pure layout function also used by tests. No invoice or repository writes occur here.
export function createInvoicePdf(invoice: Invoice, fontBase64: string): ArrayBuffer {
  if (!Number.isSafeInteger(invoice.amountKobo) || invoice.amountKobo <= 0) throw new Error('This invoice has an invalid total.');
  const items = invoice.items ?? [];
  if (items.length && invoiceTotal(items) !== invoice.amountKobo) throw new Error('Invoice line items do not match the saved total.');
  const doc = new jsPDF({ format: 'a4', unit: 'mm', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('DejaVuSans.ttf', fontBase64);
  doc.addFont('DejaVuSans.ttf', 'InvoiceFont', 'normal');
  doc.setFont('InvoiceFont', 'normal');
  doc.setProperties({ title: `Invoice ${invoice.number ?? invoice.id}`, author: 'FlowPay · Olive & Stitch', subject: 'Fictional demo invoice' });
  const margin = 18;
  const width = 174;
  const bottom = 269;
  const lineHeight = 4.8;
  let y = 0;
  const status = invoiceStatus(invoice);
  const green: [number, number, number] = [6, 78, 59];
  const ink: [number, number, number] = [29, 48, 38];
  const muted: [number, number, number] = [77, 98, 86];
  function text(value: string, x: number, top: number, size = 10, color = ink, align: 'left' | 'right' = 'left') {
    doc.setFontSize(size); doc.setTextColor(...color); doc.text(value, x, top, { align });
  }
  function wrap(value: string, available: number, size = 10): string[] {
    doc.setFontSize(size);
    return doc.splitTextToSize(value.replace(/\r\n?/g, '\n').replace(/\t/g, '    '), available) as string[];
  }
  function header(continuation = false) {
    doc.setFillColor(...green); doc.rect(0, 0, 210, 4, 'F');
    text('FlowPay', margin, 19, 19, green);
    text('Olive & Stitch', margin, 26, 10, muted);
    text('Invoice', 192, 20, 19, ink, 'right');
    y = 38;
    for (const line of wrap(invoice.number ?? invoice.id, width, 11)) { text(line, margin, y, 11); y += lineHeight; }
    if (continuation) { text('Continued', margin, y + 2, 9, muted); y += 8; }
    else y += 4;
  }
  function nextPage(table = false) {
    doc.addPage(); header(true); if (table) tableHeading();
  }
  function block(value: string, size = 10, color = ink) {
    for (const line of wrap(value, width, size)) {
      if (y + lineHeight > bottom) nextPage();
      text(line, margin, y, size, color); y += lineHeight;
    }
  }
  // Variable-width cells are independently wrapped, including very large monetary values.
  const columns = [18, 96, 111, 151];
  const cellWidths = [74, 11, 36, 37];
  function tableHeading() {
    doc.setFillColor(237, 244, 239); doc.rect(margin, y - 4, width, 9, 'F');
    text('Description', columns[0] + 2, y + 1, 9, green);
    text('Qty', columns[1] + 2, y + 1, 9, green);
    text('Unit price', 149, y + 1, 9, green, 'right');
    text('Line total', 190, y + 1, 9, green, 'right');
    y += 12;
  }
  header();
  block(`Status: ${status.toUpperCase()}`, 11, status === 'paid' ? green : [138, 62, 29]);
  block(`Status as of ${formatFullDate(DEMO_AS_OF)} · Africa/Lagos`, 9, muted);
  y += 6;
  block('Bill to', 9, muted);
  block(invoice.customer, 11);
  if (invoice.email) block(invoice.email);
  y += 5;
  if (invoice.createdAt) block(`Issue date: ${formatFullDate(invoice.createdAt)}`);
  block(`Due date: ${formatFullDate(invoice.dueAt)} · Lagos`);
  block('Currency: NGN', 9, muted);
  y += 9;
  if (y + 20 > bottom) nextPage();
  tableHeading();
  if (!items.length) { block('No line items stored for this invoice.', 10, muted); y += 5; }
  for (const item of items) {
    const amount = lineTotal(item);
    if (amount === null) throw new Error('This invoice has an invalid line total.');
    const cells = [item.description, String(item.quantity), formatNGN(item.unitPriceKobo), formatNGN(amount)].map((value, i) => wrap(value, cellWidths[i], 9));
    const rows = Math.max(...cells.map(lines => lines.length));
    // Keep ordinary rows together. A row larger than a page continues with repeated headings.
    if (y + rows * lineHeight + 5 > bottom && rows * lineHeight + 5 <= 200) nextPage(true);
    for (let row = 0; row < rows; row++) {
      if (y + lineHeight + 4 > bottom) nextPage(true);
      for (let column = 0; column < cells.length; column++) {
        const line = cells[column][row];
        if (line) text(line, column < 2 ? columns[column] + 2 : column === 2 ? 149 : 190, y, 9, ink, column < 2 ? 'left' : 'right');
      }
      y += lineHeight;
    }
    y += 3;
    doc.setDrawColor(224, 233, 227); doc.line(margin, y - 1, 192, y - 1); y += 4;
  }
  // Total is one indivisible block; wrap even the largest safe monetary amount.
  const totalLines = wrap(formatNGN(invoice.amountKobo), 106, 16);
  const totalHeight = totalLines.length * 7 + 13;
  if (y + totalHeight > bottom) nextPage();
  doc.setFillColor(239, 246, 242); doc.rect(margin, y - 3, width, totalHeight, 'F');
  text('Invoice total · NGN', margin + 4, y + 7, 10, green);
  totalLines.forEach((line, index) => text(line, 188, y + 7 + index * 7, 16, green, 'right'));
  y += totalHeight + 8;
  if (invoice.notes) {
    if (y + 14 > bottom) nextPage();
    block('Notes', 11, green); y += 2; block(invoice.notes, 10, muted);
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setDrawColor(224, 233, 227); doc.line(margin, 278, 192, 278);
    text(PDF_FOOTER, margin, 285, 8, muted);
    text(`Page ${page} of ${pages}`, 192, 291, 8, muted, 'right');
  }
  return doc.output('arraybuffer');
}
export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  const bytes = createInvoicePdf(invoice, await loadFont());
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url; link.download = invoicePdfFilename(invoice);
  try { document.body.appendChild(link); link.click(); }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60_000); }
}
