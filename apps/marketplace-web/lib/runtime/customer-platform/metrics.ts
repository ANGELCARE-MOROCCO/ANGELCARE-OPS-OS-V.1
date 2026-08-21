import type { CustomerPlatformWorkloadClass } from '@/lib/runtime/customer-platform/types'

type ClassMetric = {
  admitted: number
  busy: number
  unavailable: number
  completed: number
  failed: number
  active: number
  durationMs: number[]
}

type MetricsGlobal = typeof globalThis & {
  __angelcareCustomerMetrics?: Record<CustomerPlatformWorkloadClass, ClassMetric>
}

function fresh(): ClassMetric {
  return { admitted: 0, busy: 0, unavailable: 0, completed: 0, failed: 0, active: 0, durationMs: [] }
}

function metrics() {
  const state = globalThis as MetricsGlobal
  if (!state.__angelcareCustomerMetrics) {
    state.__angelcareCustomerMetrics = {
      critical: fresh(), interactive: fresh(), public: fresh(), mutation: fresh(),
      provider: fresh(), heavy: fresh(), ai: fresh(), background: fresh(),
    }
  }
  return state.__angelcareCustomerMetrics
}

export function recordCustomerPlatformAdmitted(workloadClass: CustomerPlatformWorkloadClass) {
  const metric = metrics()[workloadClass]
  metric.admitted += 1
  metric.active += 1
}

export function recordCustomerPlatformBusy(workloadClass: CustomerPlatformWorkloadClass) {
  metrics()[workloadClass].busy += 1
}

export function recordCustomerPlatformUnavailable(workloadClass: CustomerPlatformWorkloadClass) {
  metrics()[workloadClass].unavailable += 1
}

export function recordCustomerPlatformFinished(workloadClass: CustomerPlatformWorkloadClass, durationMs: number, failed: boolean) {
  const metric = metrics()[workloadClass]
  metric.completed += 1
  metric.active = Math.max(0, metric.active - 1)
  if (failed) metric.failed += 1
  metric.durationMs.push(Math.max(0, durationMs))
  if (metric.durationMs.length > 128) metric.durationMs.splice(0, metric.durationMs.length - 128)
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return Math.round(sorted[index] * 100) / 100
}

export function getCustomerPlatformMetricsSnapshot() {
  return Object.entries(metrics()).map(([workloadClass, metric]) => ({
    workloadClass,
    admitted: metric.admitted,
    busy: metric.busy,
    unavailable: metric.unavailable,
    completed: metric.completed,
    failed: metric.failed,
    active: metric.active,
    p50Ms: percentile(metric.durationMs, 50),
    p95Ms: percentile(metric.durationMs, 95),
    p99Ms: percentile(metric.durationMs, 99),
  }))
}
