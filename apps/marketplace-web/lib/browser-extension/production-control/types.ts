export type ProductionHealthStatus = 'healthy' | 'degraded' | 'offline' | 'blocked' | 'unknown'
export type ReleaseChannelKey = 'development' | 'internal' | 'pilot' | 'stable' | 'rollback'
export type IncidentSeverity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4'
export type RuntimeHealthEventInput = {
  component: string
  status: ProductionHealthStatus
  eventType: string
  latencyMs?: number | null
  correlationId?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  metrics?: Record<string, unknown>
  metadata?: Record<string, unknown>
  occurredAt?: string | null
}
export type PerformanceSampleInput = {
  metricKey: string
  durationMs: number
  sampleContext?: string | null
  cacheState?: string | null
  success?: boolean
  metadata?: Record<string, unknown>
  measuredAt?: string | null
}
export type AdapterHealthInput = {
  adapterKey: string
  selectorVersion?: string
  status: ProductionHealthStatus
  success: boolean
  errorCode?: string | null
  errorMessage?: string | null
  metadata?: Record<string, unknown>
}
export type ProductionTelemetryPayload = {
  extensionVersion: string
  releaseChannel?: string | null
  health?: RuntimeHealthEventInput[]
  performance?: PerformanceSampleInput[]
  adapters?: AdapterHealthInput[]
}
