import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'

export type StudioSourceCapability = 'search' | 'browse' | 'singleSelect' | 'multiSelect' | 'hierarchical' | 'dynamicQuery' | 'bindable' | 'previewable'
export type StudioSourceAuthorityType = 'repository' | 'service' | 'api' | 'read_model'
export type StudioSourcePublicationState = 'published' | 'draft' | 'archived' | 'disabled' | 'unavailable' | 'active' | 'unknown'
export type StudioSourceValidationStatus = 'VALID' | 'NOT_FOUND' | 'NOT_AUTHORIZED' | 'NOT_PUBLISHED' | 'DISABLED' | 'SOURCE_UNKNOWN' | 'UNSUPPORTED'

export interface StudioSourceDescriptor {
  id: string
  version: number
  p00CandidateId: string
  p00CapabilityId: string
  domain: string
  entityType: string
  label: string
  labelPlural: string
  description: string
  authority: {
    type: StudioSourceAuthorityType
    canonical: true
    reference: string
  }
  identifiers: {
    canonicalField: string
    displayField: string
    slugField?: string
  }
  capabilities: Record<StudioSourceCapability, boolean>
  governance: {
    permission: string
    publicationAware: boolean
    territoryAware: boolean
    audienceAware: boolean
    publicSafeProjection: boolean
  }
  presentation: {
    titleField: string
    subtitleField?: string
    imageField?: string
    statusField?: string
    badges: string[]
  }
  runtime: {
    adapter: string
  }
}

export interface StudioSourceImage {
  url: string
  alt?: string
}

export interface StudioSourceBadge {
  label: string
  value?: string
}

export interface StudioSourceEntity {
  sourceId: string
  id: string
  title: string
  subtitle?: string
  image?: StudioSourceImage
  status?: string
  badges: StudioSourceBadge[]
  canonicalRef: {
    sourceId: string
    entityId: string
  }
  metadata: Record<string, unknown>
}

export interface StudioSourceQueryContext {
  locale?: 'fr' | 'en' | 'ar'
  territoryId?: string | null
  audienceId?: string | null
}

export interface StudioSourceSearchInput {
  query?: string
  limit?: number
  cursor?: string | null
  filters?: Record<string, string | number | boolean | null>
  context?: StudioSourceQueryContext
}

export interface StudioSourceSearchResult {
  sourceId: string
  items: StudioSourceEntity[]
  nextCursor: string | null
  total?: number
}

export interface StudioSourceReference {
  sourceId: string
  entityId: string
}

export interface StudioSourceValidation {
  status: StudioSourceValidationStatus
  reference: StudioSourceReference
  entity?: StudioSourceEntity
  reason?: string
}

export interface StudioSourceAdapter {
  sourceId: string
  search(input: StudioSourceSearchInput, context: MarketplaceRequestContext): Promise<StudioSourceSearchResult>
  getById(entityId: string, input: StudioSourceSearchInput, context: MarketplaceRequestContext): Promise<StudioSourceEntity | null>
  browse?(input: StudioSourceSearchInput, context: MarketplaceRequestContext): Promise<StudioSourceSearchResult>
  validateSelection?(entityId: string, input: StudioSourceSearchInput, context: MarketplaceRequestContext): Promise<StudioSourceValidation>
}
