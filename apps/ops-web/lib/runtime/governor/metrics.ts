import type {
  AngelCareWorkloadClass,
} from '@/lib/runtime/governor/types'

const HISTOGRAM_BOUNDS = [
  10,
  25,
  50,
  100,
  250,
  500,
  1_000,
  2_500,
  5_000,
  10_000,
  30_000,
  Number.POSITIVE_INFINITY,
] as const

type Histogram = {
  count: number
  sum: number
  buckets: number[]
}

type ClassMetric = {
  admitted: number
  busy: number
  unavailable: number
  failed: number
  active: number
  peakActive: number
  wait: Histogram
  duration: Histogram
}

type OperationMetric = {
  workloadClass: AngelCareWorkloadClass
  admitted: number
  busy: number
  unavailable: number
  failed: number
  completed: number
  totalDurationMs: number
}

type GovernorMetricsState = {
  startedAt: number
  classes: Map<AngelCareWorkloadClass, ClassMetric>
  operations: Map<string, OperationMetric>
}

type GovernorMetricsGlobal = typeof globalThis & {
  __angelcareGovernorMetrics?: GovernorMetricsState
}

function histogram(): Histogram {
  return {
    count: 0,
    sum: 0,
    buckets: HISTOGRAM_BOUNDS.map(() => 0),
  }
}

function classMetric(): ClassMetric {
  return {
    admitted: 0,
    busy: 0,
    unavailable: 0,
    failed: 0,
    active: 0,
    peakActive: 0,
    wait: histogram(),
    duration: histogram(),
  }
}

function state() {
  const globalState = globalThis as GovernorMetricsGlobal

  if (!globalState.__angelcareGovernorMetrics) {
    globalState.__angelcareGovernorMetrics = {
      startedAt: Date.now(),
      classes: new Map(),
      operations: new Map(),
    }
  }

  return globalState.__angelcareGovernorMetrics
}

function ensureClass(
  workloadClass: AngelCareWorkloadClass,
) {
  const current = state()
  let metric = current.classes.get(workloadClass)

  if (!metric) {
    metric = classMetric()
    current.classes.set(workloadClass, metric)
  }

  return metric
}

function operationKey(
  operation: string,
) {
  const normalized = operation
    .trim()
    .slice(0, 180)

  if (!normalized) return 'unknown'

  const current = state()

  if (
    current.operations.has(normalized) ||
    current.operations.size < 200
  ) {
    return normalized
  }

  return 'other'
}

function ensureOperation(
  workloadClass: AngelCareWorkloadClass,
  operation: string,
) {
  const current = state()
  const key = operationKey(operation)
  let metric = current.operations.get(key)

  if (!metric) {
    metric = {
      workloadClass,
      admitted: 0,
      busy: 0,
      unavailable: 0,
      failed: 0,
      completed: 0,
      totalDurationMs: 0,
    }

    current.operations.set(key, metric)
  }

  return metric
}

function observe(
  histogramValue: Histogram,
  valueMs: number,
) {
  const value = Math.max(
    0,
    Number.isFinite(valueMs)
      ? valueMs
      : 0,
  )

  histogramValue.count += 1
  histogramValue.sum += value

  const index = HISTOGRAM_BOUNDS.findIndex(
    (bound) => value <= bound,
  )

  histogramValue.buckets[
    index >= 0
      ? index
      : histogramValue.buckets.length - 1
  ] += 1
}

function percentileEstimate(
  value: Histogram,
  percentile: number,
) {
  if (!value.count) return 0

  const target = Math.ceil(
    value.count * percentile,
  )

  let cumulative = 0

  for (
    let index = 0;
    index < value.buckets.length;
    index += 1
  ) {
    cumulative += value.buckets[index]

    if (cumulative >= target) {
      const bound = HISTOGRAM_BOUNDS[index]

      return Number.isFinite(bound)
        ? bound
        : 30_000
    }
  }

  return 30_000
}

export function recordGovernorAdmitted(
  workloadClass: AngelCareWorkloadClass,
  operation: string,
  waitedMs: number,
) {
  const metric = ensureClass(workloadClass)

  metric.admitted += 1
  metric.active += 1
  metric.peakActive = Math.max(
    metric.peakActive,
    metric.active,
  )

  observe(metric.wait, waitedMs)

  ensureOperation(
    workloadClass,
    operation,
  ).admitted += 1
}

export function recordGovernorBusy(
  workloadClass: AngelCareWorkloadClass,
  operation: string,
) {
  ensureClass(workloadClass).busy += 1
  ensureOperation(
    workloadClass,
    operation,
  ).busy += 1
}

export function recordGovernorUnavailable(
  workloadClass: AngelCareWorkloadClass,
  operation: string,
) {
  ensureClass(workloadClass).unavailable += 1
  ensureOperation(
    workloadClass,
    operation,
  ).unavailable += 1
}

export function recordGovernorFinished(
  workloadClass: AngelCareWorkloadClass,
  operation: string,
  durationMs: number,
  failed: boolean,
) {
  const metric = ensureClass(workloadClass)

  metric.active = Math.max(
    0,
    metric.active - 1,
  )

  if (failed) {
    metric.failed += 1
  }

  observe(metric.duration, durationMs)

  const operationMetric = ensureOperation(
    workloadClass,
    operation,
  )

  operationMetric.completed += 1
  operationMetric.totalDurationMs += Math.max(
    0,
    durationMs,
  )

  if (failed) {
    operationMetric.failed += 1
  }
}

export function getGovernorMetricsSnapshot() {
  const current = state()

  const classes = Object.fromEntries(
    Array.from(current.classes.entries()).map(
      ([workloadClass, metric]) => [
        workloadClass,
        {
          admitted: metric.admitted,
          busy: metric.busy,
          unavailable: metric.unavailable,
          failed: metric.failed,
          active: metric.active,
          peakActive: metric.peakActive,
          wait: {
            count: metric.wait.count,
            averageMs: metric.wait.count
              ? Math.round(
                  metric.wait.sum /
                    metric.wait.count,
                )
              : 0,
            p50Ms: percentileEstimate(
              metric.wait,
              0.5,
            ),
            p95Ms: percentileEstimate(
              metric.wait,
              0.95,
            ),
            p99Ms: percentileEstimate(
              metric.wait,
              0.99,
            ),
          },
          duration: {
            count: metric.duration.count,
            averageMs: metric.duration.count
              ? Math.round(
                  metric.duration.sum /
                    metric.duration.count,
                )
              : 0,
            p50Ms: percentileEstimate(
              metric.duration,
              0.5,
            ),
            p95Ms: percentileEstimate(
              metric.duration,
              0.95,
            ),
            p99Ms: percentileEstimate(
              metric.duration,
              0.99,
            ),
          },
        },
      ],
    ),
  )

  const operations = Array.from(
    current.operations.entries(),
  )
    .map(([operation, metric]) => ({
      operation,
      ...metric,
      averageDurationMs:
        metric.completed > 0
          ? Math.round(
              metric.totalDurationMs /
                metric.completed,
            )
          : 0,
    }))
    .sort(
      (a, b) =>
        b.admitted + b.busy -
        (a.admitted + a.busy),
    )
    .slice(0, 60)

  return {
    startedAt: new Date(
      current.startedAt,
    ).toISOString(),
    uptimeMs: Date.now() - current.startedAt,
    classes,
    operations,
  }
}
