import { createClient } from '@/lib/supabase/server'
import { buildOpsosRuntimeSnapshot, type OpsosRuntimeSnapshot } from '@/lib/opsos-control-plane/data'
import {
  inferTelemetrySeverity,
  normalizeTelemetryEvent,
  type OpsosLiveTelemetrySnapshot,
  type OpsosModalTelemetrySummary,
  type OpsosRouteTelemetrySummary,
  type OpsosTelemetryEvent,
} from '@/lib/opsos-control-plane/telemetry-types'

type OpsosPerformanceEventRow = {
  id?: string
  event_type?: string
  route?: string | null
  modal?: string | null
  api_path?: string | null
  interaction_name?: string | null
  severity?: string | null
  duration_ms?: number | null
  memory_mb?: number | null
  session_id?: string | null
  user_id?: string | null
  user_agent?: string | null
  payload?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
}

function eventFromRow(row: OpsosPerformanceEventRow): OpsosTelemetryEvent {
  return normalizeTelemetryEvent({
    id: row.id,
    eventType: row.event_type || 'interaction',
    route: row.route || '/unknown',
    modal: row.modal || undefined,
    apiPath: row.api_path || undefined,
    interactionName: row.interaction_name || undefined,
    severity: row.severity || undefined,
    durationMs: row.duration_ms ?? null,
    memoryMb: row.memory_mb ?? null,
    sessionId: row.session_id || undefined,
    userId: row.user_id || undefined,
    userAgent: row.user_agent || undefined,
    metadata: row.metadata || row.payload || {},
    createdAt: row.created_at || undefined,
  })
}

function summarizeRoutes(events: OpsosTelemetryEvent[]): OpsosRouteTelemetrySummary[] {
  const map = new Map<string, OpsosRouteTelemetrySummary>()

  for (const event of events) {
    const route = event.route || '/unknown'
    const current = map.get(route) || {
      route,
      events: 0,
      longTasks: 0,
      apiCalls: 0,
      apiErrors: 0,
      modalOpens: 0,
      maxDurationMs: 0,
      avgDurationMs: 0,
      maxMemoryMb: 0,
      lastEventAt: null,
      severity: 'info' as const,
    }

    current.events += 1
    if (event.eventType === 'long_task') current.longTasks += 1
    if (event.eventType === 'api_call') current.apiCalls += 1
    if (event.eventType === 'api_error') current.apiErrors += 1
    if (event.eventType === 'modal_open') current.modalOpens += 1
    current.maxDurationMs = Math.max(current.maxDurationMs, Number(event.durationMs || 0))
    current.maxMemoryMb = Math.max(current.maxMemoryMb, Number(event.memoryMb || 0))
    current.avgDurationMs += Number(event.durationMs || 0)
    current.lastEventAt = !current.lastEventAt || String(event.createdAt) > current.lastEventAt ? String(event.createdAt) : current.lastEventAt

    const eventSeverity = inferTelemetrySeverity(event)
    if (eventSeverity === 'critical') current.severity = 'critical'
    else if (eventSeverity === 'warning' && current.severity !== 'critical') current.severity = 'warning'
    else if (eventSeverity === 'healthy' && current.severity === 'info') current.severity = 'healthy'

    map.set(route, current)
  }

  return [...map.values()]
    .map((item) => ({ ...item, avgDurationMs: item.events ? Math.round(item.avgDurationMs / item.events) : 0 }))
    .sort((a, b) => {
      const severityScore = { critical: 3, warning: 2, healthy: 1, info: 0 }
      return severityScore[b.severity] - severityScore[a.severity] || b.maxDurationMs - a.maxDurationMs || b.events - a.events
    })
}

function summarizeModals(events: OpsosTelemetryEvent[]): OpsosModalTelemetrySummary[] {
  const map = new Map<string, OpsosModalTelemetrySummary>()

  for (const event of events.filter((item) => item.modal)) {
    const modal = String(event.modal)
    const current = map.get(modal) || {
      modal,
      route: event.route || '/unknown',
      events: 0,
      opens: 0,
      maxOpenMs: 0,
      maxMemoryMb: 0,
      lastEventAt: null,
      severity: 'info' as const,
    }

    current.events += 1
    if (event.eventType === 'modal_open') current.opens += 1
    current.maxOpenMs = Math.max(current.maxOpenMs, Number(event.durationMs || 0))
    current.maxMemoryMb = Math.max(current.maxMemoryMb, Number(event.memoryMb || 0))
    current.lastEventAt = !current.lastEventAt || String(event.createdAt) > current.lastEventAt ? String(event.createdAt) : current.lastEventAt

    const eventSeverity = inferTelemetrySeverity(event)
    if (eventSeverity === 'critical') current.severity = 'critical'
    else if (eventSeverity === 'warning' && current.severity !== 'critical') current.severity = 'warning'

    map.set(modal, current)
  }

  return [...map.values()].sort((a, b) => b.maxOpenMs - a.maxOpenMs || b.maxMemoryMb - a.maxMemoryMb)
}

export function buildFallbackLiveTelemetry(): OpsosLiveTelemetrySnapshot {
  const snapshot = buildOpsosRuntimeSnapshot()
  const now = new Date().toISOString()
  const events: OpsosTelemetryEvent[] = snapshot.routes.slice(0, 5).map((route) => normalizeTelemetryEvent({
    eventType: 'route_mount',
    route: route.route,
    durationMs: route.loadTimeMs,
    memoryMb: route.memoryMb,
    severity: route.status === 'critical' ? 'critical' : route.status === 'warning' || route.status === 'degraded' ? 'warning' : 'healthy',
    metadata: { source: 'fallback-seed', module: route.module },
    createdAt: now,
  }))

  return buildLiveTelemetryFromEvents(events, 'fallback')
}

export function buildLiveTelemetryFromEvents(events: OpsosTelemetryEvent[], source: 'supabase' | 'fallback' = 'supabase'): OpsosLiveTelemetrySnapshot {
  const routes = summarizeRoutes(events)
  const modals = summarizeModals(events)
  const totals = {
    events: events.length,
    routes: routes.length,
    modals: modals.length,
    longTasks: events.filter((event) => event.eventType === 'long_task').length,
    apiCalls: events.filter((event) => event.eventType === 'api_call').length,
    apiErrors: events.filter((event) => event.eventType === 'api_error').length,
    clientErrors: events.filter((event) => event.eventType === 'client_error' || event.eventType === 'unhandled_rejection').length,
    criticalEvents: events.filter((event) => inferTelemetrySeverity(event) === 'critical').length,
    warningEvents: events.filter((event) => inferTelemetrySeverity(event) === 'warning').length,
    maxMemoryMb: Math.max(0, ...events.map((event) => Number(event.memoryMb || 0))),
    maxDurationMs: Math.max(0, ...events.map((event) => Number(event.durationMs || 0))),
  }

  return {
    ok: true,
    source,
    generatedAt: new Date().toISOString(),
    windowMinutes: 60,
    totals,
    routes,
    modals,
    recentEvents: events.slice(0, 60),
  }
}

export async function readOpsosLiveTelemetry(limit = 500): Promise<OpsosLiveTelemetrySnapshot> {
  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const result = await supabase
      .from('opsos_performance_events')
      .select('id,event_type,route,modal,api_path,interaction_name,severity,duration_ms,memory_mb,session_id,user_id,user_agent,payload,metadata,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (result.error || !result.data) return buildFallbackLiveTelemetry()

    const events = (result.data as OpsosPerformanceEventRow[]).map(eventFromRow)
    if (!events.length) return buildFallbackLiveTelemetry()

    return buildLiveTelemetryFromEvents(events, 'supabase')
  } catch {
    return buildFallbackLiveTelemetry()
  }
}

export async function mergeLiveTelemetryIntoSnapshot(snapshot: OpsosRuntimeSnapshot): Promise<OpsosRuntimeSnapshot> {
  const live = await readOpsosLiveTelemetry(800)
  if (!live.routes.length || live.source === 'fallback') return snapshot

  const routeMap = new Map(live.routes.map((route) => [route.route, route]))
  const modalMap = new Map(live.modals.map((modal) => [modal.modal, modal]))

  const routes = snapshot.routes.map((route) => {
    const liveRoute = routeMap.get(route.route)
    if (!liveRoute) return route
    return {
      ...route,
      loadTimeMs: liveRoute.maxDurationMs || route.loadTimeMs,
      memoryMb: liveRoute.maxMemoryMb || route.memoryMb,
      apiCalls: Math.max(route.apiCalls, liveRoute.apiCalls),
      slowInteractions: Math.max(route.slowInteractions, liveRoute.longTasks),
      crashes24h: Math.max(route.crashes24h, liveRoute.apiErrors + liveRoute.longTasks),
      status: liveRoute.severity === 'critical' ? 'critical' : liveRoute.severity === 'warning' ? 'warning' : route.status,
      jsRisk: liveRoute.severity === 'critical' ? 'Critical' : liveRoute.severity === 'warning' ? 'High' : route.jsRisk,
      lastDeploy: liveRoute.lastEventAt ? 'live telemetry' : route.lastDeploy,
    }
  })

  for (const liveRoute of live.routes) {
    if (!snapshot.routes.some((route) => route.route === liveRoute.route)) {
      routes.push({
        id: `live-${liveRoute.route.replace(/[^a-z0-9]/gi, '-').slice(0, 60)}`,
        route: liveRoute.route,
        page: liveRoute.route.split('/').filter(Boolean).pop() || 'Runtime Route',
        module: 'Live Telemetry',
        status: liveRoute.severity === 'critical' ? 'critical' : liveRoute.severity === 'warning' ? 'warning' : 'healthy',
        loadTimeMs: liveRoute.maxDurationMs,
        memoryMb: liveRoute.maxMemoryMb,
        crashes24h: liveRoute.apiErrors,
        apiCalls: liveRoute.apiCalls,
        slowInteractions: liveRoute.longTasks,
        jsRisk: liveRoute.severity === 'critical' ? 'Critical' : liveRoute.severity === 'warning' ? 'High' : 'Low',
        safeMode: false,
        lastDeploy: 'live telemetry',
      })
    }
  }

  const modals = snapshot.modals.map((modal) => {
    const liveModal = modalMap.get(modal.name)
    if (!liveModal) return modal
    return {
      ...modal,
      openTimeMs: liveModal.maxOpenMs || modal.openTimeMs,
      memoryAfterCloseMb: liveModal.maxMemoryMb || modal.memoryAfterCloseMb,
      status: liveModal.severity === 'critical' ? 'critical' : liveModal.severity === 'warning' ? 'warning' : modal.status,
      topIssue: liveModal.severity === 'critical' ? 'Live telemetry detected critical modal pressure' : modal.topIssue,
    }
  })

  const existingModalNames = new Set(modals.map((modal) => modal.name))
  for (const liveModal of live.modals) {
    if (!existingModalNames.has(liveModal.modal)) {
      modals.push({
        id: `live-modal-${liveModal.modal.replace(/[^a-z0-9]/gi, '-').slice(0, 60)}`,
        name: liveModal.modal,
        parentRoute: liveModal.route,
        openTimeMs: liveModal.maxOpenMs,
        renderCount: liveModal.events,
        memoryAfterCloseMb: liveModal.maxMemoryMb,
        status: liveModal.severity === 'critical' ? 'critical' : liveModal.severity === 'warning' ? 'warning' : 'healthy',
        topIssue: 'Live telemetry modal activity detected',
        autoFixAvailable: true,
      })
    }
  }

  return {
    ...snapshot,
    generatedAt: new Date().toISOString(),
    routes,
    modals,
    kpis: {
      ...snapshot.kpis,
      unhealthyRoutes: routes.filter((route) => route.status !== 'healthy').length,
      slowPages: routes.filter((route) => route.loadTimeMs > 1500).length,
      modalFailures: modals.filter((modal) => modal.status !== 'healthy').length,
      apiErrors: Math.max(snapshot.kpis.apiErrors, live.totals.apiErrors),
      memoryRiskPct: Math.max(snapshot.kpis.memoryRiskPct, Math.min(100, Math.round(live.totals.maxMemoryMb / 8))),
    },
  }
}
