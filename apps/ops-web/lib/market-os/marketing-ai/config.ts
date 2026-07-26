import type { MarketingAiAuthorityMode } from './types'

function bool(value: string | undefined, fallback: boolean) {
  if (value == null || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function integer(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

export function getMarketingAiConfig() {
  const primaryModel = process.env.MARKETING_AI_PRIMARY_MODEL || process.env.GEMINI_PRIMARY_MODEL || 'gemini-3.6-flash'
  const fallbackModel = process.env.MARKETING_AI_FALLBACK_MODEL || process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite'
  return {
    enabled: bool(process.env.MARKETING_AI_ENABLED, true),
    apiKey: process.env.GEMINI_API_KEY || '',
    primaryModel,
    fallbackModel,
    maxOutputTokens: integer(process.env.MARKETING_AI_MAX_OUTPUT_TOKENS, 8192, 1024, 32768),
    timeoutMs: integer(process.env.MARKETING_AI_TIMEOUT_MS, 120000, 10000, 300000),
    maxCommandsPerMission: integer(process.env.MARKETING_AI_MAX_COMMANDS_PER_MISSION, 12, 1, 50),
    maxDueRunsPerBatch: integer(process.env.MARKETING_AI_MAX_DUE_RUNS_PER_BATCH, 8, 1, 30),
    maxRunsPerHour: integer(process.env.MARKETING_AI_MAX_RUNS_PER_HOUR, 30, 1, 500),
    maxTokensPerDay: integer(process.env.MARKETING_AI_MAX_TOKENS_PER_DAY, 500000, 10000, 10000000),
    searchGroundingEnabled: bool(process.env.MARKETING_AI_SEARCH_GROUNDING_ENABLED, true),
    externalActionsAllowed: false as const,
    bridgeStorageEnabled: bool(process.env.MARKETING_AI_BRIDGE_STORAGE_ENABLED, true),
    bridgeModuleKey: process.env.MARKETING_AI_BRIDGE_MODULE_KEY || 'market_os_content_command',
    deterministicFallbackEnabled: bool(process.env.MARKETING_AI_DETERMINISTIC_FALLBACK_ENABLED, false),
    cronSecret: process.env.MARKETING_AI_CRON_SECRET || '',
    defaultAuthorityMode: (process.env.MARKETING_AI_DEFAULT_AUTHORITY_MODE || 'prepare') as MarketingAiAuthorityMode,
    monthlyResourceDomains: (process.env.MARKETING_AI_MONTHLY_RESOURCE_DOMAINS || 'ai.google.dev,thinkwithgoogle.com,developers.google.com/search,facebook.com/business,linkedin.com/business,tiktok.com/business').split(',').map((value) => value.trim()).filter(Boolean),
  }
}

export function assertMarketingAiConfigured() {
  const config = getMarketingAiConfig()
  if (!config.enabled) throw new Error('MARKETING_AI_DISABLED')
  if (!config.apiKey) throw new Error('GEMINI_API_KEY_MISSING')
  return config
}
