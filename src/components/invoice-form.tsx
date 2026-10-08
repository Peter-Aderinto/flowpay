'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Invoice, InvoiceDraft } from '@/lib/types';
import type { MockApi } from '@/lib/mock-api';
import { validateInvoice } from '@/lib/invoices';
import { lineTotal } from '@/lib/money';
import { formatNGN } from '@/lib/format';
import { Dialog } from './dialog';
const initialDraft: InvoiceDraft = { customer: '', email: '', dueDate: '2026-10-15', items: [{ description: '', quantity: '1', unitPrice: '' }], notes: '' };
export function InvoiceForm({ api, onClose, onCreated }: { api: MockApi; onClose: () => void; onCreated: (invoice: Invoice) => void }) {
  const [draft, setDraft] = useState<InvoiceDraft>(() => structuredClone(initialDraft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const locked = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const id = useId();
  const calculated = validateInvoice(draft);
  useEffect(() => () => controller.current?.abort(), []);
  const errorId = (name: string) => `${id}-${name}-error`;
  const attrs = (name: string) => ({ name, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? errorId(name) : undefined });
  const error = (name: string) => errors[name] && <span id={errorId(name)} className="field-error">{errors[name]}</span>;
  function editItem(index: number, key: keyof InvoiceDraft['items'][number], value: string) {
    setDraft(d => ({ ...d, items: d.items.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    const validation = validateInvoice(draft);
    setErrors(validation.errors); setFailure('');
    if (!validation.valid) {
      const first = Object.keys(validation.errors)[0];
      requestAnimationFrame(() => { const field = form.current?.querySelector<HTMLElement>(`[name="${first}"]`) ?? form.current?.querySelector<HTMLElement>('[aria-invalid=true]'); field?.focus(); });
      return;
    }
    locked.current = true; setPending(true);
    controller.current = new AbortController();
    try { const invoice = await api.createInvoice(draft, controller.current.signal); onCreated(invoice); }
    catch (e: unknown) { if (!controller.current.signal.aborted) setFailure(e instanceof Error ? e.message : 'Could not create invoice. Try again.'); }
    finally { locked.current = false; setPending(false); }
  }
  return <Dialog title="Create invoice" onClose={onClose} wide><form ref={form} onSubmit={submit} className="invoice-form" noValidate>
    <p className="form-intro">Use fictional customer details. Status uses the fixed demo date, <strong>8 October 2026 · Lagos</strong>. Earlier due dates become overdue; no payment is simulated.</p>
    {Object.keys(errors).length > 0 && <p role="alert" className="warning-banner">Please correct the highlighted fields.</p>}{failure && <p role="alert" className="warning-banner">{failure}</p>}
    <fieldset disabled={pending}><legend className="sr-only">Invoice information</legend><div className="form-grid"><label>Customer name<input {...attrs('customer')} value={draft.customer} maxLength={100} autoComplete="off" onChange={e => setDraft({ ...draft, customer: e.target.value })} />{error('customer')}</label><label>Customer email<input {...attrs('email')} type="email" value={draft.email} maxLength={254} placeholder="customer@example.com" autoComplete="off" onChange={e => setDraft({ ...draft, email: e.target.value })} />{error('email')}</label><label>Due date<input {...attrs('dueDate')} type="date" value={draft.dueDate} min="2000-01-01" max="2100-12-31" onChange={e => setDraft({ ...draft, dueDate: e.target.value })} />{error('dueDate')}</label></div>
    <div className="line-items-heading"><h3>Line items</h3><span>Prices in NGN</span></div>{error('items')}
    {draft.items.map((item, index) => {
      const total = lineTotal(calculated.items[index]);
      return <div className="line-item" key={index}><label>Description<input {...attrs(`items.${index}.description`)} aria-label={`Item ${index + 1} description`} value={item.description} maxLength={200} onChange={e => editItem(index, 'description', e.target.value)} />{error(`items.${index}.description`)}</label><label>Quantity<input {...attrs(`items.${index}.quantity`)} aria-label={`Item ${index + 1} quantity`} inputMode="numeric" value={item.quantity} onChange={e => editItem(index, 'quantity', e.target.value)} />{error(`items.${index}.quantity`)}</label><label>Unit price<input {...attrs(`items.${index}.unitPrice`)} aria-label={`Item ${index + 1} unit price`} inputMode="decimal" placeholder="0.00" value={item.unitPrice} onChange={e => editItem(index, 'unitPrice', e.target.value)} />{error(`items.${index}.unitPrice`)}</label><div className="line-amount"><span>Line total</span><strong>{total === null ? '—' : formatNGN(total)}</strong></div><button type="button" className="icon-button remove-item" aria-label={`Remove item ${index + 1}`} disabled={draft.items.length === 1} onClick={() => { setDraft({ ...draft, items: draft.items.filter((_, i) => i !== index) }); setErrors({}); }}><Trash2 size={17} aria-hidden="true" /></button></div>;
    })}
    <button type="button" className="secondary-button" disabled={draft.items.length >= 50} onClick={() => setDraft({ ...draft, items: [...draft.items, { description: '', quantity: '1', unitPrice: '' }] })}><Plus size={15} aria-hidden="true" />Add line item</button>
    <div className="form-total"><span>Invoice total</span><strong>{calculated.amountKobo === null ? 'Enter valid line items' : formatNGN(calculated.amountKobo)}</strong></div>
    <label>Notes <span className="optional">(optional)</span><textarea {...attrs('notes')} value={draft.notes} maxLength={2000} rows={3} onChange={e => setDraft({ ...draft, notes: e.target.value })} />{error('notes')}</label>
    </fieldset><div className="form-actions"><p role="status">{pending ? 'Saving invoice…' : 'Saved only in this browser.'}</p><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={pending}>{pending ? 'Creating…' : 'Create invoice'}</button></div>
  </form></Dialog>;
}
