import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { searchDiscovery } from '@/angelcare-marketplace/catalog-discovery/repository'
import type { StudioSourceEntity, StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import type { StudioDynamicResolveContext, StudioDynamicSourceReference } from './types'

const text=(v:unknown)=>v==null?'':String(v)
const entity=(row:any):StudioSourceEntity=>({sourceId:'catalog.items',id:text(row.id),title:text(row.name)||text(row.name_fr)||text(row.item_key)||text(row.id),...((row.short_description||row.short_description_fr)?{subtitle:text(row.short_description)||text(row.short_description_fr)}:{}),...(row.media_url?{image:{url:text(row.media_url),alt:text(row.name)||''}}:{}),status:'published',badges:[{label:'kind',value:text(row.kind)},{label:'availability',value:text(row.availability_status)},{label:'category',value:text(row.category_key)}].filter(b=>b.value),canonicalRef:{sourceId:'catalog.items',entityId:text(row.id)},metadata:{public_reference:row.public_reference,item_key:row.item_key,slug:row.slug,kind:row.kind,availability_status:row.availability_status,category_key:row.category_key,price_mode:row.price_mode,price_amount:row.price_amount,currency_label:row.currency_label,featured:Boolean(row.featured)}})

async function territoryCode(context:StudioDynamicResolveContext,recipe:StudioDynamicSourceReference){
  const mode=recipe.context?.territoryMode||'inherit';if(mode==='global')return null;if(context.territoryCode)return context.territoryCode
  const ref=mode==='specific'?recipe.context?.territory:null;const id=ref?.sourceId==='context.territories'?ref.entityId:context.territoryId;if(!id)return null
  const db=await createServiceClient();const r=await db.from('angelcare_marketplace_territories').select('territory_code').eq('id',id).maybeSingle();return text(r.data?.territory_code)||null
}
async function refMetadata(ref:StudioSourceReference|undefined|null,table:string,field:string){if(!ref)return'';const db=await createServiceClient();const r=await db.from(table).select(field).eq('id',ref.entityId).maybeSingle();return text((r.data as any)?.[field])}
async function placementIds(badge:string,context:StudioDynamicResolveContext,limit:number):Promise<string[]>{const db=await createServiceClient();const now=new Date().toISOString();let q:any=db.from('angelcare_marketplace_homepage_placements').select('catalog_item_id').eq('status','active').eq('merchandising_badge',badge).eq('locale',context.locale).lte('starts_at',now).or(`ends_at.is.null,ends_at.gte.${now}`).order('priority').order('sort_order').limit(Math.min(limit,24));if(context.territoryId)q=q.or(`territory_id.is.null,territory_id.eq.${context.territoryId}`);const{data,error}=await q;if(error)return[];return(data||[]).map((row:any)=>text(row.catalog_item_id)).filter(Boolean)}

async function relationIds(recipe:StudioDynamicSourceReference,context:StudioDynamicResolveContext):Promise<string[]>{
  const explicit=typeof recipe.filters?.anchor_item_id==='string'?recipe.filters.anchor_item_id:'';const anchor=explicit||(recipe.anchorMode==='current_item'?text(context.itemId):'');if(!anchor)return[]
  const db=await createServiceClient();const result=await db.from('angelcare_marketplace_catalog_items').select('relation_config').eq('id',anchor).eq('status','published').maybeSingle();if(result.error||!result.data)return[]
  const relation=result.data.relation_config&&typeof result.data.relation_config==='object'&&!Array.isArray(result.data.relation_config)?result.data.relation_config as Record<string,unknown>:{ }
  const field=recipe.strategy==='compatible_accessories'?'cross_sell_ids':recipe.strategy==='bundle_members'?'bundle_ids':recipe.strategy==='frequently_bought_together'?'upsell_ids':'alternative_ids'
  return Array.isArray(relation[field])?(relation[field] as unknown[]).map(String).filter(Boolean):[]
}

async function collectionIds(recipe:StudioDynamicSourceReference):Promise<string[]>{const ref=recipe.collection;if(!ref||ref.sourceId!=='homepage.collections')return[];const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_homepage_collection_items').select('catalog_item_id').eq('collection_id',ref.entityId).in('status',['active','scheduled','eligible','configured']).order('sort_order').limit(120);if(error)return[];return(data||[]).map((row:any)=>text(row.catalog_item_id)).filter(Boolean)}

export async function resolveCatalogDynamicSource(recipe:StudioDynamicSourceReference,context:StudioDynamicResolveContext):Promise<StudioSourceEntity[]>{
  const limit=Math.max(1,Math.min(recipe.limit,24)),territory=await territoryCode(context,recipe),sort=recipe.sort&&recipe.sort!=='canonical'?recipe.sort:'recommended'
  if(['merchandising_popular','merchandising_best_pick','merchandising_new_arrival'].includes(recipe.strategy)){
    const badge=recipe.strategy==='merchandising_popular'?'popular':recipe.strategy==='merchandising_best_pick'?'best-pick':'new-arrival';const ids=await placementIds(badge,context,limit);if(!ids.length)return[]
    const result=await searchDiscovery({locale:context.locale,territoryCode:territory,limit:120});const map=new Map(result.items.map(item=>[item.id,item]));return ids.map((id:string)=>map.get(id)).filter(Boolean).slice(0,limit).map(entity)
  }
  if(recipe.strategy==='collection_items'){
    const ids=await collectionIds(recipe);if(!ids.length)return[];const result=await searchDiscovery({locale:context.locale,territoryCode:territory,limit:240});const map=new Map(result.items.map(item=>[item.id,item]));return ids.map((id:string)=>map.get(id)).filter(Boolean).slice(0,limit).map(entity)
  }
  if(['compatible_accessories','bundle_members','frequently_bought_together','similar_items'].includes(recipe.strategy)){const ids=await relationIds(recipe,context);if(!ids.length)return[];const result=await searchDiscovery({locale:context.locale,territoryCode:territory,limit:240});const map=new Map(result.items.map(item=>[item.id,item]));return ids.map((id:string)=>map.get(id)).filter(Boolean).slice(0,limit).map(entity)}
  let category=typeof recipe.filters?.category_key==='string'?recipe.filters.category_key:null
  if(recipe.strategy==='category_items')category=await refMetadata(recipe.category,'angelcare_marketplace_catalog_categories','category_key')||null
  const availability=recipe.strategy==='catalog_available'?'available':typeof recipe.filters?.availability_status==='string'?recipe.filters.availability_status:null
  const kind=typeof recipe.filters?.kind==='string'?recipe.filters.kind:null
  if(recipe.strategy==='experience_schema_items'){
    const schema=await refMetadata(recipe.experienceSchema,'angelcare_marketplace_experience_schemas','schema_key');if(!schema)return[]
    const db=await createServiceClient();let q:any=db.from('angelcare_marketplace_catalog_discovery_v').select('id,public_reference,item_key,slug,kind,name_fr,short_description_fr,media_url,availability_status,category_key,price_mode,price_amount,currency_label,featured,experience_schema_key,territory_code,status,merchandising_priority').eq('status','published').eq('experience_schema_key',schema);if(territory)q=q.or(`territory_code.is.null,territory_code.eq.${territory}`);q=q.order('featured',{ascending:false}).order('merchandising_priority',{ascending:false}).limit(limit);const{data,error}=await q;if(error)return[];return(data||[]).map(entity)
  }
  const effectiveSort=recipe.strategy==='catalog_newest'?'newest':sort
  const result=await searchDiscovery({locale:context.locale,territoryCode:territory,query:recipe.strategy==='source_query'?recipe.query:undefined,kind,category,availability,sort:effectiveSort,limit:recipe.strategy==='catalog_featured'?Math.max(limit,24):limit})
  const rows=recipe.strategy==='catalog_featured'?result.items.filter(item=>item.featured):result.items
  return rows.slice(0,limit).map(entity)
}
