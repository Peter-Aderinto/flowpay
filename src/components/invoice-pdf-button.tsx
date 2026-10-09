'use client';
import { useId, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { Invoice } from '@/lib/types';
export function InvoicePdfButton({ invoice }: { invoice: Invoice }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const locked = useRef(false);
  const feedbackId = useId();
  async function download() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setMessage('');
    try {
      const { downloadInvoicePdf } = await import('@/lib/invoice-pdf');
      await downloadInvoicePdf(invoice);
      setMessage('PDF generated. Download started.');
    } catch {
      setMessage('Could not generate the PDF. Please try Download PDF again.');
    } finally { locked.current = false; setBusy(false); }
  }
  return <div className="invoice-pdf-actions"><button type="button" className="secondary-button" disabled={busy} aria-busy={busy} aria-describedby={feedbackId} onClick={download}><Download size={15} aria-hidden="true" />{busy ? 'Generating PDF…' : 'Download PDF'}</button><p id={feedbackId} role="status" aria-live="polite" className="feedback">{message}</p></div>;
}
