import type {
  Phase28BackendReadiness,
  Phase28MutationGuard,
  Phase28ProviderContract,
  Phase28RepositoryAdapter,
  Phase28SyncQueueItem,
} from './phase28-backend-types';

export const phase28ProviderContracts: Phase28ProviderContract[] = [
  {
    id: 'provider-storage',
    provider: 'Supabase Storage',
    category: 'storage',
    status: 'ready',
    notes: 'Ready for future bucket mapping and signed uploads.',
  },
  {
    id: 'provider-analytics',
    provider: 'Analytics Ingestion Adapter',
    category: 'analytics',
    status: 'planned',
    notes: 'Awaiting live ingestion implementation.',
  },
  {
    id: 'provider-realtime',
    provider: 'Realtime Collaboration Adapter',
    category: 'realtime',
    status: 'planned',
    notes: 'Provider contracts defined without runtime connection.',
  },
  {
    id: 'provider-publishing',
    provider: 'Publishing Provider',
    category: 'publishing',
    status: 'planned',
    notes: 'Ready for Meta/LinkedIn publishing integration later.',
  },
  {
    id: 'provider-ai',
    provider: 'AI Execution Provider',
    category: 'ai',
    status: 'ready',
    notes: 'Safe backend abstraction layer prepared.',
  },
];

export const phase28RepositoryAdapters: Phase28RepositoryAdapter[] = [
  {
    id: 'repo-assets',
    entity: 'Content Assets',
    methods: ['list', 'create', 'update', 'archive'],
    backendReady: true,
  },
  {
    id: 'repo-campaigns',
    entity: 'Campaigns',
    methods: ['list', 'create', 'update'],
    backendReady: true,
  },
  {
    id: 'repo-publishing',
    entity: 'Publishing Queue',
    methods: ['list', 'schedule', 'approve'],
    backendReady: false,
  },
];

export const phase28SyncQueue: Phase28SyncQueueItem[] = [
  {
    id: 'sync-001',
    entity: 'Campaign',
    action: 'update',
    state: 'queued',
    retries: 0,
  },
  {
    id: 'sync-002',
    entity: 'Media Asset',
    action: 'create',
    state: 'syncing',
    retries: 1,
  },
  {
    id: 'sync-003',
    entity: 'Publishing Entry',
    action: 'update',
    state: 'failed',
    retries: 3,
  },
];

export const phase28MutationGuards: Phase28MutationGuard[] = [
  {
    id: 'guard-optimistic',
    title: 'Optimistic Update Safety',
    protection: 'Rollback mutation if provider sync fails.',
    enabled: true,
  },
  {
    id: 'guard-retry',
    title: 'Retry Queue Protection',
    protection: 'Retry transient provider failures safely.',
    enabled: true,
  },
  {
    id: 'guard-audit',
    title: 'Audit Trail Requirement',
    protection: 'Every mutation should emit an audit event.',
    enabled: true,
  },
];

export const phase28BackendReadiness: Phase28BackendReadiness[] = [
  {
    label: 'Provider Contracts',
    percent: 91,
    detail: 'Typed backend providers prepared.',
  },
  {
    label: 'Repository Layer',
    percent: 87,
    detail: 'Repository adapters standardized.',
  },
  {
    label: 'Realtime Readiness',
    percent: 72,
    detail: 'Realtime runtime still pending.',
  },
  {
    label: 'Publishing Integration',
    percent: 68,
    detail: 'External publishing APIs intentionally deferred.',
  },
  {
    label: 'Mutation Safety',
    percent: 89,
    detail: 'Guards and retry logic modeled.',
  },
];