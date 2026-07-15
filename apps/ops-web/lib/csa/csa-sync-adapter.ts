import { csaActionQueue, csaKpis, csaModuleSync, csaSignals, csaWorkstreams } from '@/lib/csa/csa-command-data'

export async function getCsaCommandSnapshot() {
  // Safe adapter layer.
  // Later, replace each block with Supabase reads from:
  // leads, families, services, revenue, sales, incidents, connect messages and tasks.
  return {
    loadedAt: new Date().toISOString(),
    kpis: csaKpis,
    workstreams: csaWorkstreams,
    actionQueue: csaActionQueue,
    signals: csaSignals,
    moduleSync: csaModuleSync,
    syncSources: [
      { source: 'revenue-command-center', status: 'ready' },
      { source: 'services', status: 'ready' },
      { source: 'sales', status: 'ready' },
      { source: 'leads', status: 'ready' },
      { source: 'families', status: 'ready' },
      { source: 'incidents', status: 'ready' },
    ],
  }
}
