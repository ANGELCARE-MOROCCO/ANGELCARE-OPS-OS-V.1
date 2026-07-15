import type {
  Phase28BackendReadiness,
  Phase28ProviderContract,
  Phase28RepositoryAdapter,
  Phase28SyncQueueItem,
} from './phase28-backend-types';

export function getPhase28ReadyProviders(
  providers: Phase28ProviderContract[]
): Phase28ProviderContract[] {
  return providers.filter((provider) => provider.status === 'ready');
}

export function getPhase28BackendReadyRepositories(
  repositories: Phase28RepositoryAdapter[]
): Phase28RepositoryAdapter[] {
  return repositories.filter((repository) => repository.backendReady);
}

export function getPhase28FailedSyncItems(
  queue: Phase28SyncQueueItem[]
): Phase28SyncQueueItem[] {
  return queue.filter((item) => item.state === 'failed');
}

export function getPhase28OverallBackendReadiness(
  items: Phase28BackendReadiness[]
): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.percent, 0);
  return Math.round(total / items.length);
}