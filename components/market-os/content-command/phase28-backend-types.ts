export type Phase28ProviderStatus = 'ready' | 'planned' | 'blocked';

export type Phase28SyncState =
  | 'idle'
  | 'queued'
  | 'syncing'
  | 'completed'
  | 'failed';

export interface Phase28ProviderContract {
  id: string;
  provider: string;
  category: 'storage' | 'analytics' | 'realtime' | 'publishing' | 'ai';
  status: Phase28ProviderStatus;
  notes: string;
}

export interface Phase28RepositoryAdapter {
  id: string;
  entity: string;
  methods: string[];
  backendReady: boolean;
}

export interface Phase28SyncQueueItem {
  id: string;
  entity: string;
  action: 'create' | 'update' | 'delete';
  state: Phase28SyncState;
  retries: number;
}

export interface Phase28MutationGuard {
  id: string;
  title: string;
  protection: string;
  enabled: boolean;
}

export interface Phase28BackendReadiness {
  label: string;
  percent: number;
  detail: string;
}