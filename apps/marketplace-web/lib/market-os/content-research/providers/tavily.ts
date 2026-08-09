import { getContentResearchConfig } from '../config'
import type { TavilySearchResponse } from '../types'

export type TavilySearchInput = {
  query: string
  searchDepth: string
  maxResults: number
  includeAnswer: boolean
  includeRawContent: boolean
  topic: string
  country: string
  timeRange: string
  includeDomains: string[]
  excludeDomains: string[]
}

function providerError(status: number, payload: unknown) {
  const message = typeof payload === 'object' && payload
    ? String((payload as { detail?: string; message?: string; error?: string }).detail
      || (payload as { message?: string }).message
      || (payload as { error?: string }).error
      || `TAVILY_HTTP_${status}`)
    : `TAVILY_HTTP_${status}`
  const error = new Error(message)
  Object.assign(error, { provider: 'tavily', status, retryable: status === 408 || status === 429 || status >= 500 })
  return error
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

export async function searchTavily(input: TavilySearchInput): Promise<TavilySearchResponse> {
  const config = getContentResearchConfig()
  if (!config.tavily.apiKey) throw new Error('TAVILY_API_KEY_MISSING')

  const endpoint = `${config.tavily.baseUrl.replace(/\/$/, '')}/search`
  let lastError: unknown = null

  for (let attempt = 0; attempt <= config.tavily.maxRetries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.tavily.apiKey}`,
          'Content-Type': 'application/json',
          'X-Project-ID': config.tavily.projectId,
        },
        body: JSON.stringify({
          query: input.query,
          search_depth: input.searchDepth,
          max_results: input.maxResults,
          include_answer: input.includeAnswer,
          include_raw_content: input.includeRawContent,
          topic: input.topic,
          country: input.country || undefined,
          time_range: input.timeRange || undefined,
          include_domains: input.includeDomains.length ? input.includeDomains : undefined,
          exclude_domains: input.excludeDomains.length ? input.excludeDomains : undefined,
          include_images: false,
          include_favicon: true,
        }),
      }, config.tavily.timeoutMs)

      const payload = await response.json().catch(() => ({})) as Record<string, unknown>
      if (!response.ok) throw providerError(response.status, payload)

      const results = Array.isArray(payload.results) ? payload.results : []
      return {
        query: String(payload.query || input.query),
        results: results.flatMap((item) => {
          if (!item || typeof item !== 'object') return []
          const row = item as Record<string, unknown>
          const url = String(row.url || '').trim()
          const title = String(row.title || '').trim()
          if (!url || !title) return []
          return [{
            title,
            url,
            content: String(row.content || ''),
            score: Number(row.score || 0),
            rawContent: row.raw_content == null ? null : String(row.raw_content),
            favicon: row.favicon == null ? null : String(row.favicon),
          }]
        }),
        requestId: payload.request_id ? String(payload.request_id) : null,
        credits: Number((payload.usage as { credits?: unknown } | undefined)?.credits || 1),
        responseTime: payload.response_time == null ? null : Number(payload.response_time),
      }
    } catch (error) {
      lastError = error
      const retryable = Boolean((error as { retryable?: boolean }).retryable) || (error instanceof Error && error.name === 'AbortError')
      if (!retryable || attempt >= config.tavily.maxRetries) break
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)))
    }
  }

  if (lastError instanceof Error && lastError.name === 'AbortError') throw new Error('TAVILY_TIMEOUT')
  throw lastError instanceof Error ? lastError : new Error('TAVILY_SEARCH_FAILED')
}

export async function getTavilyUsage() {
  const config = getContentResearchConfig()
  if (!config.tavily.apiKey) return { available: false, configured: false, error: 'TAVILY_API_KEY_MISSING' }
  try {
    const response = await fetchWithTimeout(`${config.tavily.baseUrl.replace(/\/$/, '')}/usage`, {
      headers: {
        Authorization: `Bearer ${config.tavily.apiKey}`,
        'X-Project-ID': config.tavily.projectId,
      },
    }, Math.min(config.tavily.timeoutMs, 15000))
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok) throw providerError(response.status, payload)
    return { available: true, configured: true, usage: payload }
  } catch (error) {
    return { available: false, configured: true, error: error instanceof Error ? error.message : 'TAVILY_HEALTH_FAILED' }
  }
}
