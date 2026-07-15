export type OpsosTelemetryEventType =
  | 'route_mount'
  | 'route_navigation'
  | 'route_visibility_hidden'
  | 'route_unmount'
  | 'long_task'
  | 'memory_sample'
  | 'api_call'
  | 'api_error'
  | 'modal_open'
  | 'modal_close'
  | 'client_error'
  | 'unhandled_rejection'
  | 'interaction'

export type OpsosTelemetrySeverity = 'info' | 'healthy' | 'warning' | 'critical'

export type OpsosTelemetryEvent = {
  id?: string
  eventType: OpsosTelemetryEventType | string
  route?: string
  modal?: string
  apiPath?: string
  interactionName?: string
  severity?: OpsosTelemetrySeverity | string
  durationMs?: number | null
  memoryMb?: number | null
  sessionId?: string
  userId?: string | null
  userAgent?: string
  metadata?: Record<string, unknown>
  createdAt?: string
}

export type OpsosTelemetryIngestPayload = {
  source?: 'client' | 'server' | 'manual'
  events?: OpsosTelemetryEvent[]
  event?: OpsosTelemetryEvent
}

export type OpsosRouteTelemetrySummary = {
  route: string
  events: number
  longTasks: number
  apiCalls: number
  apiErrors: number
  modalOpens: number
  maxDurationMs: number
  avgDurationMs: number
  maxMemoryMb: number
  lastEventAt: string | null
  severity: OpsosTelemetrySeverity
}

export type OpsosModalTelemetrySummary = {
  modal: string
  route: string
  events: number
  opens: number
  maxOpenMs: number
  maxMemoryMb: number
  lastEventAt: string | null
  severity: OpsosTelemetrySeverity
}

export type OpsosLiveTelemetrySnapshot = {
  ok: boolean
  source: 'supabase' | 'fallback'
  generatedAt: string
  windowMinutes: number
  totals: {
    events: number
    routes: number
    modals: number
    longTasks: number
    apiCalls: number
    apiErrors: number
    clientErrors: number
    criticalEvents: number
    warningEvents: number
    maxMemoryMb: number
    maxDurationMs: number
  }
  routes: OpsosRouteTelemetrySummary[]
  modals: OpsosModalTelemetrySummary[]
  recentEvents: OpsosTelemetryEvent[]
}

export function inferTelemetrySeverity(event: Partial<OpsosTelemetryEvent>): OpsosTelemetrySeverity {
  const duration = Number(event.durationMs || 0)
  const memory = Number(event.memoryMb || 0)
  const type = String(event.eventType || '')

  if (event.severity === 'critical' || type === 'client_error' || type === 'unhandled_rejection') return 'critical'
  if (type === 'api_error') return 'critical'
  if (duration >= 1500 || memory >= 650) return 'critical'
  if (duration >= 250 || memory >= 350 || type === 'long_task') return 'warning'
  if (event.severity === 'warning') return 'warning'
  if (event.severity === 'healthy') return 'healthy'
  return 'info'
}

export function normalizeTelemetryEvent(input: Partial<OpsosTelemetryEvent>, fallbackRoute = '/unknown'): OpsosTelemetryEvent {
  const route = String(input.route || fallbackRoute || '/unknown').slice(0, 320)
  const eventType = String(input.eventType || 'interaction').slice(0, 80)
  const durationMs = input.durationMs == null ? null : Math.max(0, Math.round(Number(input.durationMs) || 0))
  const memoryMb = input.memoryMb == null ? null : Math.max(0, Math.round(Number(input.memoryMb) || 0))
  const severity = inferTelemetrySeverity({ ...input, eventType, durationMs, memoryMb })

  return {
    eventType,
    route,
    modal: input.modal ? String(input.modal).slice(0, 220) : undefined,
    apiPath: input.apiPath ? String(input.apiPath).slice(0, 420) : undefined,
    interactionName: input.interactionName ? String(input.interactionName).slice(0, 220) : undefined,
    severity,
    durationMs,
    memoryMb,
    sessionId: input.sessionId ? String(input.sessionId).slice(0, 120) : undefined,
    userId: input.userId ? String(input.userId).slice(0, 120) : undefined,
    userAgent: input.userAgent ? String(input.userAgent).slice(0, 520) : undefined,
    metadata: typeof input.metadata === 'object' && input.metadata ? input.metadata : {},
    createdAt: input.createdAt || new Date().toISOString(),
  }
}
