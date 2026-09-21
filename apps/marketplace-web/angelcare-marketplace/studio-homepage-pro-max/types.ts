import type { ComponentData, Data } from '@puckeditor/core'
import type { StudioPickerData,StudioResponsiveState,StudioDesignStyle } from '@/angelcare-marketplace/studio-universal/types'
import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import type { StudioActionReference,StudioResolvedAction } from '@/angelcare-marketplace/studio-action-registry/types'
import type { StudioAttributionContext } from '@/angelcare-marketplace/studio-attribution/types'

export const HOMEPAGE_PRO_MAX_CATEGORY_ID='homepage_pro_max' as const
export const HOMEPAGE_PRO_MAX_CATEGORY_LABEL='11 · HOMEPAGE PRO MAX' as const
export const HOMEPAGE_PRO_MAX_WORLD_ID='ac.homepage.pro-max.family-commerce.01' as const
export const HOMEPAGE_PRO_MAX_WORLD_REVISION=1 as const
export type HomepageProMaxMode='editor'|'published'
export type HomepageProMaxInsertMode='replace'|'append'

export interface HomepageProMaxItem extends Record<string,unknown>{
  id?:string
  sourceId?:string
  entityId?:string
  title?:string
  subtitle?:string
  body?:string
  mediaUrl?:string
  mediaAssetKey?:string|StudioSourceReference
  href?:string
  ctaLabel?:string
  priceMad?:number|string
  currencyLabel?:string
  compareAtMad?:number|string
  rating?:number|string
  reviewCount?:number|string
  badge?:string
  status?:string
}

export interface HomepageProMaxSectionProps extends Record<string,unknown>{
  id?:string
  title?:string
  eyebrow?:string
  subtitle?:string
  body?:string
  mediaAssetKey?:string|StudioSourceReference
  mediaUrl?:string
  mediaAlt?:string
  primaryCtaLabel?:string
  primaryCtaHref?:string
  primaryAction?:StudioActionReference|null
  __studioResolvedPrimaryAction?:StudioResolvedAction|null
  secondaryCtaLabel?:string
  secondaryCtaHref?:string
  secondaryAction?:StudioActionReference|null
  __studioResolvedSecondaryAction?:StudioResolvedAction|null
  __studioAttribution?:StudioAttributionContext
  items?:HomepageProMaxItem[]
  categoryKey?:string|StudioSourceReference
  collectionKey?:string|StudioSourceReference
  density?:'dense'|'balanced'|'editorial'
  background?:'white'|'soft-blue'|'soft-pink'|'navy'|'transparent'
  emptyPolicy?:'hide'|'editor-placeholder'|'preserve-shell'
  hidden?:boolean
  responsive?:StudioResponsiveState
  sourceDesign?:StudioDesignStyle
  endsAt?:string
  badge?:string
  __studioDynamicSource?:import("../studio-dynamic-source/types").StudioDynamicSourceReference
  __studioAction?:Record<string,unknown>
}

export interface HomepageProMaxSectionDefinition{
  id:`S${string}`
  type:string
  label:string
  purpose:string
  dataClass:string
  defaultProps:HomepageProMaxSectionProps
}

export interface HomepageProMaxWorldDefinition{
  id:string
  label:string
  description:string
  categoryId:string
  revision:number
  referenceImage:string
  referenceSha256:string
  sectionCount:number
  build:(current?:Data,mode?:HomepageProMaxInsertMode)=>Data
}

export type HomepageProMaxPuckContext={pickers:StudioPickerData}
export type HomepageProMaxComponentData=ComponentData<HomepageProMaxSectionProps>
