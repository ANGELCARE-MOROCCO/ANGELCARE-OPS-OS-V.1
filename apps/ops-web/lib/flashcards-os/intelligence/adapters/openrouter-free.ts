import 'server-only'

import { intelligenceEnvironment, OPENROUTER_FREE_ROUTE } from '@/lib/flashcards-os/intelligence/config'

export type FreeOpenRouterMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type FreeOpenRouterResult = {
  rawContent: string
  responseId: string | null
  requestedRoute: typeof OPENROUTER_FREE_ROUTE
  actualModel: string | null
  providerName: string | null
  promptTokens: number
  completionTokens: number
  totalTokens: number
  providerReportedCostUsd: number
  latencyMs: number
  attemptCount: number
}

export class FreeOpenRouterError extends Error {
  readonly code: string
  readonly status: number
  readonly retryAfterSeconds: number | null
  readonly providerPayload: unknown

  constructor(message: string, options: { code?: string; status?: number; retryAfterSeconds?: number | null; providerPayload?: unknown } = {}) {
    super(message)
    this.name = 'FreeOpenRouterError'
    this.code = options.code || 'OPENROUTER_FREE_ERROR'
    this.status = options.status || 500
    this.retryAfterSeconds = options.retryAfterSeconds ?? null
    this.providerPayload = options.providerPayload
  }
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function extractJsonFromProviderText(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed) throw new FreeOpenRouterError('OpenRouter Free returned an empty response.', { code: 'OPENROUTER_FREE_EMPTY_RESPONSE', status: 502 })

  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try { return JSON.parse(withoutFence) } catch {
    const firstBrace = withoutFence.indexOf('{')
    const lastBrace = withoutFence.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try { return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1)) } catch { /* visible error below */ }
    }
  }

  throw new FreeOpenRouterError(
    'OpenRouter Free returned a response that is not valid JSON. No synthetic or hidden fallback was produced.',
    { code: 'OPENROUTER_FREE_INVALID_JSON', status: 502, providerPayload: { preview: withoutFence.slice(0, 1000) } },
  )
}

export async function openRouterFreeCompletion(input: {
  taskProfile: string
  messages: FreeOpenRouterMessage[]
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
  retryLimit?: number
  jsonSchema?: Record<string, unknown>
  metadata?: Record<string, string>
}): Promise<FreeOpenRouterResult> {
  const env = intelligenceEnvironment()
  if (!env.openrouter.apiKey) {
    throw new FreeOpenRouterError('OPENROUTER_API_KEY is not configured.', { code: 'OPENROUTER_NOT_CONFIGURED', status: 503 })
  }

  const timeoutMs = Math.min(180_000, Math.max(10_000, input.timeoutMs || env.openrouter.timeoutMs))
  const retryLimit = Math.min(5, Math.max(0, input.retryLimit ?? env.governance.maximumRetries))
  const schemaInstruction = input.jsonSchema
    ? `\n\nReturn only one JSON object matching this exact schema. Do not use markdown fences.\n${JSON.stringify(input.jsonSchema)}`
    : ''
  const messages = input.messages.map((message, index) => index === 0 && message.role === 'system'
    ? { ...message, content: `${message.content}${schemaInstruction}` }
    : message)

  let lastError: unknown = null
  for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const startedAt = Date.now()
    try {
      const response = await fetch(`${env.openrouter.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.openrouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': env.openrouter.siteUrl,
          'X-Title': env.openrouter.appName,
        },
        body: JSON.stringify({
          model: OPENROUTER_FREE_ROUTE,
          messages,
          temperature: Math.min(2, Math.max(0, input.temperature ?? 0.2)),
          max_tokens: Math.min(50_000, Math.max(64, input.maxOutputTokens || 6000)),
          stream: false,
          // No named model list and no restrictive provider filter are sent.
          // OpenRouter's free router chooses an available zero-cost model and
          // returns the concrete model, which Flashcards OS records visibly.
          provider: { allow_fallbacks: true },
          metadata: {
            application: 'angelcare-flashcards-os',
            free_only: 'true',
            requested_route: OPENROUTER_FREE_ROUTE,
            task_profile: input.taskProfile,
            ...input.metadata,
          },
        }),
        signal: controller.signal,
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => ({})) as Record<string, any>
      if (!response.ok) {
        const message = typeof payload.error?.message === 'string'
          ? payload.error.message
          : `OpenRouter Free request failed with HTTP ${response.status}.`
        throw new FreeOpenRouterError(message, {
          code: response.status === 429 ? 'OPENROUTER_FREE_RATE_LIMITED' : `OPENROUTER_FREE_HTTP_${response.status}`,
          status: response.status,
          retryAfterSeconds: number(response.headers.get('retry-after'), 0) || null,
          providerPayload: payload,
        })
      }

      const rawContent = String(payload.choices?.[0]?.message?.content || '')
      if (!rawContent.trim()) {
        throw new FreeOpenRouterError('OpenRouter Free returned an empty response.', {
          code: 'OPENROUTER_FREE_EMPTY_RESPONSE',
          status: 502,
          providerPayload: payload,
        })
      }
      const usage = payload.usage || {}
      const providerName = typeof payload.openrouter_metadata?.provider_name === 'string'
        ? payload.openrouter_metadata.provider_name
        : typeof payload.provider === 'string'
          ? payload.provider
          : null

      return {
        rawContent,
        responseId: typeof payload.id === 'string' ? payload.id : null,
        requestedRoute: OPENROUTER_FREE_ROUTE,
        actualModel: typeof payload.model === 'string' ? payload.model : null,
        providerName,
        promptTokens: number(usage.prompt_tokens),
        completionTokens: number(usage.completion_tokens),
        totalTokens: number(usage.total_tokens),
        providerReportedCostUsd: number(usage.cost ?? usage.cost_details?.upstream_inference_cost),
        latencyMs: Date.now() - startedAt,
        attemptCount: attempt + 1,
      }
    } catch (error) {
      lastError = error
      const typed = error as FreeOpenRouterError
      const retryable = error instanceof FreeOpenRouterError
        ? [408, 429, 500, 502, 503, 504].includes(error.status)
        : error instanceof Error && error.name === 'AbortError'
      if (!retryable || attempt >= retryLimit) break
      const retryAfterMs = typed.retryAfterSeconds ? typed.retryAfterSeconds * 1000 : Math.min(4000, 400 * 2 ** attempt)
      await sleep(retryAfterMs)
    } finally {
      clearTimeout(timeout)
    }
  }

  if (lastError instanceof FreeOpenRouterError) throw lastError
  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new FreeOpenRouterError('OpenRouter Free request timed out.', { code: 'OPENROUTER_FREE_TIMEOUT', status: 408 })
  }
  throw new FreeOpenRouterError(
    lastError instanceof Error ? lastError.message : 'Unknown OpenRouter Free network error.',
    { code: 'OPENROUTER_FREE_NETWORK_ERROR', status: 502 },
  )
}
