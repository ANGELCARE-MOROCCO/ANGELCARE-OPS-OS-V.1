import type { RevenueSignalBootstrap, RevenueSignalSeverity, RevenueSignalSourceStatus } from '@/lib/revenue-command-os/types'
import type { SovereignTone } from '../../../_components/visual-sovereignty/SovereignPrimitives'

export function formatSignalDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

export function signalSeverityTone(value: RevenueSignalSeverity): SovereignTone {
  if (value === 'critical') return 'rose'
  if (value === 'high' || value === 'medium') return 'amber'
  if (value === 'low') return 'blue'
  return 'slate'
}

export function sourceStatusTone(value: RevenueSignalSourceStatus): SovereignTone {
  if (value === 'healthy') return 'emerald'
  if (value === 'degraded' || value === 'stale') return 'amber'
  if (value === 'offline') return 'rose'
  if (value === 'unconfigured') return 'violet'
  return 'slate'
}

export function signalTruthMode(fabric: RevenueSignalBootstrap, warnings: string[], error: string | null) {
  if (error) return 'degraded'
  if (fabric.storageMode === 'contract-seed') return 'preview'
  if (warnings.length || fabric.counters.staleSources) return 'degraded'
  if (!fabric.signals.length) return 'empty'
  return fabric.executionPosture
}

export function sourceNameMap(fabric: RevenueSignalBootstrap) {
  return new Map(fabric.sources.map((source) => [source.code, source.name]))
}

export function percent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}
