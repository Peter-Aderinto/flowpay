import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Transactions } from '@/components/transactions';
import { ListSkeleton } from '@/components/request-states';
export const metadata: Metadata = { title: 'Transactions' };
export default function TransactionsPage() {
  return <Suspense fallback={<ListSkeleton />}><Transactions /></Suspense>;
}
