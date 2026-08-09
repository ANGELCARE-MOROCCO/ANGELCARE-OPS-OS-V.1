import { acquireGovernedProvider, failGovernedProvider, resolveGovernedProviderForHealth } from '@/lib/ai-provider-control/governor'
import type { AiProviderCapability, GovernedProviderAcquisition } from '@/lib/ai-provider-control/types'
import { AiRuntimeContinuityError, defaultRuntimeAlternatives } from './runtime-errors'
import type { MarketAiCapability, RuntimeExecutionContext, RuntimeProviderRoute } from './types'

const RETIRED_TYPES = new Set(['gemini', 'google', 'google_gemini'])

function mappedCapability(capability: MarketAiCapability): AiProviderCapability {
  if (capability === 'web_research' || capability === 'source_extraction') return 'grounded_research'
  if (capability === 'structured_reasoning') return 'structured_strategy'
  if (capability === 'multimodal_analysis') return 'content_visual_review'
  return capability
}

function expectedProvider(capability: MarketAiCapability) {
  return capability === 'web_research' || capability === 'source_extraction' ? 'tavily' : 'openrouter'
}

function envKey(capability: MarketAiCapability) {
  return expectedProvider(capability) === 'tavily' ? process.env.TAVILY_API_KEY || '' : process.env.OPENROUTER_API_KEY || ''
}

function defaultModel(capability: MarketAiCapability) {
  if (capability === 'web_research') return 'tavily/search'
  if (capability === 'source_extraction') return 'tavily/extract'
  if (capability === 'multimodal_analysis') return process.env.MARKETING_AI_VISION_MODEL || process.env.OPENROUTER_VISION_MODEL || process.env.MARKETING_AI_PRIMARY_MODEL || 'openrouter/auto'
  if (capability === 'image_generation') return process.env.MARKETING_AI_IMAGE_MODEL || process.env.OPENROUTER_IMAGE_MODEL || ''
  return process.env.MARKETING_AI_PRIMARY_MODEL || process.env.OPENROUTER_PRIMARY_MODEL || 'openrouter/auto'
}

function emptyAcquisition(input: { capability: MarketAiCapability; model: string; providerType: string }): GovernedProviderAcquisition {
  return {
    governed: false,
    reservationId: null,
    leaseId: null,
    dossierId: null,
    capacityPoolId: null,
    credentialId: null,
    providerType: input.providerType,
    apiKey: null,
    model: input.model,
    moduleKey: 'marketing_ai',
    capability: mappedCapability(input.capability),
    assignmentMode: 'bootstrap',
  }
}

export async function resolveMarketAiProvider(input: {
  capability: MarketAiCapability
  context: RuntimeExecutionContext
  estimatedRequests?: number
  estimatedOutputTokens?: number
  healthOnly?: boolean
}): Promise<RuntimeProviderRoute> {
  const requestedModel = input.context.overrideModel || defaultModel(input.capability)
  const expected = (input.context.overrideProviderType || expectedProvider(input.capability)).toLowerCase()
  let acquisition: GovernedProviderAcquisition | null = null
  try {
    acquisition = input.healthOnly
      ? await resolveGovernedProviderForHealth({ moduleKey: 'marketing_ai', capability: mappedCapability(input.capability), requestedModel })
      : await acquireGovernedProvider({
          moduleKey: 'marketing_ai',
          capability: mappedCapability(input.capability),
          requestedModel,
          estimatedRequests: input.estimatedRequests || 1,
          estimatedOutputTokens: input.estimatedOutputTokens || 0,
          grounded: input.capability === 'web_research' || input.capability === 'source_extraction',
          actorId: input.context.actorId,
          missionId: input.context.missionId,
          commandCode: input.context.commandCode,
        })
    const actual = String(acquisition.providerType || '').toLowerCase()
    if (RETIRED_TYPES.has(actual)) {
      if (!input.healthOnly) await failGovernedProvider(acquisition, new Error('PROVIDER_RETIRED:GEMINI'), { commandCode: input.context.commandCode })
      acquisition = null
    } else if (actual && actual !== expected) {
      if (!input.healthOnly) await failGovernedProvider(acquisition, new Error(`PROVIDER_CAPABILITY_MISMATCH:${actual}:${expected}`), { commandCode: input.context.commandCode })
      acquisition = null
    }
  } catch {
    acquisition = null
  }

  if (acquisition?.apiKey) {
    return {
      acquisition,
      providerType: expected,
      apiKey: acquisition.apiKey,
      model: acquisition.model || requestedModel,
      governed: acquisition.governed,
      source: 'provider_control',
    }
  }

  const fallbackKey = envKey(input.capability)
  if (fallbackKey) {
    return {
      acquisition: emptyAcquisition({ capability: input.capability, model: requestedModel, providerType: expected }),
      providerType: expected,
      apiKey: fallbackKey,
      model: requestedModel,
      governed: false,
      source: 'environment',
    }
  }

  throw new AiRuntimeContinuityError({
    code: `${expected.toUpperCase()}_NOT_CONFIGURED`,
    capability: input.capability,
    message: `Aucun fournisseur ${expected} opérationnel n’est configuré pour ${input.capability}. Le dossier reste disponible en mode manuel ou avec un autre fournisseur.`,
    alternatives: defaultRuntimeAlternatives(input.capability),
  })
}
