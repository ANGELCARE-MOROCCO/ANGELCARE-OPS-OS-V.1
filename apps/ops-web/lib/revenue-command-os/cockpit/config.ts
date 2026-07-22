import type { CockpitExecutionMode, CockpitRoleView } from './types'

const MODES: CockpitExecutionMode[] = ['shadow','internal_only','approval_required','limited_autopilot','suspended','emergency_stop']

export interface CockpitConfig {
  enabled: boolean
  executionMode: CockpitExecutionMode
  refreshSeconds: number
  maxSignals: number
  maxPrograms: number
  maxExceptions: number
  maxTimelineEvents: number
  freshnessThresholdMinutes: number
  executiveBriefEnabled: boolean
  geminiBriefEnabled: boolean
  defaultRoleView: CockpitRoleView
}

export function cockpitConfig(): CockpitConfig {
  const rawMode = String(process.env.REVENUE_OS_EXECUTION_MODE || 'shadow') as CockpitExecutionMode
  return {
    enabled: process.env.REVENUE_OS_COCKPIT_ENABLED !== 'false',
    executionMode: MODES.includes(rawMode) ? rawMode : 'shadow',
    refreshSeconds: boundedInt(process.env.REVENUE_OS_COCKPIT_REFRESH_SECONDS, 30, 10, 300),
    maxSignals: boundedInt(process.env.REVENUE_OS_COCKPIT_MAX_SIGNALS, 24, 5, 200),
    maxPrograms: boundedInt(process.env.REVENUE_OS_COCKPIT_MAX_PROGRAMS, 20, 5, 100),
    maxExceptions: boundedInt(process.env.REVENUE_OS_COCKPIT_MAX_EXCEPTIONS, 50, 10, 500),
    maxTimelineEvents: boundedInt(process.env.REVENUE_OS_COCKPIT_MAX_TIMELINE_EVENTS, 100, 20, 1000),
    freshnessThresholdMinutes: boundedInt(process.env.REVENUE_OS_COCKPIT_FRESHNESS_MINUTES, 60, 5, 1440),
    executiveBriefEnabled: process.env.REVENUE_OS_COCKPIT_EXECUTIVE_BRIEF !== 'false',
    geminiBriefEnabled: process.env.REVENUE_OS_COCKPIT_GEMINI_BRIEF === 'true',
    defaultRoleView: parseRoleView(process.env.REVENUE_OS_COCKPIT_DEFAULT_ROLE),
  }
}

function boundedInt(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(minimum, Math.min(maximum, Math.round(parsed)))
}

function parseRoleView(value: string | undefined): CockpitRoleView {
  if (value === 'commercial' || value === 'operations' || value === 'finance' || value === 'agent') return value
  return 'executive'
}
