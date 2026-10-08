'use client';
import { useId, useState } from 'react';
import { collectionTrend } from '@/lib/analytics';
import { formatDate, formatNGN } from '@/lib/format';
import type { Period, Transaction } from '@/lib/types';
export function CollectionChart({ transactions, days }: { transactions: Transaction[]; days: Period }) {
  const buckets = collectionTrend(transactions, days);
  const [active, setActive] = useState<number | null>(null);
  const descriptionId = useId();
  const total = buckets.reduce((sum, b) => sum + b.amountKobo, 0);
  const max = Math.ceil(Math.max(...buckets.map(b => b.amountKobo), 10000) / 10000) * 10000;
  const x = (i: number) => 70 + i * 650 / (buckets.length - 1);
  const y = (amount: number) => 192 - amount / max * 150;
  const points = buckets.map((b, i) => `${x(i)},${y(b.amountKobo)}`).join(' ');
  const selected = active === null ? null : buckets[active];
  const label = (index: number) => `${formatDate(buckets[index].timestamp)}${days === 90 ? ` – ${formatDate(buckets[index].endTimestamp)}` : ''}: ${formatNGN(buckets[index].amountKobo)}`;
  return <section className="card chart-card" aria-labelledby="chart-title">
    <div className="section-heading"><div><h2 id="chart-title">Collection trend</h2><p>Successful payments · {days === 90 ? '7-day buckets' : 'Daily totals'}</p></div><span className="chart-legend"><i />Collected</span></div>
    <p className="sr-only" id={descriptionId}>Collected {formatNGN(total)} over {days} days. Focus a chart point for its exact value. Use left and right arrows to move between points, or view the data table below.</p>
    <div className="chart-scroll" tabIndex={0} role="region" aria-label="Collection chart, scroll horizontally on small screens">
      <svg className="trend-chart" viewBox="0 0 780 236" role="group" aria-label="Successful collection trend" aria-describedby={descriptionId}>
        {[0, 0.5, 1].map(f => <g key={f}><line x1="70" x2="720" y1={y(max * f)} y2={y(max * f)} stroke="#e3eae5" strokeDasharray="4 4" /><text x="60" y={y(max * f) + 4} textAnchor="end" fill="#50665a" fontSize="12">{new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 }).format(max * f / 100)}</text></g>)}
        <text x="70" y="23" fill="#50665a" fontSize="12">NGN</text>
        <polygon points={`70,192 ${points} 720,192`} fill="#087c58" fillOpacity="0.065" />
        <polyline points={points} fill="none" stroke="#07835c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {buckets.map((b, i) => <g key={b.timestamp}>
          <circle cx={x(i)} cy={y(b.amountKobo)} r={active === i ? 5 : 3} fill="#07835c" aria-hidden="true" />
          <circle className="chart-point" cx={x(i)} cy={y(b.amountKobo)} r="10" fill="transparent" tabIndex={active === i || (active === null && i === 0) ? 0 : -1} role="button" aria-label={label(i)}
            onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
            onClick={() => setActive(i)}
            onKeyDown={e => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault(); const next = Math.max(0, Math.min(buckets.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
                const svg = e.currentTarget.closest('svg'); svg?.querySelectorAll<SVGCircleElement>('.chart-point')[next]?.focus();
              } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(i); }
            }}><title>{label(i)}</title></circle>
        </g>)}
        {[0, Math.floor((buckets.length - 1) / 2), buckets.length - 1].map(i => <text key={i} x={x(i)} y="225" textAnchor={i === 0 ? 'start' : i === buckets.length - 1 ? 'end' : 'middle'} fill="#50665a" fontSize="12">{formatDate(buckets[i].timestamp)}</text>)}
      </svg>
    </div>
    <div className="chart-readout" role="status">{selected && active !== null ? label(active) : 'Hover or focus a point for the exact collection total.'}</div>
    <details className="chart-data"><summary>View chart data</summary><div className="table-scroll" role="region" aria-label="Collection trend data" tabIndex={0}><table><caption className="sr-only">Successful collection totals by reporting bucket</caption><thead><tr><th scope="col">Period</th><th scope="col">Collected</th></tr></thead><tbody>{buckets.map(b => <tr key={b.timestamp}><td>{formatDate(b.timestamp)}{days === 90 ? ` – ${formatDate(b.endTimestamp)}` : ''}</td><td className="amount-cell">{formatNGN(b.amountKobo)}</td></tr>)}</tbody></table></div></details>
  </section>;
}
