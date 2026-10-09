'use client';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction, TransactionQuery } from '@/lib/types';
import type { MockApi } from '@/lib/mock-api';
import { defaultTransactionQuery, PAGE_SIZE, parseTransactionQuery, transactionQueryString } from '@/lib/transaction-query';
import { formatDate, formatNGN } from '@/lib/format';
import { DEMO_AS_OF, DEMO_START } from '@/lib/demo';
import { DemoControls, PersistenceNotice } from './demo-controls';
import { useDemoResource } from './use-demo-resource';
import { EmptyState, ListSkeleton, RequestError } from './request-states';
import { StatusBadge } from './status-badge';
import { TransactionDetail } from './transaction-detail';
export function Transactions() {
  const params = useSearchParams();
  const raw = params.toString();
  const { query, ignored } = useMemo(() => parseTransactionQuery(new URLSearchParams(raw)), [raw]);
  const queryKey = transactionQueryString(query);
  const loader = useCallback((api: MockApi, scenario: Parameters<MockApi['getTransactions']>[1], signal: AbortSignal) => api.getTransactions(query, scenario, signal), [query]);
  const resource = useDemoResource(queryKey, loader);
  const [selected, setSelected] = useState<Transaction | null>(null);
  function update(patch: Partial<TransactionQuery>, keepPage = false) {
    // Read the latest URL so rapid edits to different controls cannot lose a filter.
    const current = parseTransactionQuery(new URLSearchParams(window.location.search)).query;
    const next = { ...current, ...patch, ...(!keepPage ? { page: 1 } : {}) };
    const search = transactionQueryString(next);
    window.history.pushState(null, '', `/transactions${search ? `?${search}` : ''}`);
  }
  const state = resource.state;
  return <>
    <div className="page-heading"><div><p className="eyebrow">PAYMENT ACTIVITY</p><h1>Transactions</h1><p>Find payments, explore details, and track every status.</p></div><span className="date-note">Demo as of {formatDate(DEMO_AS_OF)} 2026 · Lagos</span></div>
    <section className="card filter-card" aria-label="Transaction filters"><div className="filter-grid">
      <label className="search-field">Search transactions<div className="input-icon"><Search size={16} aria-hidden="true" /><input type="search" placeholder="Customer, email or reference" value={query.search} maxLength={200} onChange={e => update({ search: e.target.value })} /></div></label>
      <label>Status<select aria-label="Status" value={query.status} onChange={e => update({ status: e.target.value as TransactionQuery['status'] })}><option value="">All statuses</option><option value="successful">Successful</option><option value="pending">Pending</option><option value="failed">Failed</option></select></label>
      <label>Payment method<select aria-label="Payment method" value={query.method} onChange={e => update({ method: e.target.value as TransactionQuery['method'] })}><option value="">All methods</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option></select></label>
      <label>From date<input type="date" value={query.from} onChange={e => update({ from: e.target.value })} /></label>
      <label>To date<input type="date" value={query.to} onChange={e => update({ to: e.target.value })} /></label>
      <label>Sort by<select aria-label="Sort by" value={query.sort} onChange={e => update({ sort: e.target.value as TransactionQuery['sort'] })}><option value="date_desc">Date: newest first</option><option value="date_asc">Date: oldest first</option><option value="amount_desc">Amount: high to low</option><option value="amount_asc">Amount: low to high</option></select></label>
    </div><div className="filter-footer"><p>Dates include the full Lagos day. Sample period: {formatDate(DEMO_START)} – {formatDate(DEMO_AS_OF)} 2026.</p><button className="text-button" onClick={() => update(defaultTransactionQuery)}>Clear filters</button></div></section>
    {ignored && <p role="status" className="warning-banner">Invalid URL filter values were ignored. Choose valid filters above.</p>}
    <div className="sr-only" role="status">{state.status === 'loading' ? 'Loading transactions' : state.status === 'ready' ? `${state.data.total} matching transactions` : 'Request failed'}</div>
    {state.status === 'loading' ? <ListSkeleton /> : state.status === 'error' ? <RequestError message={state.message} retry={resource.retry} /> : state.data.total === 0 ? <EmptyState title={state.data.datasetCount === 0 ? 'No transactions available' : 'No matching transactions'}>{state.data.datasetCount === 0 ? 'This demo response has no transactions. Choose Normal in Demo controls to restore the view.' : 'Try another search or date range, or use Clear filters.'}</EmptyState> : <section className="card result-card" aria-label="Transaction results">
      <div className="results-heading"><h2>Payment history</h2><p>{state.data.total} {state.data.total === 1 ? 'result' : 'results'} · Showing {(state.data.page - 1) * PAGE_SIZE + 1}–{Math.min(state.data.page * PAGE_SIZE, state.data.total)}</p></div>
      <div className="desktop-table table-scroll" tabIndex={0} role="region" aria-label="Transaction results table"><table><caption className="sr-only">Filtered payment history, sorted and paginated</caption><thead><tr><th scope="col">Customer / reference</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Method</th><th scope="col">Date</th><th scope="col">Details</th></tr></thead><tbody>{state.data.items.map(t => <tr key={t.id}><td><strong>{t.customer}</strong><small>{t.reference}</small></td><td className="amount-cell">{formatNGN(t.amountKobo)}</td><td><StatusBadge status={t.status} /></td><td>{t.method === 'card' ? 'Card' : 'Bank transfer'}</td><td>{formatDate(t.timestamp)}</td><td><button className="text-button" aria-label={`View transaction ${t.reference}`} onClick={() => setSelected(t)}>View</button></td></tr>)}</tbody></table></div>
      <ul className="mobile-records">{state.data.items.map(t => <li key={t.id}><div className="record-top"><strong>{t.customer}</strong><span className="amount-cell">{formatNGN(t.amountKobo)}</span></div><p>{t.reference}</p><div className="record-meta"><StatusBadge status={t.status} /><span>{t.method === 'card' ? 'Card' : 'Bank transfer'} · {formatDate(t.timestamp)}</span></div><button className="text-button" aria-label={`View transaction ${t.reference}`} onClick={() => setSelected(t)}>View details →</button></li>)}</ul>
      <nav aria-label="Transaction pagination" className="pagination"><span>Page {state.data.page} of {state.data.pageCount}</span><div><button className="secondary-button" disabled={state.data.page === 1} onClick={() => update({ page: state.data.page - 1 }, true)}><ChevronLeft size={15} aria-hidden="true" />Previous</button><button className="secondary-button" disabled={state.data.page === state.data.pageCount} onClick={() => update({ page: state.data.page + 1 }, true)}>Next<ChevronRight size={15} aria-hidden="true" /></button></div></nav>
    </section>}
    <PersistenceNotice warning={resource.warning} />
    <DemoControls api={resource.api} scenario={resource.scenario} onScenario={resource.changeScenario} />
    {selected && <TransactionDetail transaction={selected} onClose={() => setSelected(null)} />}
  </>;
}
