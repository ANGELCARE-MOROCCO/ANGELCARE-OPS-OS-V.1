import { failGovernedProvider, reconcileGovernedProvider } from '@/lib/ai-provider-control/governor'
import type { JsonRecord } from '@/lib/ai-provider-control/types'
import { AiRuntimeContinuityError, defaultRuntimeAlternatives } from './runtime-errors'
import { resolveMarketAiProvider } from './provider-route'
import type { ImageRuntimeResult, MarketAiCapability, RuntimeExecutionContext, RuntimeSource, StructuredRuntimeResult } from './types'

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return { signal: controller.signal, stop: () => clearTimeout(timer) }
}

function providerPolicy(requireParameters: boolean) {
  const only = (process.env.OPENROUTER_PROVIDER_ALLOWLIST || '').split(',').map((item) => item.trim()).filter(Boolean)
  return {
    allow_fallbacks: true,
    require_parameters: requireParameters,
    data_collection: 'deny',
    zdr: true,
    ...(only.length ? { only } : {}),
  }
}

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || process.env.NEXT_PUBLIC_APP_URL || 'https://angelcarehub.com',
    'X-OpenRouter-Title': 'ANGELCARE SANILA Market OS',
  }
}

function parseJsonContent(value: unknown) {
  const text = typeof value === 'string' ? value : ''
  const clean = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(clean) as JsonRecord
}

function usageOf(payload: Record<string, unknown>, started: number) {
  const usage = payload.usage && typeof payload.usage === 'object' ? payload.usage as Record<string, unknown> : {}
  const inputTokens = Number(usage.prompt_tokens || usage.input_tokens || 0)
  const outputTokens = Number(usage.completion_tokens || usage.output_tokens || 0)
  return { inputTokens, outputTokens, totalTokens: Number(usage.total_tokens || inputTokens + outputTokens), costUsd: Number(usage.cost || 0), latencyMs: Date.now() - started }
}

export async function openRouterStructured<T extends JsonRecord>(input: {
  capability: 'structured_reasoning' | 'structured_content'
  context: RuntimeExecutionContext
  systemInstruction: string
  payload: JsonRecord
  schema: JsonRecord
  schemaName: string
  sources?: RuntimeSource[]
  maxOutputTokens?: number
}): Promise<StructuredRuntimeResult<T>> {
  const route = await resolveMarketAiProvider({ capability: input.capability, context: input.context, estimatedRequests: 1, estimatedOutputTokens: input.maxOutputTokens || 8192 })
  const started = Date.now()
  const timeout = timeoutSignal(Number(process.env.OPENROUTER_TIMEOUT_MS || 120_000))
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers: headers(route.apiKey), signal: timeout.signal,
      body: JSON.stringify({
        model: route.model,
        messages: [
          { role: 'system', content: input.systemInstruction },
          { role: 'user', content: JSON.stringify({ ...input.payload, researchSources: input.sources || [] }) },
        ],
        temperature: 0.2,
        max_tokens: input.maxOutputTokens || 8192,
        response_format: { type: 'json_schema', json_schema: { name: input.schemaName, strict: true, schema: input.schema } },
        provider: providerPolicy(true),
      }),
    })
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok) throw new Error(`OPENROUTER_HTTP_${response.status}:${String((payload.error as Record<string, unknown> | undefined)?.message || 'REQUEST_FAILED')}`)
    const choices = Array.isArray(payload.choices) ? payload.choices as Array<Record<string, unknown>> : []
    const message = choices[0]?.message && typeof choices[0].message === 'object' ? choices[0].message as Record<string, unknown> : {}
    const result = parseJsonContent(message.content) as T
    const usage = usageOf(payload, started)
    await reconcileGovernedProvider(route.acquisition, { requestCount: 1, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, latencyMs: usage.latencyMs, httpStatus: 200, outcome: 'completed', commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, estimatedCostUsd: usage.costUsd, metadata: { provider: 'openrouter', model: payload.model || route.model, responseId: payload.id, sourceCount: input.sources?.length || 0 } })
    return { status: 'completed', result, providerType: 'openrouter', model: String(payload.model || route.model), usage, sources: input.sources || [], warnings: [], alternatives: [], rawResponseId: String(payload.id || '') || null }
  } catch (error) {
    await failGovernedProvider(route.acquisition, error, { latencyMs: Date.now() - started, commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, metadata: { provider: 'openrouter', capability: input.capability } })
    throw new AiRuntimeContinuityError({ code: 'OPENROUTER_STRUCTURED_FAILED', capability: input.capability, message: `L’exécution OpenRouter a échoué: ${error instanceof Error ? error.message : String(error)}. La mission peut être convertie en travail manuel ou réaffectée à un autre modèle.`, alternatives: defaultRuntimeAlternatives(input.capability) })
  } finally { timeout.stop() }
}

export async function openRouterVision<T extends JsonRecord>(input: {
  context: RuntimeExecutionContext
  instruction: string
  bytes: Uint8Array
  contentType: string
  schema: JsonRecord
  schemaName: string
  maxOutputTokens?: number
}): Promise<StructuredRuntimeResult<T>> {
  const route = await resolveMarketAiProvider({ capability: 'multimodal_analysis', context: input.context, estimatedRequests: 1, estimatedOutputTokens: input.maxOutputTokens || 4096 })
  const started = Date.now()
  const timeout = timeoutSignal(Number(process.env.OPENROUTER_TIMEOUT_MS || 120_000))
  try {
    const dataUrl = `data:${input.contentType || 'image/png'};base64,${Buffer.from(input.bytes).toString('base64')}`
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers: headers(route.apiKey), signal: timeout.signal,
      body: JSON.stringify({
        model: route.model,
        messages: [{ role: 'user', content: [{ type: 'text', text: input.instruction }, { type: 'image_url', image_url: { url: dataUrl } }] }],
        max_tokens: input.maxOutputTokens || 4096,
        temperature: 0.1,
        response_format: { type: 'json_schema', json_schema: { name: input.schemaName, strict: true, schema: input.schema } },
        provider: providerPolicy(true),
      }),
    })
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok) throw new Error(`OPENROUTER_VISION_HTTP_${response.status}:${String((payload.error as Record<string, unknown> | undefined)?.message || 'REQUEST_FAILED')}`)
    const choices = Array.isArray(payload.choices) ? payload.choices as Array<Record<string, unknown>> : []
    const message = choices[0]?.message && typeof choices[0].message === 'object' ? choices[0].message as Record<string, unknown> : {}
    const result = parseJsonContent(message.content) as T
    const usage = usageOf(payload, started)
    await reconcileGovernedProvider(route.acquisition, { requestCount: 1, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, latencyMs: usage.latencyMs, httpStatus: 200, outcome: 'completed', commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, estimatedCostUsd: usage.costUsd, metadata: { provider: 'openrouter', model: payload.model || route.model, responseId: payload.id } })
    return { status: 'completed', result, providerType: 'openrouter', model: String(payload.model || route.model), usage, sources: [], warnings: [], alternatives: [], rawResponseId: String(payload.id || '') || null }
  } catch (error) {
    await failGovernedProvider(route.acquisition, error, { latencyMs: Date.now() - started, commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, metadata: { provider: 'openrouter', capability: 'multimodal_analysis' } })
    throw new AiRuntimeContinuityError({ code: 'OPENROUTER_VISION_FAILED', capability: 'multimodal_analysis', message: `L’inspection visuelle OpenRouter a échoué: ${error instanceof Error ? error.message : String(error)}. La preuve reste disponible pour inspection humaine, remplacement ou réaffectation.`, alternatives: defaultRuntimeAlternatives('multimodal_analysis') })
  } finally { timeout.stop() }
}

export async function openRouterImage(input: {
  context: RuntimeExecutionContext
  prompt: string
  aspectRatio?: string
  quality?: string
  outputFormat?: 'png' | 'jpeg' | 'webp'
}): Promise<ImageRuntimeResult> {
  const route = await resolveMarketAiProvider({ capability: 'image_generation', context: input.context, estimatedRequests: 1 })
  if (!route.model) throw new AiRuntimeContinuityError({ code: 'IMAGE_MODEL_NOT_CONFIGURED', capability: 'image_generation', message: 'Aucun modèle de génération visuelle OpenRouter n’est configuré. Le dossier peut poursuivre avec un asset existant, un upload ou une tâche créative humaine.', alternatives: defaultRuntimeAlternatives('image_generation') })
  const started = Date.now()
  const timeout = timeoutSignal(Number(process.env.OPENROUTER_IMAGE_TIMEOUT_MS || 180_000))
  try {
    const response = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST', headers: headers(route.apiKey), signal: timeout.signal,
      body: JSON.stringify({ model: route.model, prompt: input.prompt, n: 1, aspect_ratio: input.aspectRatio || '1:1', quality: input.quality || 'high', output_format: input.outputFormat || 'png' }),
    })
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok) throw new Error(`OPENROUTER_IMAGE_HTTP_${response.status}:${String((payload.error as Record<string, unknown> | undefined)?.message || 'REQUEST_FAILED')}`)
    const rows = Array.isArray(payload.data) ? payload.data as Array<Record<string, unknown>> : []
    const encoded = typeof rows[0]?.b64_json === 'string' ? rows[0].b64_json : ''
    if (!encoded) throw new Error('OPENROUTER_IMAGE_EMPTY')
    const contentType = String(rows[0]?.media_type || `image/${input.outputFormat || 'png'}`)
    const usage = usageOf(payload, started)
    await reconcileGovernedProvider(route.acquisition, { requestCount: 1, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, latencyMs: usage.latencyMs, httpStatus: 200, outcome: 'completed', commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, estimatedCostUsd: usage.costUsd, metadata: { provider: 'openrouter', model: route.model, responseCreated: payload.created } })
    return { status: 'completed', providerType: 'openrouter', model: route.model, image: { bytes: new Uint8Array(Buffer.from(encoded, 'base64')), contentType }, usage, warnings: [], alternatives: [] }
  } catch (error) {
    await failGovernedProvider(route.acquisition, error, { latencyMs: Date.now() - started, commandCode: input.context.commandCode, actorId: input.context.actorId, missionId: input.context.missionId, metadata: { provider: 'openrouter', capability: 'image_generation' } })
    throw new AiRuntimeContinuityError({ code: 'OPENROUTER_IMAGE_FAILED', capability: 'image_generation', message: `La génération visuelle a échoué: ${error instanceof Error ? error.message : String(error)}. Le dossier reste ouvert pour upload, asset existant, autre fournisseur ou création humaine.`, alternatives: defaultRuntimeAlternatives('image_generation') })
  } finally { timeout.stop() }
}
