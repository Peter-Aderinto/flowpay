import { collectionTrend } from '@/lib/analytics';
import { formatDate, formatNGN } from '@/lib/format';
import type { Period, Transaction } from '@/lib/types';
export function CollectionChart({ transactions, days }: { transactions: Transaction[]; days: Period }) {
  const buckets = collectionTrend(transactions, days);
  const total = buckets.reduce((sum, b) => sum + b.amountKobo, 0);
  const max = Math.max(...buckets.map(b => b.amountKobo), 100);
  const points = buckets.map((b, i) => `${52 + i * 698 / (buckets.length - 1)},${190 - b.amountKobo / max * 150}`).join(' ');
  return <section className="card chart-card" aria-labelledby="chart-title">
    <div className="section-heading"><div><h2 id="chart-title">Collection trend</h2><p>Successful payments · {days === 90 ? '7-day buckets' : 'Daily totals'}</p></div><span className="chart-legend"><i />Collected</span></div>
    <p className="sr-only">Collected {formatNGN(total)} over {days} days. The table below provides the exact values shown in the chart.</p>
    <svg className="trend-chart" viewBox="0 0 780 240" role="img" aria-label={`Collection trend: ${formatNGN(total)} in successful payments over ${days} days. Exact values in the data table below.`}>
      {[0, 0.5, 1].map(f => <g key={f}><line x1="52" x2="750" y1={190 - f * 150} y2={190 - f * 150} stroke="#e5e9e7" strokeDasharray="4 4" /><text x="44" y={194 - f * 150} textAnchor="end" fill="#68756e" fontSize="11">{Math.round(max * f / 100000)}k</text></g>)}
      <text x="52" y="20" fill="#68756e" fontSize="11">NGN</text>
      <polyline points={points} fill="none" stroke="#07835c" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {buckets.map((b, i) => <circle key={b.timestamp} cx={52 + i * 698 / (buckets.length - 1)} cy={190 - b.amountKobo / max * 150} r="3" fill="#07835c"><title>{formatDate(b.timestamp)}: {formatNGN(b.amountKobo)}</title></circle>)}
      {[0, Math.floor((buckets.length - 1) / 2), buckets.length - 1].map(i => <text key={i} x={52 + i * 698 / (buckets.length - 1)} y="224" textAnchor={i === 0 ? 'start' : i === buckets.length - 1 ? 'end' : 'middle'} fill="#68756e" fontSize="12">{formatDate(buckets[i].timestamp)}</text>)}
    </svg>
    <details className="chart-data"><summary>View chart data</summary><div className="table-scroll" role="region" aria-label="Collection trend data" tabIndex={0}><table><caption className="sr-only">Successful collection totals by reporting bucket</caption><thead><tr><th scope="col">Period</th><th scope="col">Collected</th></tr></thead><tbody>{buckets.map(b => <tr key={b.timestamp}><td>{formatDate(b.timestamp)}{days === 90 ? ` – ${formatDate(b.endTimestamp)}` : ''}</td><td>{formatNGN(b.amountKobo)}</td></tr>)}</tbody></table></div></details>
  </section>;
}
