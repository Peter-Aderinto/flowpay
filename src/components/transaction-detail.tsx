'use client';
import { useCallback, useState } from 'react';
import { Copy } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import type { MockApi } from '@/lib/mock-api';
import { formatNGN, formatTimestamp } from '@/lib/format';
import { Dialog } from './dialog';
import { StatusBadge } from './status-badge';
import { useDemoResource } from './use-demo-resource';
import { InvoicePreview } from './invoice-preview';
import { RequestError } from './request-states';
function LinkedInvoice({ id }: { id: string }) {
  const loader = useCallback((api: MockApi, _scenario: string, signal: AbortSignal) => api.getInvoice(id, signal), [id]);
  const { state, retry } = useDemoResource(`invoice:${id}`, loader);
  return state.status === 'loading' ? <p role="status">Loading linked invoice…</p> : state.status === 'error' ? <RequestError message={state.message} retry={retry} /> : state.data ? <InvoicePreview invoice={state.data} /> : <p>Linked invoice is unavailable.</p>;
}
export function TransactionDetail({ transaction: t, onClose }: { transaction: Transaction; onClose: () => void }) {
  const [copy, setCopy] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  async function copyReference() {
    try { await navigator.clipboard.writeText(t.reference); setCopy('Reference copied.'); }
    catch { setCopy('Could not copy. Select and copy the reference manually.'); }
  }
  return <Dialog title="Transaction details" onClose={onClose}><div className="modal-body"><div className="detail-hero"><p>Payment amount</p><strong>{formatNGN(t.amountKobo)}</strong><StatusBadge status={t.status} /></div><dl className="detail-grid"><div><dt>Reference</dt><dd className="reference">{t.reference}</dd></div><div><dt>Customer</dt><dd>{t.customer}<small>{t.email}</small></dd></div><div><dt>Payment method</dt><dd>{t.method === 'card' ? 'Card' : 'Bank transfer'}</dd></div><div><dt>Timestamp · Lagos</dt><dd>{formatTimestamp(t.timestamp)}</dd></div><div><dt>Transaction ID</dt><dd>{t.id}</dd></div>{t.invoiceId && <div><dt>Linked invoice</dt><dd><button className="text-button" onClick={() => setShowInvoice(!showInvoice)} aria-expanded={showInvoice}>{showInvoice ? 'Hide invoice preview' : 'View linked invoice'}</button></dd></div>}</dl><button className="secondary-button" onClick={copyReference}><Copy size={15} aria-hidden="true" />Copy reference</button><p role="status" className="feedback">{copy}</p>{showInvoice && t.invoiceId && <LinkedInvoice id={t.invoiceId} />}</div></Dialog>;
}
