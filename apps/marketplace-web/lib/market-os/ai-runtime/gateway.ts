import { assertProductionCapability, recordAiUsage, recordProductionIncident } from '@/lib/market-os/content-command-headquarters/production-operations-service'
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
  const aiPolicy = await assertProductionCapability('ai')
  if (!aiPolicy.allowed) return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources: [], warnings: [aiPolicy.reason], alternatives: defaultRuntimeAlternatives('structured_content') }
  if (mode === 'manual') return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources: [], warnings: ['Mode manuel explicitement sélectionné.'], alternatives: defaultRuntimeAlternatives('structured_content') }

  let sources: RuntimeSource[] = []
  const warnings: string[] = []
  const tavilyPolicy = await assertProductionCapability('tavily')
  if (input.researchQuery && mode !== 'without_research' && tavilyPolicy.allowed) {
    try { sources = (await tavilySearch({ query: input.researchQuery, context: input.context, maxResults: 8, searchDepth: 'advanced' })).sources }
    catch (error) {
      if (mode === 'provider_only') throw error
      warnings.push(runtimeMessage(error))
    }
  }

  try {
    const openRouterPolicy = await assertProductionCapability('openrouter')
    if (!openRouterPolicy.allowed) return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources, warnings: [...warnings, openRouterPolicy.reason], alternatives: defaultRuntimeAlternatives('structured_content') }
    const result = await openRouterStructured<T>({ capability: 'structured_content', context: input.context, systemInstruction: input.systemInstruction, payload: input.payload, schema: input.schema, schemaName: input.schemaName, sources, maxOutputTokens: input.maxOutputTokens })
    result.warnings.push(...warnings)
    await recordAiUsage({ actorId: input.context.actorId, provider: result.providerType, model: result.model, capability: 'structured_content', inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, latencyMs: result.usage.latencyMs, estimatedCostDh: Number(result.usage.costUsd || 0) * 10 })
    return result
  } catch (error) {
    await recordProductionIncident({ sourceType: 'ai_runtime', sourceId: input.context.commandCode || input.schemaName, incidentType: 'structured_content_failure', severity: 'high', summary: 'Échec du runtime de contenu structuré', detail: runtimeMessage(error), nextAction: 'Retry ou continuité manuelle', sourceHref: '/market-os/content-command-center/production-operations' })
    if (mode === 'provider_only') throw error
    return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources, warnings: [...warnings, runtimeMessage(error)], alternatives: error instanceof AiRuntimeContinuityError ? error.alternatives : defaultRuntimeAlternatives('structured_content') }
  }
}

export async function executeMultimodalAnalysis<T extends JsonRecord>(input: { context: RuntimeExecutionContext; instruction: string; bytes: Uint8Array; contentType: string; schema: JsonRecord; schemaName: string; maxOutputTokens?: number }): Promise<StructuredRuntimeResult<T>> {
  const policy = await assertProductionCapability('openrouter')
  if (!policy.allowed || input.context.continuationMode === 'manual') return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources: [], warnings: [policy.allowed ? 'Inspection humaine sélectionnée.' : policy.reason], alternatives: defaultRuntimeAlternatives('multimodal_analysis') }
  try { const result=await openRouterVision<T>(input);await recordAiUsage({actorId:input.context.actorId,provider:result.providerType,model:result.model,capability:'multimodal_analysis',missionId:input.context.missionId||undefined,inputTokens:result.usage.inputTokens,outputTokens:result.usage.outputTokens,latencyMs:result.usage.latencyMs,estimatedCostDh:Number(result.usage.costUsd||0)*10});return result }
  catch (error) {
    await recordProductionIncident({sourceType:'ai_runtime',sourceId:input.context.commandCode||input.schemaName,incidentType:'multimodal_failure',severity:'high',summary:'Échec inspection multimodale',detail:runtimeMessage(error),nextAction:'Inspection manuelle ou retry',sourceHref:'/market-os/content-command-center/production-operations'})
    if (input.context.continuationMode === 'provider_only') throw error
    return { status: 'manual_required', result: null, providerType: null, model: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, sources: [], warnings: [runtimeMessage(error)], alternatives: error instanceof AiRuntimeContinuityError ? error.alternatives : defaultRuntimeAlternatives('multimodal_analysis') }
  }
}

export async function executeImageGeneration(input: { context: RuntimeExecutionContext; prompt: string; aspectRatio?: string; quality?: string; outputFormat?: 'png'|'jpeg'|'webp' }): Promise<ImageRuntimeResult> {
  const policy = await assertProductionCapability('openrouter')
  if (!policy.allowed || input.context.continuationMode === 'manual') return { status: 'manual_required', providerType: null, model: null, image: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 }, warnings: [policy.allowed ? 'Production manuelle sélectionnée.' : policy.reason], alternatives: defaultRuntimeAlternatives('image_generation') }
  try { const result=await openRouterImage(input);await recordAiUsage({actorId:input.context.actorId,provider:result.providerType,model:result.model,capability:'image_generation',missionId:input.context.missionId||undefined,inputTokens:result.usage.inputTokens,outputTokens:result.usage.outputTokens,latencyMs:result.usage.latencyMs,estimatedCostDh:Number(result.usage.costUsd||0)*10});return result }
  catch (error) {
    await recordProductionIncident({sourceType:'ai_runtime',sourceId:input.context.commandCode||'image_generation',incidentType:'image_generation_failure',severity:'high',summary:'Échec génération visuelle',detail:runtimeMessage(error),nextAction:'Production manuelle ou retry',sourceHref:'/market-os/content-command-center/production-operations'})
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
