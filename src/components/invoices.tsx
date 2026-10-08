'use client';
import { useCallback, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Invoice, InvoiceQuery } from '@/lib/types';
import type { MockApi } from '@/lib/mock-api';
import { formatFullDate, formatNGN } from '@/lib/format';
import { DemoControls, PersistenceNotice } from './demo-controls';
import { Dialog } from './dialog';
import { InvoiceForm } from './invoice-form';
import { InvoicePreview } from './invoice-preview';
import { StatusBadge } from './status-badge';
import { useDemoResource } from './use-demo-resource';
import { EmptyState, ListSkeleton, RequestError } from './request-states';
export function Invoices() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceQuery['status']>('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [message, setMessage] = useState('');
  const query = useMemo(() => ({ search, status }), [search, status]);
  const loader = useCallback((api: MockApi, scenario: Parameters<MockApi['getInvoices']>[1], signal: AbortSignal) => api.getInvoices(query, scenario, signal), [query]);
  const resource = useDemoResource(JSON.stringify(query), loader);
  const state = resource.state;
  return <>
    <div className="page-heading"><div><p className="eyebrow">CUSTOMER INVOICES</p><h1>Invoices</h1><p>Keep track of what’s paid, due, and overdue.</p></div><button className="primary-button" onClick={() => setCreating(true)}><Plus size={17} aria-hidden="true" />Create invoice</button></div>
    <p className="reporting-label">Status as of <strong>8 October 2026 · Africa/Lagos</strong>. No real payment is requested.</p>
    <section className="card filter-card" aria-label="Invoice filters"><div className="invoice-filters"><label className="search-field">Search invoices<div className="input-icon"><Search size={16} aria-hidden="true" /><input type="search" value={search} maxLength={200} placeholder="Invoice, customer or email" onChange={e => setSearch(e.target.value)} /></div></label><label>Status<select aria-label="Status" value={status} onChange={e => setStatus(e.target.value as InvoiceQuery['status'])}><option value="">All statuses</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="overdue">Overdue</option></select></label><button className="text-button" onClick={() => { setSearch(''); setStatus(''); }}>Clear filters</button></div></section>
    <p role="status" className="feedback">{message}</p>
    {state.status === 'loading' ? <ListSkeleton /> : state.status === 'error' ? <RequestError message={state.message} retry={resource.retry} /> : state.data.items.length === 0 ? <EmptyState title={state.data.datasetCount === 0 ? 'No invoices available' : 'No matching invoices'}>{state.data.datasetCount === 0 ? 'Create a fictional invoice, or select Normal in Demo controls to view the sample data.' : 'Try another search or status, or clear your filters.'}</EmptyState> : <section className="card result-card" aria-label="Invoice results"><div className="results-heading"><h2>All invoices</h2><p>{state.data.items.length} {state.data.items.length === 1 ? 'invoice' : 'invoices'}</p></div><div className="desktop-table table-scroll" tabIndex={0} role="region" aria-label="Invoices table"><table><caption className="sr-only">Invoices, including paid, unpaid, and overdue statuses</caption><thead><tr><th scope="col">Invoice / customer</th><th scope="col">Total</th><th scope="col">Due date</th><th scope="col">Status</th><th scope="col">Preview</th></tr></thead><tbody>{state.data.items.map(invoice => <tr key={invoice.id}><td><strong>{invoice.number ?? invoice.id}</strong><small>{invoice.customer}</small></td><td className="amount-cell">{formatNGN(invoice.amountKobo)}</td><td>{formatFullDate(invoice.dueAt)}</td><td><StatusBadge status={invoice.status} /></td><td><button className="text-button" aria-label={`Preview invoice ${invoice.number ?? invoice.id}`} onClick={() => setSelected(invoice)}>Preview</button></td></tr>)}</tbody></table></div><ul className="mobile-records">{state.data.items.map(invoice => <li key={invoice.id}><div className="record-top"><strong>{invoice.number ?? invoice.id}</strong><span className="amount-cell">{formatNGN(invoice.amountKobo)}</span></div><p>{invoice.customer}</p><div className="record-meta"><StatusBadge status={invoice.status} /><span>Due {formatFullDate(invoice.dueAt)}</span></div><button className="text-button" aria-label={`Preview invoice ${invoice.number ?? invoice.id}`} onClick={() => setSelected(invoice)}>Preview invoice →</button></li>)}</ul></section>}
    <PersistenceNotice warning={resource.warning} /><DemoControls api={resource.api} scenario={resource.scenario} onScenario={resource.changeScenario} />
    {creating && <InvoiceForm api={resource.api} onClose={() => setCreating(false)} onCreated={invoice => { setCreating(false); setSelected(invoice); setSearch(''); setStatus(''); resource.changeScenario('normal'); setMessage(`${invoice.number} created. ${resource.api.getPersistenceWarning() ? 'Saved for this session only.' : 'Saved in this browser.'}`); }} />}
    {selected && <Dialog title="Invoice preview" onClose={() => setSelected(null)} wide><div className="modal-body"><InvoicePreview invoice={selected} /></div></Dialog>}
  </>;
}
