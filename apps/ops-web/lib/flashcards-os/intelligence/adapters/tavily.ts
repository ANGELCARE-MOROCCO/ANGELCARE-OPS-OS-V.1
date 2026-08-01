import 'server-only'

import { createHash } from 'node:crypto'
import { intelligenceEnvironment } from '@/lib/flashcards-os/intelligence/config'

export type TavilySearchInput = {
  query: string
  searchDepth?: 'basic' | 'advanced'
  maxResults?: number
  includeDomains?: string[]
  excludeDomains?: string[]
  startDate?: string
  endDate?: string
  country?: string
  includeRawContent?: boolean
}

export type TavilySearchResult = {
  title: string
  url: string
  content: string
  rawContent: string | null
  score: number
  publishedDate: string | null
  favicon: string | null
}

export type TavilySearchResponse = {
  query: string
  answer: string | null
  results: TavilySearchResult[]
  requestId: string | null
  responseTimeSeconds: number | null
  credits: number
}

export type TavilyExtractResponse = {
  results: Array<{ url: string; rawContent: string; images: string[]; favicon: string | null }>
  failedResults: Array<{ url: string; error?: string }>
  requestId: string | null
  credits: number
}

export class TavilyAdapterError extends Error {
  readonly code: string
  readonly status: number
  readonly retryAfterSeconds: number | null

  constructor(message: string, options: { code?: string; status?: number; retryAfterSeconds?: number | null } = {}) {
    super(message)
    this.name = 'TavilyAdapterError'
    this.code = options.code || 'TAVILY_ADAPTER_ERROR'
    this.status = options.status || 500
    this.retryAfterSeconds = options.retryAfterSeconds ?? null
  }
}

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function domainFromUrl(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase() } catch { return '' }
}

export function tavilyContentHash(input: { url: string; content: string }) {
  return createHash('sha256').update(`${domainFromUrl(input.url)}\n${input.url}\n${input.content}`).digest('hex')
}

async function tavilyRequest<T>(endpoint: string, body: Record<string, unknown>, timeoutOverride?: number): Promise<T> {
  const env = intelligenceEnvironment()
  if (!env.tavily.apiKey) throw new TavilyAdapterError('TAVILY_API_KEY is not configured.', { code: 'TAVILY_NOT_CONFIGURED', status: 503 })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutOverride || env.tavily.timeoutMs)
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${env.tavily.apiKey}`,
      'Content-Type': 'application/json',
    }
    if (env.tavily.projectId) headers['X-Project-ID'] = env.tavily.projectId

    const response = await fetch(`${env.tavily.baseUrl}/${endpoint.replace(/^\//, '')}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok) {
      const message = typeof payload.detail === 'string'
        ? payload.detail
        : typeof payload.message === 'string'
          ? payload.message
          : `Tavily request failed with HTTP ${response.status}.`
      throw new TavilyAdapterError(message, {
        code: `TAVILY_HTTP_${response.status}`,
        status: response.status,
        retryAfterSeconds: safeNumber(response.headers.get('retry-after'), 0) || null,
      })
    }
    return payload as T
  } catch (error) {
    if (error instanceof TavilyAdapterError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TavilyAdapterError('Tavily request timed out.', { code: 'TAVILY_TIMEOUT', status: 408 })
    }
    throw new TavilyAdapterError(error instanceof Error ? error.message : 'Unknown Tavily network error.', { code: 'TAVILY_NETWORK_ERROR', status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}

export async function tavilySearch(input: TavilySearchInput): Promise<TavilySearchResponse> {
  const env = intelligenceEnvironment()
  const payload = await tavilyRequest<Record<string, any>>('search', {
    query: input.query,
    search_depth: input.searchDepth || 'basic',
    max_results: Math.min(20, Math.max(1, input.maxResults || env.tavily.defaultMaxResults)),
    include_domains: input.includeDomains?.slice(0, 300) || [],
    exclude_domains: input.excludeDomains?.slice(0, 150) || [],
    include_answer: false,
    include_raw_content: input.includeRawContent ? 'markdown' : false,
    include_images: false,
    include_favicon: true,
    ...(input.startDate ? { start_date: input.startDate } : {}),
    ...(input.endDate ? { end_date: input.endDate } : {}),
    ...(input.country ? { country: input.country } : {}),
  })

  const results = Array.isArray(payload.results) ? payload.results : []
  return {
    query: String(payload.query || input.query),
    answer: typeof payload.answer === 'string' ? payload.answer : null,
    results: results.map((item: Record<string, unknown>) => ({
      title: String(item.title || 'Source sans titre'),
      url: String(item.url || ''),
      content: String(item.content || ''),
      rawContent: typeof item.raw_content === 'string' ? item.raw_content : null,
      score: safeNumber(item.score),
      publishedDate: typeof item.published_date === 'string' ? item.published_date : null,
      favicon: typeof item.favicon === 'string' ? item.favicon : null,
    })).filter((item: TavilySearchResult) => item.url),
    requestId: typeof payload.request_id === 'string' ? payload.request_id : null,
    responseTimeSeconds: payload.response_time == null ? null : safeNumber(payload.response_time),
    credits: safeNumber(payload.usage?.credits, input.searchDepth === 'advanced' ? 2 : 1),
  }
}

export async function tavilyExtract(urls: string[], options: { query?: string; depth?: 'basic' | 'advanced'; includeImages?: boolean } = {}): Promise<TavilyExtractResponse> {
  if (!urls.length) return { results: [], failedResults: [], requestId: null, credits: 0 }
  const payload = await tavilyRequest<Record<string, any>>('extract', {
    urls: urls.slice(0, 20),
    extract_depth: options.depth || 'basic',
    format: 'markdown',
    include_images: Boolean(options.includeImages),
    include_favicon: true,
    include_usage: true,
    ...(options.query ? { query: options.query, chunks_per_source: 5 } : {}),
  })
  return {
    results: (Array.isArray(payload.results) ? payload.results : []).map((item: Record<string, unknown>) => ({
      url: String(item.url || ''),
      rawContent: String(item.raw_content || ''),
      images: Array.isArray(item.images) ? item.images.map(String) : [],
      favicon: typeof item.favicon === 'string' ? item.favicon : null,
    })),
    failedResults: (Array.isArray(payload.failed_results) ? payload.failed_results : []).map((item: Record<string, unknown>) => ({
      url: String(item.url || ''),
      error: typeof item.error === 'string' ? item.error : undefined,
    })),
    requestId: typeof payload.request_id === 'string' ? payload.request_id : null,
    credits: safeNumber(payload.usage?.credits),
  }
}

export async function tavilyMap(baseUrl: string, options: { instructions?: string; maxDepth?: number; maxBreadth?: number; limit?: number; excludePaths?: string[] } = {}) {
  return tavilyRequest<Record<string, unknown>>('map', {
    url: baseUrl,
    ...(options.instructions ? { instructions: options.instructions } : {}),
    max_depth: Math.min(5, Math.max(1, options.maxDepth || 2)),
    max_breadth: Math.min(500, Math.max(1, options.maxBreadth || 20)),
    limit: Math.max(1, options.limit || 50),
    exclude_paths: options.excludePaths || [],
  }, 150_000)
}

export async function tavilyCrawl(baseUrl: string, options: { instructions?: string; maxDepth?: number; maxBreadth?: number; limit?: number; selectPaths?: string[]; excludePaths?: string[] } = {}) {
  return tavilyRequest<Record<string, unknown>>('crawl', {
    url: baseUrl,
    ...(options.instructions ? { instructions: options.instructions } : {}),
    max_depth: Math.min(5, Math.max(1, options.maxDepth || 2)),
    max_breadth: Math.min(500, Math.max(1, options.maxBreadth || 20)),
    limit: Math.max(1, options.limit || 50),
    select_paths: options.selectPaths || [],
    exclude_paths: options.excludePaths || [],
    extract_depth: 'advanced',
    format: 'markdown',
    include_images: false,
    include_favicon: true,
  }, 150_000)
}
