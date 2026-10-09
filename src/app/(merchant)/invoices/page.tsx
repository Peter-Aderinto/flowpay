import type { Metadata } from 'next';
import { Invoices } from '@/components/invoices';
export const metadata: Metadata = { title: 'Invoices' };
export default function InvoicesPage() { return <Invoices />; }
