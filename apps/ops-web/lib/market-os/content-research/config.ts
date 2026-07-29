import type { JsonRecord } from './types'

function bool(value: string | undefined, fallback: boolean) {
  if (value == null || value.trim() === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function integer(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function text(value: string | undefined, fallback: string) {
  return value?.trim() || fallback
}

export function getContentResearchConfig() {
  return {
    enabled: bool(process.env.MARKET_OS_RESEARCH_ENABLED, true),
    primarySearchProvider: text(process.env.MARKET_OS_RESEARCH_PRIMARY_PROVIDER, 'tavily'),
    fallbackSearchProvider: text(process.env.MARKET_OS_RESEARCH_FALLBACK_PROVIDER, 'searxng'),
    analysisProvider: text(process.env.MARKET_OS_ANALYSIS_PROVIDER, 'openrouter'),
    sourceAuthority: text(process.env.MARKET_OS_SOURCE_AUTHORITY, 'ac_capital'),
    cronSecret: process.env.MARKET_OS_RESEARCH_CRON_SECRET || process.env.MARKETING_AI_CRON_SECRET || '',
    maxDueRunsPerCycle: integer(process.env.MARKET_OS_RESEARCH_MAX_DUE_RUNS_PER_CYCLE, 4, 1, 12),

    tavily: {
      apiKey: process.env.TAVILY_API_KEY || '',
      baseUrl: text(process.env.TAVILY_BASE_URL, 'https://api.tavily.com'),
      projectId: text(process.env.TAVILY_PROJECT, 'angelcare-market-os-content-command'),
      searchDepth: text(process.env.TAVILY_SEARCH_DEPTH, 'basic'),
      maxResults: integer(process.env.TAVILY_MAX_RESULTS, 10, 1, 20),
      timeoutMs: integer(process.env.TAVILY_TIMEOUT_MS, 15000, 3000, 60000),
      maxRetries: integer(process.env.TAVILY_MAX_RETRIES, 1, 0, 4),
    },

    searxng: {
      enabled: bool(process.env.SEARXNG_ENABLED, false),
      baseUrl: process.env.SEARXNG_BASE_URL?.trim() || '',
      searchPath: text(process.env.SEARXNG_SEARCH_PATH, '/search'),
      responseFormat: text(process.env.SEARXNG_RESPONSE_FORMAT, 'json'),
      language: text(process.env.SEARXNG_LANGUAGE, 'fr-FR'),
      safeSearch: integer(process.env.SEARXNG_SAFESEARCH, 1, 0, 2),
      timeoutMs: integer(process.env.SEARXNG_TIMEOUT_MS, 20000, 3000, 60000),
    },

    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: text(process.env.OPENROUTER_BASE_URL, 'https://openrouter.ai/api/v1'),
      model: text(process.env.OPENROUTER_MODEL, 'openrouter/free'),
      appName: text(process.env.OPENROUTER_APP_NAME, 'ANGELCARE Market OS Content Command'),
      httpReferer: process.env.OPENROUTER_HTTP_REFERER?.trim() || '',
      timeoutMs: integer(process.env.MARKET_OS_ANALYSIS_TIMEOUT_MS, 120000, 10000, 300000),
      maxOutputTokens: integer(process.env.OPENROUTER_MAX_OUTPUT_TOKENS, 5000, 512, 16000),
    },

    automation: {
      internalEnabled: bool(process.env.MARKET_OS_INTERNAL_AUTOMATION_ENABLED, true),
      automaticSourceCreation: bool(process.env.MARKET_OS_AUTOMATIC_SOURCE_CREATION, true),
      automaticOpportunityCreation: bool(process.env.MARKET_OS_AUTOMATIC_OPPORTUNITY_CREATION, true),
      automaticInternalTaskCreation: bool(process.env.MARKET_OS_AUTOMATIC_INTERNAL_TASK_CREATION, true),
      humanApprovalBoundary: text(process.env.MARKET_OS_HUMAN_APPROVAL_BOUNDARY, 'external_only'),
      externalActionsAllowed: false as const,
    },

    resilience: {
      researchTimeoutMs: integer(process.env.MARKET_OS_RESEARCH_TIMEOUT_MS, 60000, 5000, 180000),
      maxSourcesPerRun: integer(process.env.MARKET_OS_MAX_SOURCES_PER_RUN, 30, 1, 100),
      maxOpportunitiesPerRun: integer(process.env.MARKET_OS_MAX_OPPORTUNITIES_PER_RUN, 20, 1, 50),
      schemaRepairAttempts: integer(process.env.MARKET_OS_SCHEMA_REPAIR_ATTEMPTS, 1, 0, 2),
    },
  }
}

export function contentResearchCredentialState() {
  const config = getContentResearchConfig()
  return {
    tavilyPresent: Boolean(config.tavily.apiKey),
    openrouterPresent: Boolean(config.openrouter.apiKey),
    searxngConfigured: Boolean(config.searxng.enabled && config.searxng.baseUrl),
  }
}

export function assertContentResearchConfigured() {
  const config = getContentResearchConfig()
  if (!config.enabled) throw new Error('CONTENT_RESEARCH_DISABLED')
  if (!config.tavily.apiKey) throw new Error('TAVILY_API_KEY_MISSING')
  if (!config.openrouter.apiKey) throw new Error('OPENROUTER_API_KEY_MISSING')
  return config
}

export function publicContentResearchDefaults(): JsonRecord {
  const config = getContentResearchConfig()
  return {
    searchPrimary: config.primarySearchProvider,
    searchFallback: config.searxng.enabled ? config.fallbackSearchProvider : 'disabled',
    analysisProvider: config.analysisProvider,
    analysisModel: config.openrouter.model,
    sourceAuthority: config.sourceAuthority,
    humanApprovalBoundary: config.automation.humanApprovalBoundary,
    externalActionsAllowed: false,
  }
}
