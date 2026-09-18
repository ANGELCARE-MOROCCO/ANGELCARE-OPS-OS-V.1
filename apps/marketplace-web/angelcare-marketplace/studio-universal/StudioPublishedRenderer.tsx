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
import styles from './components/studio-runtime.module.css'

const s=(value:unknown)=>value==null?'':String(value)
const children=(component:ComponentData)=>{const value=(component.props as Record<string,unknown>)?.content;return Array.isArray(value)?value as ComponentData[]:[]}
export function isStudioCmsBlock(block:CmsBlock){const settings=block.settings as Record<string,unknown>|undefined;return String(settings?.studioFormat||'').startsWith('angelcare-puck-')||block.block_type.startsWith('ac_')||block.block_type.startsWith('studio_')||Boolean(block.content?.__studioPuck)}

async function mediaPickers(data:Data):Promise<StudioPickerData>{
  const keys=new Set<string>();const walk=(value:unknown)=>{if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(walk);return}const row=value as Record<string,unknown>;if(typeof row.mediaAssetKey==='string'&&row.mediaAssetKey)keys.add(row.mediaAssetKey);Object.values(row).forEach(walk)};walk(data.content)
  if(!keys.size)return {media:[],categories:[],collections:[]}
  const db=await createServiceClient();const result=await db.from('angelcare_marketplace_media_assets').select('id,asset_key,file_name,public_url,desktop_url,width,height,mime_type,status').in('asset_key',[...keys])
  return {media:(result.data||[]).map((row:Record<string,unknown>)=>({id:s(row.id),assetKey:s(row.asset_key),fileName:s(row.file_name),publicUrl:s(row.public_url||row.desktop_url),width:row.width==null?null:Number(row.width),height:row.height==null?null:Number(row.height),mimeType:s(row.mime_type),status:s(row.status)})),categories:[],collections:[]}
}

async function Commerce({type,props,locale}:{type:string;props:StudioBlockProps;locale:'fr'|'en'|'ar'}){
  let items=(await searchDiscovery({locale,category:s(props.categoryKey)||undefined,limit:240}).catch(()=>null))?.items||[]
  if(type==='collection_rail'&&s(props.collectionKey)){
    const db=await createServiceClient();const collection=await db.from('angelcare_marketplace_homepage_collections').select('id').eq('collection_key',s(props.collectionKey)).eq('locale',locale).in('status',['active','scheduled','approved']).order('updated_at',{ascending:false}).limit(1).maybeSingle()
    if(collection.data){const links=await db.from('angelcare_marketplace_homepage_collection_items').select('catalog_item_id').eq('collection_id',collection.data.id).in('status',['active','scheduled','eligible','configured']).order('sort_order');const ids=new Set((links.data||[]).map(row=>String(row.catalog_item_id)));items=((await searchDiscovery({locale,limit:240}).catch(()=>null))?.items||[]).filter(item=>ids.has(item.id))}
  }
  return <section className={styles.block}><span className={styles.eyebrow}>{s(props.eyebrow)||'MARKETPLACE'}</span><h2 className={styles.title}>{s(props.title)}</h2>{props.lead?<p className={styles.lead}>{s(props.lead)}</p>:null}{items.length?<div className={styles.items}>{items.slice(0,12).map(item=><CatalogCard key={item.id} item={item} locale={locale}/>)}</div>:<p className={styles.lead}>Aucune offre publiée n’est éligible pour cette sélection.</p>}</section>
}

async function RenderComponent({component,pickers,locale}:{component:ComponentData;pickers:StudioPickerData;locale:'fr'|'en'|'ar'}){
  const type=s(component.type),props=(component.props||{}) as StudioBlockProps,id=s(props.id)||type
  if(props.hidden===true)return null
  const nested=children(component)
  const importedCss=scopedImportedCss(id, props.__studioImportedRules)
  if(type.startsWith('ac_')){
    const style={...designToStyle(props.sourceDesign),backgroundColor:s((props as any).backgroundColor)||undefined,'--ac-layout-max':s((props as any).maxWidth)||'1460px','--ac-cols-mobile':String((props as any).columnsMobile||1),'--ac-cols-tablet':String((props as any).columnsTablet||2),'--ac-cols-desktop':String((props as any).columnsDesktop||4),'--ac-gap-mobile':`${Number((props as any).gapMobile||16)}px`,'--ac-gap-tablet':`${Number((props as any).gapTablet||20)}px`,'--ac-gap-desktop':`${Number((props as any).gapDesktop||24)}px`,'--ac-stack-direction':s((props as any).direction)||'column'} as React.CSSProperties
    const kind=type.replace('ac_','');const klass=(styles as Record<string,string>)[kind]||styles.layout
    return <div className={`${styles.layout} ${klass}`} data-ac-studio-block={id} style={style} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}{await Promise.all(nested.map((child,index)=><RenderComponent key={s(child.props?.id)||index} component={child} pickers={pickers} locale={locale}/>))}</div>
  }
  if(type==='product_grid'||type==='collection_rail')return <div data-ac-studio-block={id} style={designToStyle(props.sourceDesign)} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}<Commerce type={type} props={props} locale={locale}/></div>
  return <div data-ac-studio-block={id} style={designToStyle(props.sourceDesign)} {...responsiveDataAttributes(props.responsive)}>{importedCss?<style>{importedCss}</style>:null}<StudioBlockRuntime type={type} props={props} pickers={pickers}/></div>
}

export async function StudioPublishedRenderer({blocks,locale}:{blocks:CmsBlock[];locale:'fr'|'en'|'ar'}){
  const data=cmsBlocksToPuckData(blocks,{locale})
  const pickers=await mediaPickers(data)
  return <div lang={locale} dir={locale==='ar'?'rtl':'ltr'} data-ac-studio-runtime="published">{await Promise.all((data.content||[]).map((component,index)=><RenderComponent key={s(component.props?.id)||index} component={component} pickers={pickers} locale={locale}/>))}</div>
}
