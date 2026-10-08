export type Period = 7 | 30 | 90;
export type Scenario = 'normal' | 'empty' | 'error';
export interface Transaction {
  id: string; reference: string; customer: string; email: string;
  amountKobo: number; currency: 'NGN'; status: 'successful' | 'pending' | 'failed';
  method: 'card' | 'bank_transfer'; timestamp: string; invoiceId?: string;
}
export interface Invoice {
  id: string; customer: string; amountKobo: number; currency: 'NGN';
  status: 'paid' | 'unpaid' | 'overdue'; dueAt: string; transactionId?: string;
}
export interface DashboardData {
  transactions: Transaction[]; invoices: Invoice[];
}
