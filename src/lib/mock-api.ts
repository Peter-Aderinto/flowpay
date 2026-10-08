import { demoRepository, type DemoRepository } from './repository';
import { queryTransactions } from './transaction-query';
import type { DashboardData, InvoiceDraft, InvoiceQuery, Scenario, TransactionQuery } from './types';

// Promise-based in-memory requests, not HTTP. All reads and writes use one repository.
export function createMockApi(delayMs = 450, repository: DemoRepository = demoRepository) {
  let failNext = false;
  async function wait(signal?: AbortSignal) {
    const shouldFail = failNext;
    failNext = false;
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) { reject(new DOMException('Request cancelled', 'AbortError')); return; }
      const abort = () => { clearTimeout(timer); reject(new DOMException('Request cancelled', 'AbortError')); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delayMs);
      signal?.addEventListener('abort', abort, { once: true });
    });
    if (shouldFail) throw new Error('We could not load your demo data. Please try again.');
  }
  async function read(scenario: Scenario, signal?: AbortSignal): Promise<DashboardData> {
    await wait(signal);
    return scenario === 'empty' ? { transactions: [], invoices: [] } : repository.read();
  }
  return {
    failNextRequest() { failNext = true; },
    getDashboard: read,
    async getTransactions(query: TransactionQuery, scenario: Scenario, signal?: AbortSignal) {
      return queryTransactions((await read(scenario, signal)).transactions, query);
    },
    async getInvoices(query: InvoiceQuery, scenario: Scenario, signal?: AbortSignal) {
      const data = await read(scenario, signal);
      const search = query.search.trim().toLowerCase();
      return {
        datasetCount: data.invoices.length,
        items: data.invoices.filter(i => (!query.status || i.status === query.status) &&
          (!search || [i.number ?? i.id, i.customer, i.email ?? ''].some(value => value.toLowerCase().includes(search)))),
      };
    },
    async getInvoice(id: string, signal?: AbortSignal) { await wait(signal); return repository.read().invoices.find(i => i.id === id) ?? null; },
    async createInvoice(draft: InvoiceDraft, signal?: AbortSignal) { await wait(signal); return repository.createInvoice(draft); },
    async resetDemoData() { await wait(); repository.reset(); },
    getPersistenceWarning: repository.getWarning,
    getRevision: repository.getRevision,
    subscribe: repository.subscribe,
    invalidate: repository.invalidate,
  };
}
export type MockApi = ReturnType<typeof createMockApi>;
