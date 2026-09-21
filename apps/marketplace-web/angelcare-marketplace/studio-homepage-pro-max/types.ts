import type { ComponentData, Data } from '@puckeditor/core'
import type { StudioPickerData } from '@/angelcare-marketplace/studio-universal/types'

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
  mediaAssetKey?:string
  href?:string
  ctaLabel?:string
  priceMad?:number|string
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
  mediaAssetKey?:string
  mediaUrl?:string
  mediaAlt?:string
  primaryCtaLabel?:string
  primaryCtaHref?:string
  secondaryCtaLabel?:string
  secondaryCtaHref?:string
  items?:HomepageProMaxItem[]
  categoryKey?:string
  collectionKey?:string
  density?:'dense'|'balanced'|'editorial'
  background?:'white'|'soft-blue'|'soft-pink'|'navy'|'transparent'
  emptyPolicy?:'hide'|'editor-placeholder'|'preserve-shell'
  hidden?:boolean
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
