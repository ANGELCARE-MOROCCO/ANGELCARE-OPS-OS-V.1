import type { Data } from '@puckeditor/core'

export const STUDIO_LIVE_BINDING_VERSION = 1 as const
export const STUDIO_BINDING_MISSING_POLICIES = ['preserve_static','empty','omit','hide_block'] as const

export type StudioBindingMissingPolicy = typeof STUDIO_BINDING_MISSING_POLICIES[number]
export type StudioBindingValueType = 'text' | 'number' | 'boolean' | 'url' | 'items'
export type StudioBindingGroup = 'identity' | 'content' | 'schema' | 'commerce' | 'availability' | 'media' | 'trust' | 'configuration'
export type StudioBindingResolutionStatus = 'BOUND' | 'MISSING_PRESERVED' | 'MISSING_EMPTIED' | 'MISSING_OMITTED' | 'BLOCK_HIDDEN' | 'UNKNOWN_BINDING' | 'INCOMPATIBLE_TARGET'

export interface StudioLiveBindingReference {
  version: typeof STUDIO_LIVE_BINDING_VERSION
  bindingKey: string
  missingPolicy: StudioBindingMissingPolicy
}

export type StudioLiveBindingMap = Record<string, StudioLiveBindingReference>

export interface StudioLiveBindingDescriptor {
  key: string
  label: string
  description: string
  group: StudioBindingGroup
  valueType: StudioBindingValueType
  publicSafe: true
  authority: string
  freshness: 'request' | 'canonical-read-model'
}

export interface StudioBindingTargetDescriptor {
  key: string
  label: string
  accepts: readonly StudioBindingValueType[]
}

export interface StudioBindingContextSummary {
  itemId: string
  itemSlug: string
  itemName: string
  locale: 'fr' | 'en' | 'ar'
  schemaKey: string
  family: string
  priceAuthority: string
  availabilityAuthority: string
  mediaCount: number
  publicFieldCount: number
  trustClaimCount: number
  variantCount: number
}

export interface StudioLiveBindingContext {
  summary: StudioBindingContextSummary
  values: Record<string, unknown>
}

export interface StudioBindingResolutionEntry {
  blockId: string
  blockType: string
  target: string
  bindingKey: string
  status: StudioBindingResolutionStatus
  authority: string | null
  preview: string
}

export interface StudioBindingReport {
  bindingCount: number
  boundCount: number
  missingCount: number
  blockerCount: number
  blocksTouched: number
  entries: StudioBindingResolutionEntry[]
}

export interface StudioBoundTemplateResult {
  status: 'BOUND' | 'FALLBACK_NATIVE'
  data: Data | null
  report: StudioBindingReport
  context: StudioBindingContextSummary | null
  template: {
    id: string
    key: string
    revisionId: string
    checksum: string | null
  } | null
}
