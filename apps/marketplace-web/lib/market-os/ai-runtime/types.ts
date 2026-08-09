import type { GovernedProviderAcquisition, JsonRecord } from '@/lib/ai-provider-control/types'

export type MarketAiCapability =
  | 'web_research'
  | 'source_extraction'
  | 'structured_reasoning'
  | 'structured_content'
  | 'multimodal_analysis'
  | 'image_generation'

export type RuntimeContinuationMode = 'auto' | 'provider_only' | 'without_research' | 'manual'
export type RuntimeCapabilityState = 'available' | 'degraded' | 'manual_available' | 'unavailable' | 'retired'

export type RuntimeResolutionAction = {
  code: 'retry' | 'switch_provider' | 'continue_without_research' | 'manual_mode' | 'configure_provider' | 'edit_assignment' | 'disable_assignment' | 'delete_assignment'
  label: string
  description: string
  authority: 'view' | 'manage' | 'run' | 'govern' | 'purge'
}

export type RuntimeCapabilityStatus = {
  capability: MarketAiCapability
  label: string
  state: RuntimeCapabilityState
  providerType: string | null
  model: string | null
  configured: boolean
  liveVerified: boolean
  message: string
  alternatives: RuntimeResolutionAction[]
}

export type RuntimeSource = {
  title: string
  url: string
  content?: string
  score?: number
  observedAt: string
  sourceType: 'tavily_search' | 'tavily_extract' | 'manual_source'
  freshness?: string
}

export type RuntimeUsage = {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd?: number
  latencyMs: number
}

export type RuntimeExecutionContext = {
  actorId?: string | null
  missionId?: string | null
  commandCode: string
  moduleKey?: string
  continuationMode?: RuntimeContinuationMode
  overrideProviderType?: string | null
  overrideModel?: string | null
  reason?: string | null
}

export type RuntimeProviderRoute = {
  acquisition: GovernedProviderAcquisition
  providerType: string
  apiKey: string
  model: string
  governed: boolean
  source: 'provider_control' | 'environment'
}

export type StructuredRuntimeResult<T extends JsonRecord> = {
  status: 'completed' | 'manual_required'
  result: T | null
  providerType: string | null
  model: string | null
  usage: RuntimeUsage
  sources: RuntimeSource[]
  warnings: string[]
  alternatives: RuntimeResolutionAction[]
  rawResponseId?: string | null
}

export type ImageRuntimeResult = {
  status: 'completed' | 'manual_required'
  providerType: string | null
  model: string | null
  image?: { bytes: Uint8Array; contentType: string } | null
  usage: RuntimeUsage
  warnings: string[]
  alternatives: RuntimeResolutionAction[]
}
