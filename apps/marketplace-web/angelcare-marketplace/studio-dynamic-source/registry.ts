import { getStudioSourceDescriptor, STUDIO_SOURCE_DESCRIPTORS } from '@/angelcare-marketplace/studio-source-registry/registry'
import type { StudioDynamicSourceProfile, StudioDynamicSourceReference, StudioDynamicStrategy } from './types'
import { PUBLIC_EXPERIENCE_RELATION_DYNAMIC_STRATEGIES, STUDIO_DYNAMIC_EMPTY_POLICIES, STUDIO_DYNAMIC_SOURCE_VERSION, STUDIO_DYNAMIC_STRATEGIES } from './types'

const generic=['source_query'] as const
const catalog=[...generic,'catalog_published','catalog_featured','catalog_available','catalog_newest','merchandising_popular','merchandising_best_pick','merchandising_new_arrival','category_items','collection_items','experience_schema_items','compatible_accessories','bundle_members','frequently_bought_together','similar_items'] as const
const p=(sourceId:string,label:string,allowedStrategies:readonly StudioDynamicStrategy[],allowedFilters:string[]=[],allowedSorts:StudioDynamicSourceProfile['allowedSorts']=['canonical'],defaultLimit=8,maxLimit=24):StudioDynamicSourceProfile=>({sourceId,label,description:getStudioSourceDescriptor(sourceId)?.description||'',publicRuntimeSafe:Boolean(getStudioSourceDescriptor(sourceId)?.governance.publicSafeProjection),allowedStrategies,allowedFilters,allowedSorts,defaultLimit,maxLimit})

export const STUDIO_DYNAMIC_SOURCE_PROFILES:readonly StudioDynamicSourceProfile[]=[
  p('catalog.items','Produits, services, formations et SaaS',catalog,['kind','category_key','experience_schema_key','availability_status','anchor_item_id'],['canonical','recommended','newest','price_asc','price_desc'],8,24),
  p('catalog.categories','Catégories',generic,['status'],['canonical'],8,24),
  p('homepage.collections','Collections',generic,['status','selection_method'],['canonical'],8,18),
  p('homepage.campaigns','Campagnes homepage',generic,['status'],['canonical'],6,12),
  p('experience.live_campaigns','Campagnes Live Experience',generic,[],['canonical'],6,12),
  p('academy.programmes','Programmes Academy',generic,[],['canonical'],8,18),
  p('academy.cohorts','Cohortes Academy',generic,[],['canonical'],8,18),
  p('providers.profiles','Providers',generic,[],['canonical'],8,18),
  p('commerce.promotions','Promotions',generic,[],['canonical'],8,18),
  p('partners.plans','Plans partenaires',generic,[],['canonical'],6,12),
  p('b2b.programmes','Programmes B2B',generic,[],['canonical'],8,18),
  p('trust.claims','Preuves et badges confiance',generic,[],['canonical'],8,18),
] as const

export const STUDIO_DYNAMIC_SOURCE_BY_ID=new Map(STUDIO_DYNAMIC_SOURCE_PROFILES.map(row=>[row.sourceId,row]))
export const STUDIO_DYNAMIC_SOURCE_COUNT=STUDIO_DYNAMIC_SOURCE_PROFILES.length
export const STUDIO_P01_DYNAMIC_QUERY_SOURCE_IDS=STUDIO_SOURCE_DESCRIPTORS.filter(row=>row.capabilities.dynamicQuery).map(row=>row.id).sort()

const policies:Record<string,readonly string[]>={
  product_grid:['catalog.items'], service_grid:['catalog.items'],
  category_grid:['catalog.categories'], audience_router:['catalog.categories','homepage.collections','homepage.campaigns'],
  trust_strip:['trust.claims'], proof_grid:['trust.claims'], partner_logos:['providers.profiles'],
  pricing:['catalog.items','partners.plans','commerce.promotions'], comparison:['catalog.items','partners.plans'],
  timeline:['academy.programmes','academy.cohorts','b2b.programmes'], process:['academy.programmes','academy.cohorts','b2b.programmes'],
  studio_carousel:['catalog.items','homepage.collections','homepage.campaigns','experience.live_campaigns','academy.programmes','b2b.programmes'],
  studio_tabs:['catalog.categories','homepage.collections','academy.programmes'], studio_menu:['catalog.categories','homepage.collections'],
}
export function studioDynamicSourcesForBlock(blockType:string){return policies[blockType]||[]}
export function studioDynamicSourceProfile(sourceId:string){return STUDIO_DYNAMIC_SOURCE_BY_ID.get(sourceId)||null}

const plain=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v)
export function isStudioDynamicSourceReference(value:unknown):value is StudioDynamicSourceReference{
  if(!plain(value)||value.version!==STUDIO_DYNAMIC_SOURCE_VERSION||typeof value.sourceId!=='string'||!STUDIO_DYNAMIC_SOURCE_BY_ID.has(value.sourceId))return false
  if(typeof value.strategy!=='string'||(!STUDIO_DYNAMIC_STRATEGIES.includes(value.strategy as any)&&!PUBLIC_EXPERIENCE_RELATION_DYNAMIC_STRATEGIES.includes(value.strategy as any)))return false
  const profile=studioDynamicSourceProfile(value.sourceId);if(!profile||!profile.allowedStrategies.includes(value.strategy as StudioDynamicStrategy))return false
  if(typeof value.limit!=='number'||!Number.isInteger(value.limit)||value.limit<1||value.limit>profile.maxLimit)return false
  if(typeof value.emptyPolicy!=='string'||!STUDIO_DYNAMIC_EMPTY_POLICIES.includes(value.emptyPolicy as any))return false
  if(value.query!==undefined&&(typeof value.query!=='string'||value.query.length>120))return false
  const filters=plain(value.filters)?value.filters:{};if(Object.keys(filters).length>8||Object.keys(filters).some(key=>!profile.allowedFilters.includes(key)))return false
  if(value.sort!==undefined&&!profile.allowedSorts.includes(value.sort as any))return false
  return true
}
