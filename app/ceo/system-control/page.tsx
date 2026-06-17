import { redirect } from 'next/navigation'
import CEOSystemControlTower from '@/components/ceo-system-control/CEOSystemControlTower'
import { fetchVercelUsageSnapshot, listRuntimeEvents, listUsageSnapshots } from '@/lib/system-control/runtime'
import { getSystemControlContext } from '@/app/api/system-control/_shared'

export const dynamic = 'force-dynamic'
type SystemControlState = Awaited<ReturnType<typeof getSystemControlContext>>['state']
type WorkspaceKey =
  | 'overview'
  | 'consumption'
  | 'routes'
  | 'modules'
  | 'command-center'
  | 'runtime-policy-studio'
  | 'app-scan-center'
  | 'schedules'
  | 'events'
  | 'settings'

type SnapshotRow = {
  metric_key: string
  metric_value: number
  cost_estimate: number
  source: string
  period_start: string
  period_end: string
  payload: Record<string, unknown>
  created_at: string
}

function bucketBy<T extends SnapshotRow>(rows: T[], bucket: (row: T) => string, label: (key: string) => string) {
  const map = new Map<string, { label: string; value: number; cost: number; count: number }>()

  for (const row of rows) {
    const key = bucket(row)
    if (!key) continue
    const current = map.get(key) || { label: label(key), value: 0, cost: 0, count: 0 }
    current.value += Number(row.metric_value || 0)
    current.cost += Number(row.cost_estimate || 0)
    current.count += 1
    map.set(key, current)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value)
}

function hourKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 13)
}

function dayKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function weekKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.getUTCDay()
  const monday = new Date(date)
  monday.setUTCDate(date.getUTCDate() - ((day + 6) % 7))
  return monday.toISOString().slice(0, 10)
}

function buildMetricSummary(snapshots: SnapshotRow[]) {
  const derived = new Map<string, number>()
  for (const row of snapshots) {
    derived.set(row.metric_key, (derived.get(row.metric_key) || 0) + Number(row.metric_value || 0))
  }

  const estimatedCost = snapshots.reduce((sum, row) => sum + Number(row.cost_estimate || 0), 0)

  const routePressure = snapshots.find((row) => String(row.metric_key).includes('route:') || typeof row.payload.route === 'string')
  return {
    activeCpu: Number(derived.get('cpu_active') || derived.get('active_cpu') || 0),
    functionInvocations: Number(derived.get('function_invocations') || derived.get('invocations') || 0),
    edgeRequests: Number(derived.get('edge_requests') || derived.get('requests') || 0),
    bandwidth: Number(derived.get('bandwidth') || derived.get('data_transfer') || 0),
    errorRate: Number(derived.get('error_rate') || derived.get('errors') || 0),
    topRoutePressure: routePressure ? String(routePressure.payload.route || routePressure.metric_key || 'Not connected yet') : 'Not connected yet',
    estimatedCostPressure: estimatedCost,
  }
}

function buildRoutePressure(rows: SnapshotRow[]) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const route = typeof row.payload.route === 'string'
      ? row.payload.route
      : typeof row.metric_key === 'string' && row.metric_key.startsWith('route:')
        ? row.metric_key.replace(/^route:/, '')
        : ''
    if (!route) continue
    map.set(route, (map.get(route) || 0) + Number(row.metric_value || 0))
  }

  return [...map.entries()]
    .map(([route, value]) => ({ route, value }))
    .sort((a, b) => b.value - a.value)
}

function buildModulePressure(rows: SnapshotRow[], state: SystemControlState) {
  const map = new Map<string, number>()

  for (const row of rows) {
    const module = typeof row.payload.module === 'string'
      ? row.payload.module
      : typeof row.metric_key === 'string' && row.metric_key.startsWith('module:')
        ? row.metric_key.replace(/^module:/, '')
        : ''
    if (!module) continue
    map.set(module, (map.get(module) || 0) + Number(row.metric_value || 0))
  }

  for (const [module, details] of Object.entries(state.disabledModules)) {
    if (!map.has(module)) {
      map.set(module, Number(details.pressure || 0))
    }
  }

  return [...map.entries()]
    .map(([module, value]) => ({ module, value }))
    .sort((a, b) => b.value - a.value)
}

function buildShutdownHistory(events: Array<{ event_type: string; created_at: string; from_mode: string | null; to_mode: string | null }>) {
  return events
    .filter((event) => String(event.event_type).includes('shutdown') || String(event.event_type).includes('restore'))
    .map((event, index) => ({
      label: event.event_type.replace(/_/g, ' '),
      value: event.event_type.includes('restore') ? 100 : 0,
      at: event.created_at,
      index,
      fromMode: event.from_mode,
      toMode: event.to_mode,
    }))
}

function normalizeWorkspace(value: unknown): WorkspaceKey {
  const next = String(value || '').trim().toLowerCase()
  if ([
    'overview',
    'consumption',
    'routes',
    'modules',
    'command-center',
    'runtime-policy-studio',
    'app-scan-center',
    'schedules',
    'events',
    'settings',
  ].includes(next)) {
    return next as WorkspaceKey
  }
  if (next === 'route-pressure') return 'routes'
  if (next === 'live-consumption') return 'consumption'
  if (next === 'shutdown-center') return 'command-center'
  if (next === 'audit-events') return 'events'
  return 'overview'
}

export default async function CEOSystemControlPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const initialWorkspace = normalizeWorkspace(sp?.workspace)
  const context = await getSystemControlContext()

  if (!context.user) {
    redirect('/login')
  }

  if (!context.authorized) {
    redirect(context.state.isSystemOnline ? '/unauthorized' : '/system-offline')
  }

  const [events, rawSnapshots, vercel] = await Promise.all([
    listRuntimeEvents(context.supabase, 40),
    listUsageSnapshots(context.supabase, 200),
    fetchVercelUsageSnapshot(),
  ])

  const snapshots = rawSnapshots as SnapshotRow[]
  const hourly = bucketBy(snapshots, (row) => hourKey(row.period_start), (key) => key)
  const daily = bucketBy(snapshots, (row) => dayKey(row.period_start), (key) => key)
  const weekly = bucketBy(snapshots, (row) => weekKey(row.period_start), (key) => key)
  const routePressure = buildRoutePressure(snapshots)
  const modulePressure = buildModulePressure(snapshots, context.state)
  const shutdownHistory = buildShutdownHistory(events as Array<{ event_type: string; created_at: string; from_mode: string | null; to_mode: string | null }>)
  const summary = buildMetricSummary(snapshots)

  const usage = {
    ok: true,
    connected: {
      vercel: vercel.connected,
      internal: snapshots.length > 0,
    },
    vercel,
    state: context.state,
    summary,
    charts: {
      hourly,
      daily,
      weekly,
      routePressure,
      modulePressure,
      shutdownHistory,
    },
    metrics: {
      internalSnapshots: snapshots.length,
      runtimeEvents: events.length,
    },
  }

  return (
    <CEOSystemControlTower
      initialState={context.state}
      initialUsage={usage}
      initialEvents={events}
      operatorName={context.actor.email}
      initialWorkspace={initialWorkspace}
    />
  )
}
