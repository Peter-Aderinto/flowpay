'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, CircleCheck, Clock3, ReceiptText, AlertCircle, RotateCcw, Inbox } from 'lucide-react';
import { createMockApi } from '@/lib/mock-api';
import { periodBounds, summarize } from '@/lib/analytics';
import { DEMO_AS_OF } from '@/lib/demo';
import { formatDate, formatNGN } from '@/lib/format';
import type { DashboardData, Period, Scenario } from '@/lib/types';
import { CollectionChart } from './collection-chart';
import { TransactionList } from './transaction-list';
type RequestState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: DashboardData };
export function Dashboard() {
  const [days, setDays] = useState<Period>(30);
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RequestState>({ status: 'loading' });
  const [api] = useState(() => createMockApi());
  const latest = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++latest.current;
    api.getDashboard(scenario, controller.signal).then(data => {
      if (!controller.signal.aborted && latest.current === requestId) setState({ status: 'ready', data });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && latest.current === requestId) setState({ status: 'error', message: error instanceof Error ? error.message : 'Unable to load demo data.' });
    });
    return () => controller.abort();
  }, [api, days, scenario, attempt]);
  function changePeriod(value: Period) { if (value !== days) { setState({ status: 'loading' }); setDays(value); } }
  function changeScenario(value: Scenario) {
    if (value === 'error') api.failNextRequest();
    setState({ status: 'loading' }); setScenario(value); setAttempt(a => a + 1);
  }
  const bounds = periodBounds(days);
  const summary = state.status === 'ready' ? summarize(state.data, days) : null;
  const cards = summary ? [
    { title: 'Total collected', value: formatNGN(summary.collected), note: 'Successful payments only', icon: ArrowDownLeft },
    { title: 'Successful payments', value: summary.successful.toLocaleString('en-NG'), note: 'Completed in this period', icon: CircleCheck },
    { title: 'Pending payments', value: formatNGN(summary.pending), note: 'Awaiting confirmation', icon: Clock3 },
    { title: 'Outstanding invoices', value: formatNGN(summary.outstanding), note: 'All time · Includes overdue', icon: ReceiptText },
  ] : [];
  return <>
    <div className="page-heading"><div><p className="eyebrow">OLIVE & STITCH · DEMO MERCHANT</p><h1>Business overview</h1><p>A clear picture of your payments and collections.</p></div><div className="period-control"><fieldset><legend className="sr-only">Reporting period</legend><div className="period-buttons">{([7, 30, 90] as const).map(value => <button key={value} aria-pressed={days === value} onClick={() => changePeriod(value)}>{value} days</button>)}</div></fieldset><p>Demo as of {formatDate(DEMO_AS_OF)} 2026 · Lagos</p></div></div>
    <p className="reporting-label">Reporting period: <strong>{formatDate(new Date(bounds.start).toISOString())} – {formatDate(DEMO_AS_OF)} 2026</strong> <span>· Africa/Lagos</span></p>
    <div aria-live="polite" aria-atomic="true" className="sr-only">{state.status === 'loading' ? `Loading ${days}-day overview` : state.status === 'error' ? 'Dashboard request failed' : `${days}-day overview loaded`}</div>
    {state.status === 'loading' ? <div aria-busy="true" aria-label="Loading dashboard"><div className="stats-grid">{[1, 2, 3, 4].map(i => <div className="card skeleton-card" key={i}><div className="skeleton sk-label" /><div className="skeleton sk-value" /><div className="skeleton sk-note" /></div>)}</div><div className="card skeleton-chart"><div className="skeleton sk-label" /><div className="skeleton sk-plot" /></div><div className="card skeleton-table">{[1, 2, 3, 4, 5].map(i => <div className="skeleton sk-row" key={i} />)}</div></div> : state.status === 'error' ? <section role="alert" className="card error-state"><AlertCircle size={30} aria-hidden="true" /><h2>Let’s try that again</h2><p>{state.message}</p><button className="primary-button" onClick={() => { setState({ status: 'loading' }); setAttempt(a => a + 1); }}><RotateCcw size={16} aria-hidden="true" />Retry</button></section> : summary && <>
      <div className="stats-grid">{cards.map(({ title, value, note, icon: Icon }) => <section className="card stat-card" key={title}><div className="stat-heading"><h2>{title}</h2><span className="stat-icon"><Icon size={18} aria-hidden="true" /></span></div><p className="stat-value">{value}</p><p className="stat-note">{note}</p></section>)}</div>
      {summary.transactions.length === 0 ? <section className="card empty-state"><Inbox size={30} aria-hidden="true" /><h2>No payments to show</h2><p>This demo response contains no transactions. Select Normal in Demo controls to restore the sample dashboard.</p></section> : <CollectionChart transactions={state.data.transactions} days={days} />}
      <TransactionList transactions={summary.recent} />
    </>}
    <details className="demo-controls"><summary>Demo controls</summary><p>Simulate the promise-based mock API. No real network requests are made. Error fails the next request once; Retry then recovers.</p><label htmlFor="scenario">API response</label><select id="scenario" value={scenario} onChange={e => changeScenario(e.target.value as Scenario)}><option value="normal">Normal</option><option value="empty">Empty</option><option value="error">Error (once)</option></select></details>
  </>;
}
