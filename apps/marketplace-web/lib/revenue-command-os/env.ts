import type { RevenueOsEnvironment } from './types'
import { REVENUE_OS_LIVE_MODE } from './runtime-authority'

export type RevenueOsEnvironmentConfig = {
  environment: RevenueOsEnvironment
  enabled: boolean
  executionMode: typeof REVENUE_OS_LIVE_MODE
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

  return {
    environment,
    enabled: booleanEnv(process.env.REVENUE_OS_ENABLED, true),
    executionMode: REVENUE_OS_LIVE_MODE,
    // Channel-specific state still decides whether Email OS / WhatsApp can dispatch.
    allowExternalActions: true,
    auditRetentionDays: Math.max(365, Number(process.env.REVENUE_OS_AUDIT_RETENTION_DAYS || 2555)),
  }
}

export const REVENUE_OS_ENV_EXAMPLE = `# ANGELCARE Revenue Command OS — Trusted Operator Live Production
REVENUE_OS_ENABLED=true
REVENUE_OS_ENVIRONMENT=production
REVENUE_OS_EXECUTION_MODE=live
REVENUE_OS_ALLOW_EXTERNAL_ACTIONS=true
REVENUE_OS_AUDIT_RETENTION_DAYS=2555
`
