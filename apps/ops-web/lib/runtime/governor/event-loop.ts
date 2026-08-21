import {
  monitorEventLoopDelay,
} from 'node:perf_hooks'

type EventLoopGlobal = typeof globalThis & {
  __angelcareEventLoopMonitor?: ReturnType<
    typeof monitorEventLoopDelay
  >
}

function monitor() {
  const globalState = globalThis as EventLoopGlobal

  if (!globalState.__angelcareEventLoopMonitor) {
    const current = monitorEventLoopDelay({
      resolution: 20,
    })

    current.enable()
    globalState.__angelcareEventLoopMonitor = current
  }

  return globalState.__angelcareEventLoopMonitor
}

function nsToMs(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.round((value / 1_000_000) * 100) / 100
}

export function getEventLoopPressureSnapshot() {
  const current = monitor()

  return {
    meanMs: nsToMs(current.mean),
    maxMs: nsToMs(current.max),
    p50Ms: nsToMs(current.percentile(50)),
    p95Ms: nsToMs(current.percentile(95)),
    p99Ms: nsToMs(current.percentile(99)),
  }
}
