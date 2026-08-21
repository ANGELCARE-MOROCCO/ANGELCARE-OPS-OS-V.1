type RuntimeObservation = {
  id: string
  route_key: string
  surface: string
  metric_key: string
  value_numeric: number
  unit: string
  budget_numeric: number | null
  status: string
  environment: string
  territory_id: string | null
  observed_at: string
  evidence: Record<string, unknown>
}

import { getCustomerPlatformConfig } from '@/lib/runtime/customer-platform/config'
import { getCustomerPlatformEventLoopSnapshot } from '@/lib/runtime/customer-platform/event-loop'
import { getCustomerPlatformMetricsSnapshot } from '@/lib/runtime/customer-platform/metrics'
import {
  getCustomerPlatformRedisClient,
  isCustomerPlatformRedisConfigured,
  withCustomerPlatformRedisDeadline,
} from '@/lib/runtime/customer-platform/redis'

async function redisSnapshot() {
  const configured = isCustomerPlatformRedisConfigured()
  if (!configured) return { configured: false, ok: false, latencyMs: null as number | null }
  const started = performance.now()
  try {
    const client = await getCustomerPlatformRedisClient()
    if (!client) return { configured: true, ok: false, latencyMs: null as number | null }
    const pong = await withCustomerPlatformRedisDeadline(client.ping(), 750)
    return { configured: true, ok: pong === 'PONG', latencyMs: Math.round((performance.now() - started) * 100) / 100 }
  } catch {
    return { configured: true, ok: false, latencyMs: null as number | null }
  }
}

export async function getCustomerPlatformPerformanceSnapshot() {
  const config = getCustomerPlatformConfig()
  const memory = process.memoryUsage()
  const limitBytes = config.containerMemoryMb * 1024 * 1024
  const memoryPercent = limitBytes > 0 ? Math.round((memory.rss / limitBytes) * 10_000) / 100 : 0
  const [redis, eventLoop] = await Promise.all([redisSnapshot(), Promise.resolve(getCustomerPlatformEventLoopSnapshot())])
  const pressure = memoryPercent >= 92 || eventLoop.p95Ms >= 300 || (redis.configured && !redis.ok)
    ? 'critical'
    : memoryPercent >= 82 || eventLoop.p95Ms >= 160
      ? 'saturated'
      : memoryPercent >= 68 || eventLoop.p95Ms >= 75
        ? 'elevated'
        : 'healthy'
  return {
    generatedAt: new Date().toISOString(),
    pressure,
    memory: { rssBytes: memory.rss, heapUsedBytes: memory.heapUsed, limitBytes, percent: memoryPercent },
    eventLoop,
    redis,
    governor: getCustomerPlatformMetricsSnapshot(),
  }
}

export async function getCustomerPlatformPerformanceObservations() {
  const snapshot = await getCustomerPlatformPerformanceSnapshot()
  const now = snapshot.generatedAt
  const base = { surface: 'customer-platform-runtime', environment: process.env.NODE_ENV || 'unknown', territory_id: null, observed_at: now }
  const observations: RuntimeObservation[] = [
    {
      id: 'runtime-memory-rss', route_key: 'runtime', metric_key: 'container_memory_rss_percent',
      value_numeric: snapshot.memory.percent, unit: 'percent', budget_numeric: 82,
      status: snapshot.memory.percent >= 92 ? 'breach' : snapshot.memory.percent >= 82 ? 'warning' : 'healthy',
      evidence: { rssBytes: snapshot.memory.rssBytes, limitBytes: snapshot.memory.limitBytes, pressure: snapshot.pressure }, ...base,
    },
    {
      id: 'runtime-event-loop-p95', route_key: 'runtime', metric_key: 'event_loop_p95_ms',
      value_numeric: snapshot.eventLoop.p95Ms, unit: 'ms', budget_numeric: 160,
      status: snapshot.eventLoop.p95Ms >= 300 ? 'breach' : snapshot.eventLoop.p95Ms >= 160 ? 'warning' : 'healthy',
      evidence: { ...snapshot.eventLoop, pressure: snapshot.pressure }, ...base,
    },
    {
      id: 'runtime-redis-latency', route_key: 'runtime', metric_key: 'redis_latency_ms',
      value_numeric: snapshot.redis.latencyMs ?? 0, unit: 'ms', budget_numeric: 100,
      status: snapshot.redis.configured && !snapshot.redis.ok ? 'breach' : (snapshot.redis.latencyMs ?? 0) >= 100 ? 'warning' : 'healthy',
      evidence: { configured: snapshot.redis.configured, ok: snapshot.redis.ok }, ...base,
    },
  ]
  for (const row of snapshot.governor) {
    observations.push({
      id: `runtime-governor-${row.workloadClass}`,
      route_key: `governor:${row.workloadClass}`,
      metric_key: 'active_permits',
      value_numeric: row.active,
      unit: 'count',
      budget_numeric: null,
      status: row.busy > 0 || row.unavailable > 0 ? 'warning' : 'healthy',
      evidence: row,
      ...base,
    })
  }
  return observations
}
