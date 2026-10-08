'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createMockApi, type MockApi } from '@/lib/mock-api';
import { STORAGE_KEY } from '@/lib/repository';
import type { Scenario } from '@/lib/types';
export type ResourceState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };
export function useDemoResource<T>(queryKey: string, load: (api: MockApi, scenario: Scenario, signal: AbortSignal) => Promise<T>) {
  const [api] = useState(() => createMockApi());
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [attempt, setAttempt] = useState(0);
  const revision = useSyncExternalStore(api.subscribe, api.getRevision, () => 0);
  const key = `${queryKey}|${scenario}|${attempt}|${revision}`;
  const [result, setResult] = useState<{ key: string; state: ResourceState<T> } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    load(api, scenario, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key, state: { status: 'ready', data } });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ key, state: { status: 'error', message: error instanceof Error ? error.message : 'Unable to load demo data.' } });
    });
    return () => controller.abort();
  }, [api, scenario, key, load]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) api.invalidate(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [api]);
  return {
    api, scenario,
    state: result?.key === key ? result.state : { status: 'loading' } as ResourceState<T>,
    warning: api.getPersistenceWarning(),
    retry: () => setAttempt(a => a + 1),
    changeScenario(value: Scenario) {
      if (value === 'error') api.failNextRequest();
      setScenario(value); setAttempt(a => a + 1);
    },
  };
}
