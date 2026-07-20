import type { RevenueOsEnvironment } from './types'

export type RevenueOsEnvironmentConfig = {
  environment: RevenueOsEnvironment
  enabled: boolean
  executionMode: 'shadow' | 'recommend' | 'approval-gated' | 'limited-autonomy'
  allowExternalActions: boolean
  auditRetentionDays: number
}

function booleanEnv(value: string | undefined, fallback: boolean) {
  if (value == null || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

export function getRevenueOsEnvironmentConfig(): RevenueOsEnvironmentConfig {
  const rawEnvironment = String(process.env.REVENUE_OS_ENVIRONMENT || process.env.NODE_ENV || 'development')
  const environment: RevenueOsEnvironment = rawEnvironment === 'production'
    ? 'production'
    : rawEnvironment === 'staging'
      ? 'staging'
      : 'development'
  const executionModeRaw = String(process.env.REVENUE_OS_EXECUTION_MODE || 'shadow')
  const executionMode = executionModeRaw === 'recommend' || executionModeRaw === 'approval-gated' || executionModeRaw === 'limited-autonomy'
    ? executionModeRaw
    : 'shadow'

  return {
    environment,
    enabled: booleanEnv(process.env.REVENUE_OS_ENABLED, true),
    executionMode,
    allowExternalActions: booleanEnv(process.env.REVENUE_OS_ALLOW_EXTERNAL_ACTIONS, false),
    auditRetentionDays: Math.max(365, Number(process.env.REVENUE_OS_AUDIT_RETENTION_DAYS || 2555)),
  }
}

export const REVENUE_OS_ENV_EXAMPLE = `# ANGELCARE Revenue Command OS — Phase 1\nREVENUE_OS_ENABLED=true\nREVENUE_OS_ENVIRONMENT=development\nREVENUE_OS_EXECUTION_MODE=shadow\nREVENUE_OS_ALLOW_EXTERNAL_ACTIONS=false\nREVENUE_OS_AUDIT_RETENTION_DAYS=2555\n`
