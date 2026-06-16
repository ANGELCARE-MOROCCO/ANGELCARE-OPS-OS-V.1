import { redirect } from 'next/navigation'
import CEOSystemControlTower from '@/components/ceo-system-control/CEOSystemControlTower'
import { fetchVercelUsageSnapshot, listRuntimeEvents, listUsageSnapshots } from '@/lib/system-control/runtime'
import { getSystemControlContext } from '@/app/api/system-control/_shared'

export const dynamic = 'force-dynamic'

export default async function CEOSystemControlPage() {
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

  const usage = {
    ok: true,
    connected: {
      vercel: vercel.connected,
      internal: true,
    },
    vercel,
    state: context.state,
    summary: {
      activeCpu: 0,
      functionInvocations: 0,
      edgeRequests: 0,
      bandwidth: 0,
      errorRate: 0,
      topRoutePressure: 'Not connected yet',
      estimatedCostPressure: rawSnapshots.reduce((sum, row) => sum + Number((row as any).cost_estimate || 0), 0),
    },
    charts: {
      hourly: [],
      daily: [],
      weekly: [],
      routePressure: [],
      modulePressure: Object.entries(context.state.disabledModules).map(([module, details]) => ({
        module,
        value: Number(details.pressure || 0),
      })),
      shutdownHistory: [],
    },
    metrics: {
      internalSnapshots: rawSnapshots.length,
      runtimeEvents: events.length,
    },
  }

  return (
    <CEOSystemControlTower
      initialState={context.state}
      initialUsage={usage as any}
      initialEvents={events as any}
      operatorName={context.actor.email}
    />
  )
}
