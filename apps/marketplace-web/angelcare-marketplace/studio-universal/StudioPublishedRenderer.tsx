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

const s=(value:unknown)=>value==null?'':String(value)
const isHomepageProMaxType=(type:string)=>HOMEPAGE_PRO_MAX_COMPONENT_KEYS.includes(type)
const children=(component:ComponentData)=>{const value=(component.props as Record<string,unknown>)?.content;return Array.isArray(value)?value as ComponentData[]:[]}
export function isStudioCmsBlock(block:CmsBlock){const settings=block.settings as Record<string,unknown>|undefined;return String(settings?.studioFormat||'').startsWith('angelcare-puck-')||block.block_type.startsWith('ac_')||block.block_type.startsWith('studio_')||Boolean(block.content?.__studioPuck)}

async function mediaPickers(data:Data):Promise<StudioPickerData>{
  const keys=new Set<string>(),ids=new Set<string>();const walk=(value:unknown)=>{if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(walk);return}const row=value as Record<string,unknown>;const media=row.mediaAssetKey;if(typeof media==='string'&&media)keys.add(media);else if(isStudioSourceReference(media)&&media.sourceId==='media.assets')ids.add(media.entityId);Object.values(row).forEach(walk)};walk(data.content)
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

async function RenderComponent({component,pickers,locale,attribution,actionContext}:{component:ComponentData;pickers:StudioPickerData;locale:'fr'|'en'|'ar';attribution?:StudioAttributionContext;actionContext?:{itemId?:string|null;itemSlug?:string|null}}){
  const type=s(component.type),rawProps=(component.props||{}) as StudioBlockProps,hydrated=await hydrateActions(rawProps,locale,actionContext),id=s(hydrated.id)||type,blockAttribution=attribution?studioAttributionForInteraction(attribution,{blockId:id}):undefined,props={...hydrated,__studioAttribution:blockAttribution}
  if(props.hidden===true)return null
  const nested=children(component)
  const importedCss=scopedImportedCss(id, props.__studioImportedRules)
  if(isHomepageProMaxType(type))return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules} hidden={props.hidden}><HomepageProMaxSectionRuntime type={type} props={{...props,hidden:false} as any} pickers={pickers} mode="published"/></StudioDesignShell>
  if(type.startsWith('ac_')){
    const style={...designToStyle(props.sourceDesign),backgroundColor:s((props as any).backgroundColor)||undefined,'--ac-layout-max':s((props as any).maxWidth)||'1460px','--ac-cols-mobile':String((props as any).columnsMobile||1),'--ac-cols-tablet':String((props as any).columnsTablet||2),'--ac-cols-desktop':String((props as any).columnsDesktop||4),'--ac-gap-mobile':`${Number((props as any).gapMobile||16)}px`,'--ac-gap-tablet':`${Number((props as any).gapTablet||20)}px`,'--ac-gap-desktop':`${Number((props as any).gapDesktop||24)}px`,'--ac-stack-direction':s((props as any).direction)||'column'} as React.CSSProperties
    const kind=type.replace('ac_','');const klass=(styles as Record<string,string>)[kind]||styles.layout
    return <div className={`${styles.layout} ${klass}`} data-ac-studio-block={id} style={style} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}{await Promise.all(nested.map((child,index)=><RenderComponent key={s(child.props?.id)||index} component={child} pickers={pickers} locale={locale} attribution={attribution} actionContext={actionContext}/>))}</div>
  }
  const visual=studioVisualExperience(type)
  if(visual){
    const canonical=canonicalStudioBlockType(type)
    const commerce=canonical==='product_grid'||canonical==='collection_rail'?<Commerce type={canonical} props={props} locale={locale}/>:undefined
    return <div data-ac-studio-block={id} data-ac-studio-visual={visual.key} style={designToStyle(props.sourceDesign)} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}<StudioVisualCatalogueRuntime definition={visual} props={props} pickers={pickers} locale={locale}>{commerce}</StudioVisualCatalogueRuntime></div>
  }
  if(type==='product_grid'||type==='collection_rail')return <div data-ac-studio-block={id} style={designToStyle(props.sourceDesign)} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}<Commerce type={type} props={props} locale={locale}/></div>
  return <div data-ac-studio-block={id} style={designToStyle(props.sourceDesign)} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}<StudioBlockRuntime type={type} props={props} pickers={pickers} locale={locale}/></div>
}

const emptyDynamicReport=():StudioDynamicSourceReport=>({sourceCount:0,resolvedCount:0,emptyCount:0,blockerCount:0,blocksTouched:0,entries:[]})

export async function StudioPublishedDataRenderer({data:sourceData,locale,territoryId=null,audienceId=null,attribution,dynamicAlreadyApplied=false,dynamicReport=null,currentItemId=null,currentItemSlug=null}:{data:Data;locale:'fr'|'en'|'ar';territoryId?:string|null;audienceId?:string|null;attribution?:StudioAttributionContext;dynamicAlreadyApplied?:boolean;dynamicReport?:StudioDynamicSourceReport|null;currentItemId?:string|null;currentItemSlug?:string|null}){
  const dynamic=dynamicAlreadyApplied?{data:sourceData,report:dynamicReport||emptyDynamicReport()}:await applyStudioDynamicSources(sourceData,{locale,territoryId,audienceId,visibility:'public_runtime'})
  const data=dynamic.data
  const pickers=await mediaPickers(data)
  const runtimeAttribution=attribution?sanitizeStudioAttribution(attribution,{locale,territoryId,audienceId}):undefined;return <div lang={locale} dir={locale==='ar'?'rtl':'ltr'} data-ac-studio-runtime="published" data-ac-studio-dynamic-sources={dynamic.report.sourceCount} data-ac-studio-dynamic-blockers={dynamic.report.blockerCount}>{await Promise.all((data.content||[]).map((component,index)=><RenderComponent key={s(component.props?.id)||index} component={component} pickers={pickers} locale={locale} attribution={runtimeAttribution} actionContext={{itemId:currentItemId,itemSlug:currentItemSlug}}/>))}</div>
}

export async function StudioPublishedRenderer({blocks,locale,territoryId=null,audienceId=null,attribution}:{blocks:CmsBlock[];locale:'fr'|'en'|'ar';territoryId?:string|null;audienceId?:string|null;attribution?:StudioAttributionContext}){
  const sourceData=cmsBlocksToPuckData(blocks,{locale})
  return <StudioPublishedDataRenderer data={sourceData} locale={locale} territoryId={territoryId} audienceId={audienceId} attribution={attribution}/>
}
