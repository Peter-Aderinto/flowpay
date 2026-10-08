import type { DashboardData, Invoice, Transaction } from './types';
import { DAY_MS } from './demo';
const customers = ['Ada Okafor', 'Tunde Bello', 'Zainab Yusuf', 'Emeka Nwosu', 'Bisi Adeyemi', 'Chidi Eze', 'Amina Musa', 'Femi Afolabi'];
const transactions: Transaction[] = Array.from({ length: 60 }, (_, i) => {
  const number = String(i + 1).padStart(4, '0');
  return {
    id: `txn_${number}`, reference: `FP-2026-${number}`,
    customer: customers[i % customers.length], email: `customer${i + 1}@example.com`,
    amountKobo: (12500 + ((i * 7919) % 87500)) * 100, currency: 'NGN',
    status: i % 10 === 3 ? 'failed' : i % 10 === 7 ? 'pending' : 'successful',
    method: i % 3 === 0 ? 'bank_transfer' : 'card',
    timestamp: new Date(Date.parse('2026-10-08T15:30:00+01:00') - Math.floor(i * 89 / 59) * DAY_MS).toISOString(),
    ...(i < 3 ? { invoiceId: `inv_000${i + 1}` } : {}),
  };
});
const paid: Invoice[] = transactions.slice(0, 3).map((t, i) => ({
  id: `inv_000${i + 1}`, customer: t.customer, amountKobo: t.amountKobo, currency: 'NGN',
  status: 'paid', dueAt: '2026-10-10T23:59:59+01:00', transactionId: t.id,
}));
export const fixtures: DashboardData = {
  transactions,
  invoices: [...paid,
    { id: 'inv_0004', customer: 'Bisi Adeyemi', amountKobo: 6500000, currency: 'NGN', status: 'unpaid', dueAt: '2026-10-15T23:59:59+01:00' },
    { id: 'inv_0005', customer: 'Amina Musa', amountKobo: 4250000, currency: 'NGN', status: 'overdue', dueAt: '2026-09-28T23:59:59+01:00' },
    { id: 'inv_0006', customer: 'Femi Afolabi', amountKobo: 9800000, currency: 'NGN', status: 'overdue', dueAt: '2026-08-30T23:59:59+01:00' },
  ],
};
