import { failGovernedProvider, reconcileGovernedProvider } from '@/lib/ai-provider-control/governor'
import { AiRuntimeContinuityError, defaultRuntimeAlternatives } from './runtime-errors'
import { resolveMarketAiProvider } from './provider-route'
import type { RuntimeExecutionContext, RuntimeSource } from './types'

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return { signal: controller.signal, stop: () => clearTimeout(timer) }
}

async function requestTavily(path: string, apiKey: string, body: Record<string, unknown>, timeoutMs: number) {
  const timeout = timeoutSignal(timeoutMs)
  try {
    const response = await fetch(`https://api.tavily.com${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Project-ID': process.env.TAVILY_PROJECT_ID || 'angelcare-market-os' },
      body: JSON.stringify(body),
      signal: timeout.signal,
    })
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok) throw new Error(`TAVILY_HTTP_${response.status}:${String(payload.detail || payload.error || 'REQUEST_FAILED')}`)
    return payload
  } finally { timeout.stop() }
}

export async function tavilySearch(input: {
  query: string
  context: RuntimeExecutionContext
  maxResults?: number
  searchDepth?: 'basic' | 'advanced' | 'fast' | 'ultra-fast'
  includeDomains?: string[]
  excludeDomains?: string[]
}) {
  const route = await resolveMarketAiProvider({ capability: 'web_research', context: input.context, estimatedRequests: 1 })
  const started = Date.now()
  try {
    const payload = await requestTavily('/search', route.apiKey, {
      query: input.query,
      search_depth: input.searchDepth || 'advanced',
      max_results: Math.min(20, Math.max(1, input.maxResults || 8)),
      include_answer: false,
      include_raw_content: false,
      include_domains: input.includeDomains?.length ? input.includeDomains : undefined,
      exclude_domains: input.excludeDomains?.length ? input.excludeDomains : undefined,
      country: 'morocco',
    }, Number(process.env.TAVILY_TIMEOUT_MS || 60_000))
    const rows = Array.isArray(payload.results) ? payload.results as Array<Record<string, unknown>> : []
    const observedAt = new Date().toISOString()
    const sources: RuntimeSource[] = rows.flatMap((row) => typeof row.url === 'string' && row.url ? [{
      title: String(row.title || row.url),
      url: row.url,
      content: typeof row.content === 'string' ? row.content : undefined,
      score: Number.isFinite(Number(row.score)) ? Number(row.score) : undefined,
      observedAt,
      sourceType: 'tavily_search' as const,
      freshness: 'live-search',
    }] : [])
    await reconcileGovernedProvider(route.acquisition, { requestCount: 1, groundedRequestCount: 1, latencyMs: Date.now() - started, httpStatus: 200, outcome: 'completed', commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, metadata: { provider: 'tavily', requestId: payload.request_id, credits: (payload.usage as Record<string, unknown> | undefined)?.credits, sourceCount: sources.length } })
    return { sources, requestId: String(payload.request_id || ''), usageCredits: Number((payload.usage as Record<string, unknown> | undefined)?.credits || 0), latencyMs: Date.now() - started }
  } catch (error) {
    await failGovernedProvider(route.acquisition, error, { latencyMs: Date.now() - started, commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, metadata: { provider: 'tavily' } })
    if (error instanceof AiRuntimeContinuityError) throw error
    throw new AiRuntimeContinuityError({ code: 'TAVILY_SEARCH_FAILED', capability: 'web_research', message: `La recherche Tavily a échoué: ${error instanceof Error ? error.message : String(error)}. Le travail peut continuer avec les sources déjà disponibles ou en mode manuel.`, alternatives: defaultRuntimeAlternatives('web_research') })
  }
}

export async function tavilyExtract(input: { urls: string[]; query?: string; context: RuntimeExecutionContext }) {
  const route = await resolveMarketAiProvider({ capability: 'source_extraction', context: input.context, estimatedRequests: 1 })
  const started = Date.now()
  try {
    const payload = await requestTavily('/extract', route.apiKey, {
      urls: input.urls.slice(0, 20),
      query: input.query || undefined,
      extract_depth: 'advanced',
      chunks_per_source: input.query ? 5 : undefined,
      format: 'markdown',
      include_usage: true,
    }, Number(process.env.TAVILY_TIMEOUT_MS || 60_000))
    const rows = Array.isArray(payload.results) ? payload.results as Array<Record<string, unknown>> : []
    const observedAt = new Date().toISOString()
    const sources: RuntimeSource[] = rows.flatMap((row) => typeof row.url === 'string' && row.url ? [{ title: row.url, url: row.url, content: typeof row.raw_content === 'string' ? row.raw_content : undefined, observedAt, sourceType: 'tavily_extract' as const, freshness: 'live-extract' }] : [])
    await reconcileGovernedProvider(route.acquisition, { requestCount: 1, groundedRequestCount: 1, latencyMs: Date.now() - started, httpStatus: 200, outcome: 'completed', commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, metadata: { provider: 'tavily', requestId: payload.request_id, sourceCount: sources.length } })
    return { sources, failedResults: Array.isArray(payload.failed_results) ? payload.failed_results : [], requestId: String(payload.request_id || ''), latencyMs: Date.now() - started }
  } catch (error) {
    await failGovernedProvider(route.acquisition, error, { latencyMs: Date.now() - started, commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, metadata: { provider: 'tavily' } })
    throw new AiRuntimeContinuityError({ code: 'TAVILY_EXTRACT_FAILED', capability: 'source_extraction', message: `L’extraction Tavily a échoué: ${error instanceof Error ? error.message : String(error)}. Les URL peuvent être jointes manuellement et le dossier peut continuer.`, alternatives: defaultRuntimeAlternatives('source_extraction') })
  }
}
