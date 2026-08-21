import { monitorEventLoopDelay } from 'node:perf_hooks'

type EventLoopGlobal = typeof globalThis & {
  __angelcareCustomerEventLoopMonitor?: ReturnType<typeof monitorEventLoopDelay>
}

function monitor() {
  const state = globalThis as EventLoopGlobal
  if (!state.__angelcareCustomerEventLoopMonitor) {
    const current = monitorEventLoopDelay({ resolution: 20 })
    current.enable()
    state.__angelcareCustomerEventLoopMonitor = current
  }
  return state.__angelcareCustomerEventLoopMonitor
}

function ms(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.round((value / 1_000_000) * 100) / 100
}

export function getCustomerPlatformEventLoopSnapshot() {
  const current = monitor()
  return {
    meanMs: ms(current.mean),
    maxMs: ms(current.max),
    p50Ms: ms(current.percentile(50)),
    p95Ms: ms(current.percentile(95)),
    p99Ms: ms(current.percentile(99)),
  }
}
