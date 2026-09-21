import type { Data } from '@puckeditor/core'
import type { StudioSourceEntity, StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'

export const STUDIO_DYNAMIC_SOURCE_VERSION=1 as const
export const STUDIO_DYNAMIC_EMPTY_POLICIES=['preserve_static','empty','hide_block'] as const
export const STUDIO_DYNAMIC_STRATEGIES=['source_query','catalog_published','catalog_featured','catalog_available','catalog_newest','merchandising_popular','merchandising_best_pick','merchandising_new_arrival','category_items','collection_items','experience_schema_items'] as const
// Additive PEA extension: keeps the immutable P06 base strategy contract at 11 while enabling relation-aware worlds.
export const PUBLIC_EXPERIENCE_RELATION_DYNAMIC_STRATEGIES=['compatible_accessories','bundle_members','frequently_bought_together','similar_items'] as const
export const STUDIO_DYNAMIC_STRATEGIES_ALL=[...STUDIO_DYNAMIC_STRATEGIES,...PUBLIC_EXPERIENCE_RELATION_DYNAMIC_STRATEGIES] as const
export type StudioDynamicEmptyPolicy=typeof STUDIO_DYNAMIC_EMPTY_POLICIES[number]
export type StudioDynamicStrategy=typeof STUDIO_DYNAMIC_STRATEGIES_ALL[number]
export type StudioDynamicSort='canonical'|'recommended'|'newest'|'price_asc'|'price_desc'
export type StudioDynamicContextMode='inherit'|'global'|'specific'
export type StudioDynamicAudienceMode='inherit'|'none'|'specific'

export interface StudioDynamicSourceReference{
  version:1
  sourceId:string
  strategy:StudioDynamicStrategy
  query?:string
  filters?:Record<string,string|number|boolean|null>
  anchorMode?:'explicit'|'current_item'
  sort?:StudioDynamicSort
  limit:number
  category?:StudioSourceReference|null
  collection?:StudioSourceReference|null
  experienceSchema?:StudioSourceReference|null
  context?:{
    territoryMode?:StudioDynamicContextMode
    territory?:StudioSourceReference|null
    audienceMode?:StudioDynamicAudienceMode
    audience?:StudioSourceReference|null
  }
  emptyPolicy:StudioDynamicEmptyPolicy
}

export interface StudioDynamicSourceProfile{
  sourceId:string
  label:string
  description:string
  publicRuntimeSafe:boolean
  allowedStrategies:readonly StudioDynamicStrategy[]
  allowedFilters:readonly string[]
  allowedSorts:readonly StudioDynamicSort[]
  defaultLimit:number
  maxLimit:number
}

export type StudioDynamicResolutionStatus='RESOLVED'|'EMPTY_PRESERVED'|'EMPTY_EMPTIED'|'BLOCK_HIDDEN'|'INVALID_RECIPE'|'SOURCE_UNSUPPORTED'|'SOURCE_NOT_PUBLIC'|'PERMISSION_DENIED'|'SOURCE_ERROR'
export interface StudioDynamicResolutionEntry{
  blockId:string
  blockType:string
  sourceId:string
  strategy:StudioDynamicStrategy|string
  status:StudioDynamicResolutionStatus
  count:number
  authority:string|null
  note:string
}
export interface StudioDynamicSourceReport{
  sourceCount:number
  resolvedCount:number
  emptyCount:number
  blockerCount:number
  blocksTouched:number
  entries:StudioDynamicResolutionEntry[]
}
export interface StudioDynamicResolveContext{
  locale:'fr'|'en'|'ar'
  territoryId?:string|null
  territoryCode?:string|null
  audienceId?:string|null
  itemId?:string|null
  itemSlug?:string|null
  visibility:'admin_preview'|'public_runtime'
}
export interface StudioDynamicSourceResult{
  sourceId:string
  strategy:StudioDynamicStrategy
  items:StudioSourceEntity[]
  total:number
  authority:string
}
export interface StudioDynamicTemplateResult{data:Data;report:StudioDynamicSourceReport}
