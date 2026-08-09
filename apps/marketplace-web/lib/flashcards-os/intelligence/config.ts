import 'server-only'

function positiveInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

export const INTELLIGENCE_TENANT_KEY = 'angelcare-internal'
export const INTELLIGENCE_VIEW_PREFIX = 'fc_os_'
export const OPENROUTER_FREE_ROUTE = 'openrouter/free' as const

/**
 * Free-only provider contract.
 *
 * Tavily has no model setting: it acquires public web evidence.
 * OpenRouter always receives the single free router identifier. The concrete
 * free model selected by OpenRouter is returned by the provider and recorded
 * in the run ledger; Flashcards OS never maintains a hidden named-model list.
 */
export function intelligenceEnvironment() {
  return {
    tavily: {
      apiKey: process.env.TAVILY_API_KEY?.trim() || '',
      projectId: process.env.TAVILY_PROJECT_ID?.trim() || process.env.TAVILY_PROJECT?.trim() || '',
      baseUrl: (process.env.TAVILY_BASE_URL?.trim() || 'https://api.tavily.com').replace(/\/$/, ''),
      timeoutMs: positiveInteger(process.env.FLASHCARDS_OS_TAVILY_TIMEOUT_MS, 45_000, 5_000, 150_000),
      defaultMaxResults: positiveInteger(process.env.FLASHCARDS_OS_TAVILY_MAX_RESULTS, 8, 1, 20),
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY?.trim() || '',
      baseUrl: (process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
      appName: process.env.OPENROUTER_APP_NAME?.trim() || 'ANGELCARE Flashcards OS',
      siteUrl: process.env.OPENROUTER_SITE_URL?.trim() || 'https://angelcarehub.com',
      timeoutMs: positiveInteger(process.env.FLASHCARDS_OS_OPENROUTER_TIMEOUT_MS, 120_000, 10_000, 180_000),
      route: OPENROUTER_FREE_ROUTE,
    },
    governance: {
      maximumMissionCredits: positiveInteger(process.env.FLASHCARDS_OS_MAX_MISSION_CREDITS, 40, 1, 1000),
      maximumRetries: positiveInteger(process.env.FLASHCARDS_OS_INTELLIGENCE_MAX_RETRIES, 2, 0, 5),
      workerSecret: process.env.FLASHCARDS_OS_INTELLIGENCE_WORKER_SECRET?.trim() || '',
    },
  }
}

export function providerConfigurationStatus() {
  const env = intelligenceEnvironment()
  return {
    freeOnly: true as const,
    tavilyConfigured: Boolean(env.tavily.apiKey),
    tavilyProjectConfigured: Boolean(env.tavily.projectId),
    openrouterConfigured: Boolean(env.openrouter.apiKey),
    openrouterRoute: OPENROUTER_FREE_ROUTE,
    workerConfigured: Boolean(env.governance.workerSecret),
  }
}
