import { AlertCircle, Inbox } from 'lucide-react';
export function ListSkeleton() {
  return <div className="card skeleton-table" aria-busy="true" aria-label="Loading data">{[1, 2, 3, 4, 5].map(i => <div className="skeleton sk-row" key={i} />)}</div>;
}
export function RequestError({ message, retry }: { message: string; retry: () => void }) {
  return <section className="card error-state" role="alert"><AlertCircle size={28} aria-hidden="true" /><h2>Let’s try that again</h2><p>{message}</p><button className="primary-button" onClick={retry}>Retry</button></section>;
}
export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card empty-state"><Inbox size={28} aria-hidden="true" /><h2>{title}</h2><p>{children}</p></section>;
}
