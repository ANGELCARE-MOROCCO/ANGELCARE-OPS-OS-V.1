import type { JsonRecord } from '@/lib/ai-provider-control/types'
import { AiRuntimeContinuityError, defaultRuntimeAlternatives, runtimeMessage } from './runtime-errors'
import { openRouterImage, openRouterStructured, openRouterVision } from './openrouter'
import { resolveMarketAiProvider } from './provider-route'
import { tavilySearch } from './tavily'
import type { ImageRuntimeResult, MarketAiCapability, RuntimeCapabilityStatus, RuntimeExecutionContext, RuntimeSource, StructuredRuntimeResult } from './types'

export async function executeStructuredContent<T extends JsonRecord>(input: {
  context: RuntimeExecutionContext
  systemInstruction: string
  payload: JsonRecord
  schema: JsonRecord
  schemaName: string
  researchQuery?: string
  maxOutputTokens?: number
}): Promise<StructuredRuntimeResult<T>> {
  const mode = input.context.continuationMode || 'auto'
  if (mode === 'manual') return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources: [], warnings: ['Mode manuel explicitement sélectionné.'], alternatives: defaultRuntimeAlternatives('structured_content') }

  let sources: RuntimeSource[] = []
  const warnings: string[] = []
  if (input.researchQuery && mode !== 'without_research') {
    try { sources = (await tavilySearch({ query: input.researchQuery, context: input.context, maxResults: 8, searchDepth: 'advanced' })).sources }
    catch (error) {
      if (mode === 'provider_only') throw error
      warnings.push(runtimeMessage(error))
    }
  }

  try {
    const result = await openRouterStructured<T>({ capability: 'structured_content', context: input.context, systemInstruction: input.systemInstruction, payload: input.payload, schema: input.schema, schemaName: input.schemaName, sources, maxOutputTokens: input.maxOutputTokens })
    result.warnings.push(...warnings)
    return result
  } catch (error) {
    if (mode === 'provider_only') throw error
    return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources, warnings: [...warnings, runtimeMessage(error)], alternatives: error instanceof AiRuntimeContinuityError ? error.alternatives : defaultRuntimeAlternatives('structured_content') }
  }
}

export async function executeMultimodalAnalysis<T extends JsonRecord>(input: { context: RuntimeExecutionContext; instruction: string; bytes: Uint8Array; contentType: string; schema: JsonRecord; schemaName: string; maxOutputTokens?: number }): Promise<StructuredRuntimeResult<T>> {
  if (input.context.continuationMode === 'manual') return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources: [], warnings: ['Inspection humaine sélectionnée.'], alternatives: defaultRuntimeAlternatives('multimodal_analysis') }
  try { return await openRouterVision<T>(input) }
  catch (error) {
    if (input.context.continuationMode === 'provider_only') throw error
    return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources: [], warnings: [runtimeMessage(error)], alternatives: error instanceof AiRuntimeContinuityError ? error.alternatives : defaultRuntimeAlternatives('multimodal_analysis') }
  }
}

export async function executeImageGeneration(input: { context: RuntimeExecutionContext; prompt: string; aspectRatio?: string; quality?: string; outputFormat?: 'png'|'jpeg'|'webp' }): Promise<ImageRuntimeResult> {
  if (input.context.continuationMode === 'manual') return { status: 'manual_required', providerType: null, model: null, image: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, warnings: ['Production manuelle sélectionnée.'], alternatives: defaultRuntimeAlternatives('image_generation') }
  try { return await openRouterImage(input) }
  catch (error) {
    if (input.context.continuationMode === 'provider_only') throw error
    return { status: 'manual_required', providerType: null, model: null, image: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, warnings: [runtimeMessage(error)], alternatives: error instanceof AiRuntimeContinuityError ? error.alternatives : defaultRuntimeAlternatives('image_generation') }
  }
}

export async function inspectRuntimeCapability(capability: MarketAiCapability, live = false): Promise<RuntimeCapabilityStatus> {
  const label: Record<MarketAiCapability,string> = { web_research:'Recherche web', source_extraction:'Extraction de sources', structured_reasoning:'Raisonnement structuré', structured_content:'Production structurée', multimodal_analysis:'Inspection multimodale', image_generation:'Génération visuelle' }
  try {
    const route = await resolveMarketAiProvider({ capability, context: { commandCode: 'AI-RUNTIME-HEALTH' }, healthOnly: true })
    if (!live) return { capability, label: label[capability], state: 'available', providerType: route.providerType, model: route.model, configured: true, liveVerified: false, message: `${route.providerType} configuré via ${route.source}.`, alternatives: [] }
    if (route.providerType === 'tavily') {
      const response = await fetch('https://api.tavily.com/search', { method:'POST', headers:{Authorization:`Bearer ${route.apiKey}`,'Content-Type':'application/json'}, body:JSON.stringify({query:'ANGELCARE SANILA runtime health',search_depth:'ultra-fast',max_results:1,include_answer:false}) })
      if (!response.ok) throw new Error(`TAVILY_HTTP_${response.status}`)
    } else if (capability === 'image_generation') {
      const response = await fetch('https://openrouter.ai/api/v1/images/models', { headers:{Authorization:`Bearer ${route.apiKey}`} })
      if (!response.ok) throw new Error(`OPENROUTER_IMAGE_MODELS_HTTP_${response.status}`)
    } else {
      const response = await fetch('https://openrouter.ai/api/v1/models', { headers:{Authorization:`Bearer ${route.apiKey}`} })
      if (!response.ok) throw new Error(`OPENROUTER_MODELS_HTTP_${response.status}`)
    }
    return { capability, label: label[capability], state: 'available', providerType: route.providerType, model: route.model, configured: true, liveVerified: true, message: 'Connexion réelle vérifiée.', alternatives: [] }
  } catch (error) {
    return { capability, label: label[capability], state: 'manual_available', providerType: capability === 'web_research'||capability==='source_extraction'?'tavily':'openrouter', model: null, configured: false, liveVerified: false, message: runtimeMessage(error), alternatives: error instanceof AiRuntimeContinuityError ? error.alternatives : defaultRuntimeAlternatives(capability) }
  }
}

export async function getMarketAiRuntimeStatus(live = false) {
  const capabilities: MarketAiCapability[] = ['web_research','source_extraction','structured_reasoning','structured_content','multimodal_analysis','image_generation']
  const statuses = await Promise.all(capabilities.map((capability)=>inspectRuntimeCapability(capability, live)))
  const available = statuses.filter((item)=>item.state==='available').length
  return { generatedAt:new Date().toISOString(), gemini:{status:'retired',executionAllowed:false}, capabilities:statuses, summary:{available,total:statuses.length,manualContinuity:true,deadEndCount:0} }
}
