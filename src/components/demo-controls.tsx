'use client';
import { useId, useRef, useState } from 'react';
import type { MockApi } from '@/lib/mock-api';
import type { Scenario } from '@/lib/types';
export function PersistenceNotice({ warning }: { warning: string | null }) {
  return <div className="persistence-notice"><p>Invoices are saved only in this browser. All customer details should be fictional.</p>{warning && <p className="warning-banner" role="status">{warning}</p>}</div>;
}
export function DemoControls({ api, scenario, onScenario }: { api: MockApi; scenario: Scenario; onScenario: (value: Scenario) => void }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const locked = useRef(false);
  async function reset() {
    if (locked.current || !window.confirm('Reset demo data? This will remove all invoices created in this browser and restore the original sample data.')) return;
    locked.current = true; setBusy(true); setMessage('');
    try { await api.resetDemoData(); onScenario('normal'); setMessage('Original demo data restored.'); }
    catch { setMessage('Reset failed. Please try again.'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <details className="demo-controls"><summary>Demo controls</summary><p>Simulate the promise-based mock API. No real network requests are made. Error fails the next request once; Retry recovers. Empty and Error do not change saved data.</p><div className="demo-actions"><label htmlFor={id}>API response</label><select id={id} value={scenario} disabled={busy} onChange={e => onScenario(e.target.value as Scenario)}><option value="normal">Normal</option><option value="empty">Empty</option><option value="error">Error (once)</option></select><button className="secondary-button" disabled={busy} onClick={reset}>{busy ? 'Resetting…' : 'Reset demo data'}</button></div><p role="status">{message}</p></details>;
}
