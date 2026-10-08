export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${status}`}><span aria-hidden="true" />{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}
