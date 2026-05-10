import type { Phase12ServiceHealth } from './phase12-service-types';

export const phase12ServiceHealth: Phase12ServiceHealth[] = [
  {
    service: 'Repository Layer',
    status: 'ready',
    notes: 'Typed list/find repository helpers are available.',
  },
  {
    service: 'Local Persistence',
    status: 'ready',
    notes: 'Local storage save/read/clear helpers are available and client-safe.',
  },
  {
    service: 'Import / Export',
    status: 'ready',
    notes: 'Export payload builder and import payload validator are available.',
  },
  {
    service: 'External Publishing APIs',
    status: 'needs_configuration',
    notes: 'Not connected in this phase by design; keep external API integration for later controlled work.',
  },
  {
    service: 'Database Sync',
    status: 'needs_configuration',
    notes: 'Repository layer is ready to be mapped to Supabase or another backend later.',
  },
];