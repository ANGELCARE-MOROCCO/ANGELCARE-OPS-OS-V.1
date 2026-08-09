import 'server-only'

import { parseStructuredJson, schemaForTask, validateStructuredOutput } from '@/lib/flashcards-os/intelligence/schemas'
import { assertSafeForExternalProvider } from '@/lib/flashcards-os/intelligence/privacy'
import { extractJsonFromProviderText, FreeOpenRouterError, openRouterFreeCompletion } from '@/lib/flashcards-os/intelligence/adapters/openrouter-free'
import type { ModelProfile } from '@/lib/flashcards-os/intelligence/types'

export type OpenRouterMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type OpenRouterStructuredResult = {
  data: Record<string, unknown>
  rawContent: string
  responseId: string | null
  modelRequested: string
  modelUsed: string | null
  fallbackUsed: boolean
  providerName: string | null
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
  latencyMs: number
  attemptCount: number
  redactionFindings: Array<{ category: string; count: number; blocked: boolean; description: string }>
}

export class OpenRouterAdapterError extends FreeOpenRouterError {
  constructor(message: string, options: { code?: string; status?: number; retryAfterSeconds?: number | null; providerPayload?: unknown } = {}) {
    super(message, options)
    this.name = 'OpenRouterAdapterError'
  }
}

function cleanMessages(messages: OpenRouterMessage[]) {
  const findings: OpenRouterStructuredResult['redactionFindings'] = []
  const cleaned = messages.map((message) => {
    const result = assertSafeForExternalProvider(message.content)
    findings.push(...result.findings)
    return { ...message, content: result.safeText }
  })
  return { messages: cleaned, findings }
}

export async function openRouterStructuredCompletion(input: {
  taskProfile: string
  profile: ModelProfile
  messages: OpenRouterMessage[]
  metadata?: Record<string, string>
}): Promise<OpenRouterStructuredResult> {
  const { messages, findings } = cleanMessages(input.messages)
  const schema = schemaForTask(input.taskProfile)

  try {
    const result = await openRouterFreeCompletion({
      taskProfile: input.taskProfile,
      messages,
      temperature: input.profile.temperature,
      maxOutputTokens: input.profile.maxOutputTokens,
      timeoutMs: input.profile.timeoutMs,
      retryLimit: input.profile.retryLimit,
      jsonSchema: schema.schema as Record<string, unknown>,
      metadata: input.metadata,
    })
    const parsed = extractJsonFromProviderText(result.rawContent)
    const structured = parseStructuredJson(JSON.stringify(parsed))
    const validated = validateStructuredOutput(input.taskProfile, structured) as Record<string, unknown>

    return {
      data: validated,
      rawContent: result.rawContent,
      responseId: result.responseId,
      modelRequested: result.requestedRoute,
      modelUsed: result.actualModel,
      // The application has no hidden named-model fallback list. OpenRouter's
      // free router selection is recorded in modelUsed rather than disguised
      // as an application fallback.
      fallbackUsed: false,
      providerName: result.providerName,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      costUsd: result.providerReportedCostUsd,
      latencyMs: result.latencyMs,
      attemptCount: result.attemptCount,
      redactionFindings: findings,
    }
  } catch (error) {
    if (error instanceof OpenRouterAdapterError) throw error
    if (error instanceof FreeOpenRouterError) {
      throw new OpenRouterAdapterError(error.message, {
        code: error.code,
        status: error.status,
        retryAfterSeconds: error.retryAfterSeconds,
        providerPayload: error.providerPayload,
      })
    }
    throw new OpenRouterAdapterError(error instanceof Error ? error.message : 'Unknown OpenRouter Free error.', {
      code: 'OPENROUTER_FREE_UNEXPECTED_ERROR',
      status: 502,
    })
  }
}
