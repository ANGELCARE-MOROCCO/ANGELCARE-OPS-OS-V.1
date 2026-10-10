import type { ComponentData, Data } from '@puckeditor/core'
import { createServiceClient } from '@/lib/supabase/server'
import { searchDiscovery } from '@/angelcare-marketplace/catalog-discovery/repository'
import { CatalogCard } from '@/angelcare-marketplace/catalog-discovery/components/CatalogCard'
import type { CmsBlock } from '@/angelcare-marketplace/experience-builder/types'
import { cmsBlocksToPuckData } from './puck-bridge'
import { designToStyle, responsiveDataAttributes } from './design'
import { scopedImportedCss } from './css-fidelity'
import type { StudioBlockProps, StudioPickerData } from './types'
import { StudioBlockRuntime } from './components/StudioBlockRuntime'
import { StudioDesignShell } from './components/StudioDesignShell'
import { StudioWorldLayoutShell } from './components/StudioWorldLayoutShell'
import { HomepageProMaxSectionRuntime } from '@/angelcare-marketplace/studio-homepage-pro-max/components/HomepageProMaxSectionRuntime'
import { HOMEPAGE_PRO_MAX_COMPONENT_KEYS } from '@/angelcare-marketplace/studio-homepage-pro-max/recipe'
import { StudioVisualCatalogueRuntime } from './components/StudioVisualCatalogueRuntime'
import { canonicalStudioBlockType, studioVisualExperience } from './visual-catalogue'
import styles from './components/studio-runtime.module.css'
import { isStudioSourceReference } from '@/angelcare-marketplace/studio-picker/reference'
import { isStudioActionReference } from '@/angelcare-marketplace/studio-action-registry/reference'
import { resolveStudioPublicAction } from '@/angelcare-marketplace/studio-action-registry/public-resolver'
import { applyStudioDynamicSources } from '@/angelcare-marketplace/studio-dynamic-source/engine'
import type { StudioDynamicSourceReport } from '@/angelcare-marketplace/studio-dynamic-source/types'
import type { StudioAttributionContext } from '@/angelcare-marketplace/studio-attribution/types'
import { sanitizeStudioAttribution,studioAttributionForInteraction } from '@/angelcare-marketplace/studio-attribution/context'
import {shouldRenderWorldBlock} from './world-operability'
import type {PublicExperience360,PublicExperienceTruthReport} from '@/angelcare-marketplace/public-experience-authority/types'
import {StudioProductWorldRuntime} from './components/StudioProductWorldRuntime'
import {StudioServiceWorldRuntime} from './components/StudioServiceWorldRuntime'
import {StudioAcademyWorldRuntime} from './components/StudioAcademyWorldRuntime'
import {StudioB2BWorldRuntime} from './components/StudioB2BWorldRuntime'
import {shouldUseNativeAtomicFallback} from './world-visual-authority'
import { LIVING_MARKETPLACE_WORLD_ID, isLivingMarketplaceComponent, livingMarketplaceComponentInData } from '@/angelcare-marketplace/homepage-living-marketplace/world'
import { LivingMarketplaceHomepage } from '@/angelcare-marketplace/homepage-living-marketplace/components/LivingMarketplaceHomepage'
import { getHomepageExperience } from '@/angelcare-marketplace/homepage-flagship/repository'
import { AtomicExperienceFrame, AtomicOfferSection, AtomicOfferGroup } from '../atomic-offer-experience/AtomicExperience'
import { isAtomicRoot, isAtomicSectionProps, ATOMIC_ROOTS, publicAtomicProjection } from '../atomic-offer-experience/model'

const s=(value:unknown)=>value==null?'':String(value)
const isHomepageProMaxType=(type:string)=>HOMEPAGE_PRO_MAX_COMPONENT_KEYS.includes(type)
const children=(component:ComponentData)=>{const value=(component.props as Record<string,unknown>)?.content;return Array.isArray(value)?value as ComponentData[]:[]}

const localizedKeys=new Set(['fr','en','ar'])
function localizeWorldValue(value:unknown,locale:'fr'|'en'|'ar'):unknown{
  if(Array.isArray(value))return value.map(item=>localizeWorldValue(item,locale))
  if(!value||typeof value!=='object')return value
  const row=value as Record<string,unknown>,keys=Object.keys(row)
  if(keys.some(key=>localizedKeys.has(key))&&keys.every(key=>localizedKeys.has(key)||key.startsWith('__'))){const picked=row[locale]??row.fr??row.en??row.ar;return localizeWorldValue(picked,locale)}
  return Object.fromEntries(Object.entries(row).map(([key,item])=>[key,localizeWorldValue(item,locale)]))
}
function worldRootStyle(data:Data):React.CSSProperties{
  const op=((data.root as Record<string,unknown>|undefined)?.__worldFactoryOperability||{}) as Record<string,unknown>
  const tokens=(op.tokens&&typeof op.tokens==='object'&&!Array.isArray(op.tokens)?op.tokens:{}) as Record<string,unknown>
  const style:Record<string,string|number>={}
  for(const family of ['colors','typography','spacing','radii','shadows','layout','motion']){
    const values=(tokens[family]&&typeof tokens[family]==='object'&&!Array.isArray(tokens[family])?tokens[family]:{}) as Record<string,unknown>
    for(const [key,value] of Object.entries(values)){if(['string','number'].includes(typeof value))style[`--ac-world-${family}-${key.replace(/[^a-zA-Z0-9_-]/g,'-')}`]=value as string|number}
  }
  return style as React.CSSProperties
}
export function isStudioCmsBlock(block:CmsBlock){const settings=block.settings as Record<string,unknown>|undefined;return block.block_type==='homepage_world'||String(settings?.studioFormat||'').startsWith('angelcare-puck-')||block.block_type.startsWith('ac_')||block.block_type.startsWith('studio_')||Boolean(block.content?.__studioPuck)}

async function mediaPickers(data:Data):Promise<StudioPickerData>{
  const keys=new Set<string>(),ids=new Set<string>();const walk=(value:unknown)=>{if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(walk);return}const row=value as Record<string,unknown>;const candidates=[row.mediaAssetKey,row.assetKey,row.mediaTabletAssetKey,row.mediaMobileAssetKey];for(const media of candidates){if(typeof media==='string'&&media)keys.add(media);else if(isStudioSourceReference(media)&&media.sourceId==='media.assets')ids.add(media.entityId)}Object.values(row).forEach(walk)};walk(data.content);walk((data.root as Record<string,unknown>|undefined)?.__worldFactoryOperability)
  if(!keys.size&&!ids.size)return {media:[],categories:[],collections:[]}
  const db=await createServiceClient();const [byKey,byId]=await Promise.all([
    keys.size?db.from('angelcare_marketplace_media_assets').select('id,asset_key,file_name,public_url,desktop_url,width,height,mime_type,status').in('asset_key',[...keys]):Promise.resolve({data:[]}),
    ids.size?db.from('angelcare_marketplace_media_assets').select('id,asset_key,file_name,public_url,desktop_url,width,height,mime_type,status').in('id',[...ids]):Promise.resolve({data:[]}),
  ]);const seen=new Set<string>(),rows=[...(byKey.data||[]),...(byId.data||[])].filter((row:Record<string,unknown>)=>{const id=s(row.id);if(seen.has(id))return false;seen.add(id);return true})
  return {media:rows.map((row:Record<string,unknown>)=>({id:s(row.id),assetKey:s(row.asset_key),fileName:s(row.file_name),publicUrl:s(row.public_url||row.desktop_url),width:row.width==null?null:Number(row.width),height:row.height==null?null:Number(row.height),mimeType:s(row.mime_type),status:s(row.status)})),categories:[],collections:[]}
}

async function resolveCategoryKey(value:unknown){
  if(typeof value==='string')return value
  if(!isStudioSourceReference(value)||value.sourceId!=='catalog.categories')return ''
  const db=await createServiceClient();const row=await db.from('angelcare_marketplace_catalog_categories').select('category_key').eq('id',value.entityId).maybeSingle();return s(row.data?.category_key)
}
async function resolveCollectionId(value:unknown,locale:'fr'|'en'|'ar'){
  const db=await createServiceClient()
  if(isStudioSourceReference(value)&&value.sourceId==='homepage.collections'){const row=await db.from('angelcare_marketplace_homepage_collections').select('id').eq('id',value.entityId).in('status',['active','scheduled','approved']).maybeSingle();return s(row.data?.id)}
  const key=typeof value==='string'?value:'';if(!key)return ''
  const row=await db.from('angelcare_marketplace_homepage_collections').select('id').eq('collection_key',key).eq('locale',locale).in('status',['active','scheduled','approved']).order('updated_at',{ascending:false}).limit(1).maybeSingle();return s(row.data?.id)
}

async function Commerce({type,props,locale}:{type:string;props:StudioBlockProps;locale:'fr'|'en'|'ar'}){
  const categoryKey=await resolveCategoryKey(props.categoryKey)
  let items=(await searchDiscovery({locale,category:categoryKey||undefined,limit:240}).catch(()=>null))?.items||[]
  const dynamicRefs=Array.isArray(props.items)?props.items.map(row=>row&&typeof row==='object'&&!Array.isArray(row)?(row as Record<string,unknown>).__studioSourceReference:null).filter(isStudioSourceReference).filter(ref=>ref.sourceId==='catalog.items'):[]
  if(dynamicRefs.length){const order=new Map(dynamicRefs.map((ref,index)=>[ref.entityId,index]));items=((await searchDiscovery({locale,limit:240}).catch(()=>null))?.items||[]).filter(item=>order.has(item.id)).sort((a,b)=>(order.get(a.id)??999)-(order.get(b.id)??999))}
  if(type==='collection_rail'&&props.collectionKey&&!dynamicRefs.length){
    const collectionId=await resolveCollectionId(props.collectionKey,locale)
    if(collectionId){const db=await createServiceClient();const links=await db.from('angelcare_marketplace_homepage_collection_items').select('catalog_item_id').eq('collection_id',collectionId).in('status',['active','scheduled','eligible','configured']).order('sort_order');const ids=new Set((links.data||[]).map(row=>String(row.catalog_item_id)));items=((await searchDiscovery({locale,limit:240}).catch(()=>null))?.items||[]).filter(item=>ids.has(item.id))}
  }
  return <section className={styles.block}><span className={styles.eyebrow}>{s(props.eyebrow)||'MARKETPLACE'}</span><h2 className={styles.title}>{s(props.title)}</h2>{props.lead?<p className={styles.lead}>{s(props.lead)}</p>:null}{items.length?<div className={styles.items}>{items.slice(0,12).map(item=><CatalogCard key={item.id} item={item} locale={locale} attribution={props.__studioAttribution?studioAttributionForInteraction(props.__studioAttribution,{interactionId:`catalog-item:${item.id}`}):undefined}/>)}</div>:<p className={styles.lead}>Aucune offre publiée n’est éligible pour cette sélection.</p>}</section>
}


async function hydrateActions(props:StudioBlockProps,locale:'fr'|'en'|'ar',actionContext?:{itemId?:string|null;itemSlug?:string|null}):Promise<StudioBlockProps>{
  const next={...props}
  if(isStudioActionReference(props.primaryAction))next.__studioResolvedPrimaryAction=await resolveStudioPublicAction(props.primaryAction,locale,actionContext)
  if(isStudioActionReference(props.secondaryAction))next.__studioResolvedSecondaryAction=await resolveStudioPublicAction(props.secondaryAction,locale,actionContext)
  if(Array.isArray(props.items))next.items=await Promise.all(props.items.map(async row=>{if(!row||typeof row!=='object'||Array.isArray(row))return row;const copy={...row};if(isStudioActionReference(copy.action))copy.__studioResolvedAction=await resolveStudioPublicAction(copy.action,locale,actionContext);return copy}))
  return next
}

async function RenderComponent({component,pickers,locale,territoryId,audienceId,attribution,actionContext,currentExperience360,currentTruthReport}:{component:ComponentData;pickers:StudioPickerData;locale:'fr'|'en'|'ar';territoryId?:string|null;audienceId?:string|null;attribution?:StudioAttributionContext;actionContext?:{itemId?:string|null;itemSlug?:string|null};currentExperience360?:PublicExperience360|null;currentTruthReport?:PublicExperienceTruthReport|null}){
  const type=s(component.type),rawProps=localizeWorldValue((component.props||{}) as StudioBlockProps,locale) as StudioBlockProps,hydrated=await hydrateActions(rawProps,locale,actionContext),id=s(hydrated.id)||type,blockAttribution=attribution?studioAttributionForInteraction(attribution,{blockId:id}):undefined,props={...hydrated,__studioAttribution:blockAttribution}
  if(props.hidden===true)return null
  const worldVisibility=shouldRenderWorldBlock(props,{locale,territoryId,audienceId});if(!worldVisibility.render)return null
  const nested=children(component)
  if(isAtomicRoot(type,props)&&currentExperience360?.classification.masterDomain===ATOMIC_ROOTS[type])return <AtomicExperienceFrame key={`${currentExperience360.identity.id}:${locale}`} type={type} props={props} data={publicAtomicProjection(currentExperience360)} locale={locale}>{await Promise.all(nested.map((child,index)=><RenderComponent key={s(child.props?.id)||index} component={child} pickers={pickers} locale={locale} territoryId={territoryId} audienceId={audienceId} attribution={attribution} actionContext={actionContext} currentExperience360={currentExperience360} currentTruthReport={currentTruthReport}/>))}</AtomicExperienceFrame>
  if(type==='atomic_offer_group')return <AtomicOfferGroup props={props}>{await Promise.all(nested.map((child,index)=><RenderComponent key={s(child.props?.id)||index} component={child} pickers={pickers} locale={locale} territoryId={territoryId} audienceId={audienceId} attribution={attribution} actionContext={actionContext} currentExperience360={currentExperience360} currentTruthReport={currentTruthReport}/>))}</AtomicOfferGroup>
  if(type==='atomic_offer_section')return isAtomicSectionProps(props)?<AtomicOfferSection props={props}/>:null
  const nativeAtomicFallback=shouldUseNativeAtomicFallback(type,component)
  if(nativeAtomicFallback&&type==='ac_product_world'&&currentExperience360?.classification.masterDomain==='b2c_product_digital'&&currentTruthReport)return <div data-ac-world-visual-authority="native-fallback" data-ac-world-type={type}><StudioProductWorldRuntime data={currentExperience360} truthReport={currentTruthReport} worldProps={props as Record<string,unknown>}/></div>
  if(nativeAtomicFallback&&type==='ac_service_world'&&currentExperience360?.classification.masterDomain==='b2c_service_family'&&currentTruthReport)return <div data-ac-world-visual-authority="native-fallback" data-ac-world-type={type}><StudioServiceWorldRuntime data={currentExperience360} truthReport={currentTruthReport} worldProps={props as Record<string,unknown>}/></div>
  if(nativeAtomicFallback&&type==='ac_academy_world'&&currentExperience360?.classification.masterDomain==='academy_admission'&&currentTruthReport)return <div data-ac-world-visual-authority="native-fallback" data-ac-world-type={type}><StudioAcademyWorldRuntime data={currentExperience360} truthReport={currentTruthReport} worldProps={props as Record<string,unknown>}/></div>
  if(nativeAtomicFallback&&type==='ac_b2b_world'&&currentExperience360?.classification.masterDomain==='b2b_institutional'&&currentTruthReport)return <div data-ac-world-visual-authority="native-fallback" data-ac-world-type={type}><StudioB2BWorldRuntime data={currentExperience360} truthReport={currentTruthReport} worldProps={props as Record<string,unknown>}/></div>
  if(isLivingMarketplaceComponent(component)){
    const experience=await getHomepageExperience({locale,territoryId:territoryId||undefined}).catch(()=>null)
    if(!experience)return <section data-ac-homepage-world={LIVING_MARKETPLACE_WORLD_ID} data-ac-homepage-runtime="canonical-data-unavailable" className={styles.block}><span className={styles.eyebrow}>ANGELCARE MARKETPLACE</span><h2 className={styles.title}>Marketplace temporairement indisponible</h2><p className={styles.lead}>Les données canoniques nécessaires à cette homepage ne sont pas disponibles. Aucun contenu commercial de démonstration n’est affiché.</p></section>
    return <LivingMarketplaceHomepage experience={experience}/>
  }
  if(isHomepageProMaxType(type))return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules} hidden={props.hidden}><HomepageProMaxSectionRuntime type={type} props={{...props,hidden:false} as any} pickers={pickers} mode="published"/></StudioDesignShell>
  if(type.startsWith('ac_')){
    return <StudioWorldLayoutShell type={type} props={props} authority="world-factory">{await Promise.all(nested.map((child,index)=><RenderComponent key={s(child.props?.id)||index} component={child} pickers={pickers} locale={locale} territoryId={territoryId} audienceId={audienceId} attribution={attribution} actionContext={actionContext} currentExperience360={currentExperience360} currentTruthReport={currentTruthReport}/>))}</StudioWorldLayoutShell>
  }
  const importedCss=scopedImportedCss(id, props.__studioImportedRules)
  const visual=studioVisualExperience(type)
  if(visual){
    const canonical=canonicalStudioBlockType(type)
    const commerce=canonical==='product_grid'||canonical==='collection_rail'?<Commerce type={canonical} props={props} locale={locale}/>:undefined
    return <div data-ac-studio-block={id} data-ac-world-role={s((props.__worldFactory as any)?.role)||undefined} data-ac-studio-visual={visual.key} style={designToStyle(props.sourceDesign)} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}<StudioVisualCatalogueRuntime definition={visual} props={props} pickers={pickers} locale={locale}>{commerce}</StudioVisualCatalogueRuntime></div>
  }
  if(type==='product_grid'||type==='collection_rail')return <div data-ac-studio-block={id} data-ac-world-role={s((props.__worldFactory as any)?.role)||undefined} style={designToStyle(props.sourceDesign)} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}<Commerce type={type} props={props} locale={locale}/></div>
  return <div data-ac-studio-block={id} data-ac-world-role={s((props.__worldFactory as any)?.role)||undefined} style={designToStyle(props.sourceDesign)} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}<StudioBlockRuntime type={type} props={props} pickers={pickers} locale={locale}/></div>
}

const emptyDynamicReport=():StudioDynamicSourceReport=>({sourceCount:0,resolvedCount:0,emptyCount:0,blockerCount:0,blocksTouched:0,entries:[]})

export async function StudioPublishedDataRenderer({data:sourceData,locale,territoryId=null,audienceId=null,attribution,dynamicAlreadyApplied=false,dynamicReport=null,currentItemId=null,currentItemSlug=null,currentExperience360=null,currentTruthReport=null}:{data:Data;locale:'fr'|'en'|'ar';territoryId?:string|null;audienceId?:string|null;attribution?:StudioAttributionContext;dynamicAlreadyApplied?:boolean;dynamicReport?:StudioDynamicSourceReport|null;currentItemId?:string|null;currentItemSlug?:string|null;currentExperience360?:PublicExperience360|null;currentTruthReport?:PublicExperienceTruthReport|null}){
  // A selected source-owned homepage owns the body. Old appended CMS sections
  // must not surround it or hydrate unrelated commerce sources.
  const livingWorld=livingMarketplaceComponentInData(sourceData)
  if(livingWorld){
    const visibility=shouldRenderWorldBlock(livingWorld.props as StudioBlockProps,{locale,territoryId,audienceId})
    if(!visibility.render)return null
    return <div data-ac-studio-runtime="published" data-ac-homepage-renderer="living-marketplace-world-02"><RenderComponent component={livingWorld} pickers={{media:[],categories:[],collections:[]}} locale={locale} territoryId={territoryId} audienceId={audienceId} attribution={attribution}/></div>
  }
  const dynamic=dynamicAlreadyApplied?{data:sourceData,report:dynamicReport||emptyDynamicReport()}:await applyStudioDynamicSources(sourceData,{locale,territoryId,audienceId,visibility:'public_runtime'})
  const data=dynamic.data
  const pickers=await mediaPickers(data)
  const runtimeAttribution=attribution?sanitizeStudioAttribution(attribution,{locale,territoryId,audienceId}):undefined;return <div lang={locale} dir={locale==='ar'?'rtl':'ltr'} style={worldRootStyle(data)} data-ac-studio-runtime="published" data-ac-studio-dynamic-sources={dynamic.report.sourceCount} data-ac-studio-dynamic-blockers={dynamic.report.blockerCount} data-ac-world-operability={String(Boolean((data.root as any)?.__worldFactoryOperability))}>{await Promise.all((data.content||[]).map((component,index)=><RenderComponent key={s(component.props?.id)||index} component={component} pickers={pickers} locale={locale} territoryId={territoryId} audienceId={audienceId} attribution={runtimeAttribution} actionContext={{itemId:currentItemId,itemSlug:currentItemSlug}} currentExperience360={currentExperience360} currentTruthReport={currentTruthReport}/>))}</div>
}

export async function StudioPublishedRenderer({blocks,locale,territoryId=null,audienceId=null,attribution}:{blocks:CmsBlock[];locale:'fr'|'en'|'ar';territoryId?:string|null;audienceId?:string|null;attribution?:StudioAttributionContext}){
  const sourceData=cmsBlocksToPuckData(blocks,{locale})
  return <StudioPublishedDataRenderer data={sourceData} locale={locale} territoryId={territoryId} audienceId={audienceId} attribution={attribution}/>
}
