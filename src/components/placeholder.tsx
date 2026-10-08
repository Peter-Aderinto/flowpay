import Link from 'next/link';
import { ArrowLeftRight, ReceiptText } from 'lucide-react';
export function Placeholder({ kind }: { kind: 'transactions' | 'invoices' }) {
  const invoices = kind === 'invoices';
  const Icon = invoices ? ReceiptText : ArrowLeftRight;
  return <><div className="page-heading"><div><p className="eyebrow">YOUR BUSINESS AT A GLANCE</p><h1>{invoices ? 'Invoices' : 'Transactions'}</h1><p>{invoices ? 'A clearer view of what you’re owed.' : 'Every payment, in one place.'}</p></div></div>
    <section className="card placeholder"><span className="placeholder-icon"><Icon size={28} aria-hidden="true" /></span><span className="small-tag">Coming next</span><h2>{invoices ? 'Invoice management' : 'Your transaction workspace'}</h2><p>{invoices ? 'A future phase will add invoice lists, due dates, customer details, and paid, unpaid, and overdue views. Invoice creation and payment simulation are not available yet.' : 'A future phase will add a complete transaction list, search, filters, and payment details. For now, explore the five most recent payments in the overview.'}</p><Link className="text-link" href="/dashboard">Back to overview →</Link></section>
  </>;
}
