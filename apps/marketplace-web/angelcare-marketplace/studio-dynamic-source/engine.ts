import 'server-only'
import type { ComponentData, Data } from '@puckeditor/core'
import type { MarketplacePermission, MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { getStudioSourceDescriptor } from '@/angelcare-marketplace/studio-source-registry/registry'
import { searchStudioSource } from '@/angelcare-marketplace/studio-source-registry/resolver'
import type { StudioSourceEntity, StudioSourceSearchInput } from '@/angelcare-marketplace/studio-source-registry/types'
import { isStudioDynamicSourceReference, studioDynamicSourceProfile } from './registry'
import { resolveCatalogDynamicSource } from './catalog-resolver'
import type { StudioDynamicResolveContext, StudioDynamicResolutionEntry, StudioDynamicSourceReference, StudioDynamicSourceResult, StudioDynamicTemplateResult } from './types'
import { cachedDynamicSource } from '@/angelcare-marketplace/studio-dependency-invalidation/public-cache'

const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T
const publicStatus=(value:unknown)=>['published','active','approved','scheduled','eligible','available','enrollment_open'].includes(String(value||'').toLowerCase())
const itemAction=(entity:StudioSourceEntity)=>entity.sourceId==='catalog.items'?{version:1,actionId:'catalog.open_item',target:entity.canonicalRef}:entity.sourceId==='catalog.categories'?{version:1,actionId:'catalog.open_category',target:entity.canonicalRef}:entity.sourceId==='homepage.collections'?{version:1,actionId:'catalog.open_collection',target:entity.canonicalRef}:entity.sourceId==='academy.programmes'||entity.sourceId==='academy.cohorts'?{version:1,actionId:'academy.enroll',target:entity.canonicalRef}:entity.sourceId==='partners.plans'?{version:1,actionId:'subscription.start',target:entity.canonicalRef}:entity.sourceId==='b2b.programmes'?{version:1,actionId:'b2b.request',target:entity.canonicalRef}:null
const materialize=(entity:StudioSourceEntity)=>({id:entity.id,sourceId:entity.sourceId,entityId:entity.id,title:entity.title,label:entity.subtitle||'',subtitle:entity.subtitle||'',body:entity.badges.slice(0,3).map(row=>row.value||row.label).filter(Boolean).join(' · '),description:entity.subtitle||'',mediaUrl:entity.image?.url||'',mediaAlt:entity.image?.alt||entity.title,value:entity.id,status:entity.status||'',...(Number.isFinite(Number(entity.metadata.price_amount))?{priceMad:Number(entity.metadata.price_amount),currencyLabel:String(entity.metadata.currency_label||'MAD')}:{}),__studioSourceReference:entity.canonicalRef,...(itemAction(entity)?{action:itemAction(entity),actionLabel:'Découvrir',ctaLabel:'Découvrir'}:{})})

function syntheticContext(recipe:StudioDynamicSourceReference,context:StudioDynamicResolveContext):MarketplaceRequestContext{
  const descriptor=getStudioSourceDescriptor(recipe.sourceId);const territoryMode=recipe.context?.territoryMode||'inherit';const territoryId=territoryMode==='global'?null:territoryMode==='specific'&&recipe.context?.territory?.sourceId==='context.territories'?recipe.context.territory.entityId:context.territoryId||null
  return{actor:{id:'studio-public-runtime',email:null,displayName:'Studio Public Runtime',sourceRole:'public_runtime'},roleKeys:['studio-public-runtime'],permissions:descriptor?[descriptor.governance.permission as MarketplacePermission]:[],assignments:[],territoryId,tenantId:null,locale:context.locale,sessionReference:null,workspaceKeys:[]}
}
function queryInput(recipe:StudioDynamicSourceReference,context:StudioDynamicResolveContext):StudioSourceSearchInput{
  const territoryMode=recipe.context?.territoryMode||'inherit',audienceMode=recipe.context?.audienceMode||'inherit';return{query:recipe.query?.trim()||undefined,limit:recipe.limit,cursor:null,filters:recipe.filters||{},context:{locale:context.locale,territoryId:territoryMode==='global'?null:territoryMode==='specific'&&recipe.context?.territory?.sourceId==='context.territories'?recipe.context.territory.entityId:context.territoryId||null,audienceId:audienceMode==='none'?null:audienceMode==='specific'&&recipe.context?.audience?.sourceId==='audience.segments'?recipe.context.audience.entityId:context.audienceId||null}}
}

export async function resolveStudioDynamicSource(recipe:StudioDynamicSourceReference,context:StudioDynamicResolveContext,adminContext?:MarketplaceRequestContext):Promise<StudioDynamicSourceResult>{
  if(!isStudioDynamicSourceReference(recipe))throw new Error('Configuration de source dynamique invalide.')
  const profile=studioDynamicSourceProfile(recipe.sourceId),descriptor=getStudioSourceDescriptor(recipe.sourceId);if(!profile||!descriptor||!descriptor.capabilities.dynamicQuery)throw new Error('Source dynamique non supportée.')
  if(context.visibility==='public_runtime'&&(!profile.publicRuntimeSafe||!descriptor.governance.publicSafeProjection))throw new Error('Source non autorisée en runtime public.')
  const load=async():Promise<StudioDynamicSourceResult>=>{
    if(recipe.sourceId==='catalog.items'){const items=await resolveCatalogDynamicSource(recipe,context);return{sourceId:recipe.sourceId,strategy:recipe.strategy,items,total:items.length,authority:'Catalog Discovery / Homepage Merchandising'}}
    const runtimeContext=adminContext||syntheticContext(recipe,context),input=queryInput(recipe,context);const result=await searchStudioSource(recipe.sourceId,input,runtimeContext)
    let items=result.items;if(descriptor.governance.publicationAware)items=items.filter(row=>publicStatus(row.status));if(context.visibility==='public_runtime'&&!descriptor.governance.publicSafeProjection)items=[]
    return{sourceId:recipe.sourceId,strategy:recipe.strategy,items:items.slice(0,recipe.limit),total:result.total??items.length,authority:descriptor.authority.reference}
  }
  return context.visibility==='public_runtime'?cachedDynamicSource({recipe,context,load}):load()
}


export async function applyStudioDynamicSources(data:Data,context:StudioDynamicResolveContext,adminContext?:MarketplaceRequestContext):Promise<StudioDynamicTemplateResult>{
  const copy=clone(data),entries:StudioDynamicResolutionEntry[]=[];const touched=new Set<string>()
  const walk=async(component:ComponentData):Promise<void>=>{
    const props=(component.props||{}) as Record<string,unknown>,blockId=String(props.id||component.type||'block'),blockType=String(component.type||'block'),raw=props.__studioDynamicSource
    if(raw!==undefined){
      if(!isStudioDynamicSourceReference(raw)){entries.push({blockId,blockType,sourceId:raw&&typeof raw==='object'&&!Array.isArray(raw)&&typeof(raw as any).sourceId==='string'?String((raw as any).sourceId):'unknown',strategy:raw&&typeof raw==='object'&&!Array.isArray(raw)&&typeof(raw as any).strategy==='string'?String((raw as any).strategy):'unknown',status:'INVALID_RECIPE',count:0,authority:null,note:'Configuration dynamique inconnue ou invalide.'})}
      else{
        try{const resolved=await resolveStudioDynamicSource(raw,context,adminContext);if(resolved.items.length){props.items=resolved.items.map(materialize);entries.push({blockId,blockType,sourceId:raw.sourceId,strategy:raw.strategy,status:'RESOLVED',count:resolved.items.length,authority:resolved.authority,note:`${resolved.items.length} élément(s) canoniques résolus.`});touched.add(blockId)}else if(raw.emptyPolicy==='empty'){props.items=[];entries.push({blockId,blockType,sourceId:raw.sourceId,strategy:raw.strategy,status:'EMPTY_EMPTIED',count:0,authority:resolved.authority,note:'Source vide → liste vide.'});touched.add(blockId)}else if(raw.emptyPolicy==='hide_block'){props.hidden=true;entries.push({blockId,blockType,sourceId:raw.sourceId,strategy:raw.strategy,status:'BLOCK_HIDDEN',count:0,authority:resolved.authority,note:'Source vide → bloc masqué.'});touched.add(blockId)}else entries.push({blockId,blockType,sourceId:raw.sourceId,strategy:raw.strategy,status:'EMPTY_PRESERVED',count:0,authority:resolved.authority,note:'Source vide → contenu statique conservé.'})}
        catch(error){entries.push({blockId,blockType,sourceId:raw.sourceId,strategy:raw.strategy,status:'SOURCE_ERROR',count:0,authority:getStudioSourceDescriptor(raw.sourceId)?.authority.reference||null,note:error instanceof Error?error.message:'Erreur de source dynamique.'})}
      }
    }
    const nested=Array.isArray(props.content)?props.content as ComponentData[]:[];for(const child of nested)await walk(child)
  }
  for(const component of Array.isArray(copy.content)?copy.content:[])await walk(component)
  const blockerCount=entries.filter(row=>['INVALID_RECIPE','SOURCE_UNSUPPORTED','SOURCE_NOT_PUBLIC','PERMISSION_DENIED','SOURCE_ERROR'].includes(row.status)).length
  return{data:copy,report:{sourceCount:entries.length,resolvedCount:entries.filter(row=>row.status==='RESOLVED').length,emptyCount:entries.filter(row=>row.status.startsWith('EMPTY_')||row.status==='BLOCK_HIDDEN').length,blockerCount,blocksTouched:touched.size,entries}}
}
