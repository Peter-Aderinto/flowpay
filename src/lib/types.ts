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
  number?: string; email?: string; items?: LineItem[]; notes?: string; createdAt?: string;
}
export interface DashboardData {
  transactions: Transaction[]; invoices: Invoice[];
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPriceKobo: number;
}
export interface InvoiceDraft {
  customer: string;
  email: string;
  dueDate: string;
  items: { description: string; quantity: string; unitPrice: string }[];
  notes: string;
}
export type TransactionSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
export interface TransactionQuery {
  search: string;
  status: Transaction['status'] | '';
  method: Transaction['method'] | '';
  from: string;
  to: string;
  sort: TransactionSort;
  page: number;
}
export interface TransactionPage {
  items: Transaction[];
  total: number;
  datasetCount: number;
  page: number;
  pageCount: number;
}
export interface InvoiceQuery { search: string; status: Invoice['status'] | '' }
