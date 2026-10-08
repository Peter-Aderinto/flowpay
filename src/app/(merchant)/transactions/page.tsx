import { Suspense } from 'react';
import { Transactions } from '@/components/transactions';
import { ListSkeleton } from '@/components/request-states';
export default function TransactionsPage() {
  return <Suspense fallback={<ListSkeleton />}><Transactions /></Suspense>;
}
