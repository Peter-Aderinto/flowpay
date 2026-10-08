import { fixtures } from './fixtures';
import type { DashboardData, Scenario } from './types';
// In-memory promises, not HTTP requests. One service instance per dashboard.
export function createMockApi(delayMs = 450) {
  let failNext = false;
  return {
    failNextRequest() { failNext = true; },
    async getDashboard(scenario: Scenario, signal?: AbortSignal): Promise<DashboardData> {
      const shouldFail = failNext;
      failNext = false;
      await new Promise<void>((resolve, reject) => {
        if (signal?.aborted) { reject(new DOMException('Request cancelled', 'AbortError')); return; }
        const abort = () => { clearTimeout(timer); reject(new DOMException('Request cancelled', 'AbortError')); };
        const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delayMs);
        signal?.addEventListener('abort', abort, { once: true });
      });
      if (shouldFail) throw new Error('We could not load your demo dashboard. Please try again.');
      return structuredClone(scenario === 'empty' ? { transactions: [], invoices: [] } : fixtures);
    },
  };
}
