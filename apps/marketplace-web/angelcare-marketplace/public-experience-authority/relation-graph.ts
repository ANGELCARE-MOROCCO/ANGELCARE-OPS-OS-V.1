import 'server-only'
import {createServiceClient} from '@/lib/supabase/server'
import type {PublicExperience360Relation,PublicExperienceRelationGraph} from './types'

const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{ }
const list=(v:unknown)=>Array.isArray(v)?v.map(String).filter(Boolean):[]
const text=(v:unknown)=>typeof v==='string'?v.trim():v==null?'':String(v)

function relation(kind:string,row:Record<string,unknown>):PublicExperience360Relation{return{kind,entityId:text(row.id)||null,slug:text(row.slug)||null,label:text(row.name_fr||row.name||row.item_key||row.collection_key||row.placement_key||kind),metadata:{itemKey:text(row.item_key)||null,kind:text(row.kind)||null,status:text(row.status)||null,category:text(row.category_key)||null}}}

export async function loadPublicExperienceRelationGraph(itemId:string):Promise<{graph:PublicExperienceRelationGraph;raw:Record<string,unknown>}> {
 const empty:PublicExperienceRelationGraph={accessories:[],bundles:[],upsells:[],alternatives:[],recommendations:[],collections:[],placements:[]}
 const db=await createServiceClient();const item=await db.from('angelcare_marketplace_catalog_items').select('id,relation_config,fulfillment_config,territory_config,trust_config,seo_metadata,commercial_metadata,experience_config,attributes,sellable_type').eq('id',itemId).maybeSingle();if(item.error||!item.data)return{graph:empty,raw:{}}
 const relationConfig=obj(item.data.relation_config),ids=[...new Set([...list(relationConfig.cross_sell_ids),...list(relationConfig.bundle_ids),...list(relationConfig.upsell_ids),...list(relationConfig.alternative_ids)])]
 let related:Record<string,unknown>[]=[];if(ids.length){const r=await db.from('angelcare_marketplace_catalog_items').select('id,item_key,slug,kind,name_fr,status,category_key').in('id',ids.slice(0,120)).neq('status','archived');if(!r.error)related=(r.data||[]) as Record<string,unknown>[]}
 const byId=new Map(related.map(row=>[text(row.id),row]));const pick=(kind:string,values:string[])=>values.map(id=>byId.get(id)).filter(Boolean).map(row=>relation(kind,row!))
 const[collectionLinks,placements]=await Promise.all([
  db.from('angelcare_marketplace_homepage_collection_items').select('collection_id,collection:angelcare_marketplace_homepage_collections(id,collection_key,title,status)').eq('catalog_item_id',itemId).in('status',['active','scheduled','eligible','configured']).limit(120),
  db.from('angelcare_marketplace_homepage_placements').select('id,placement_key,status,locale,collection_id,section_id').eq('catalog_item_id',itemId).in('status',['active','scheduled','eligible','configured']).limit(120),
 ])
 const collections=(collectionLinks.data||[]).map((row:any)=>row.collection).filter(Boolean).map((row:any)=>relation('collection',row))
 const placementRelations=(placements.data||[]).map((row:any)=>relation('placement',row))
 return{graph:{accessories:pick('cross_sell',list(relationConfig.cross_sell_ids)),bundles:pick('bundle',list(relationConfig.bundle_ids)),upsells:pick('upsell',list(relationConfig.upsell_ids)),alternatives:pick('alternative',list(relationConfig.alternative_ids)),recommendations:[],collections,placements:placementRelations},raw:{relationConfig,fulfillmentConfig:obj(item.data.fulfillment_config),territoryConfig:obj(item.data.territory_config),trustConfig:obj(item.data.trust_config),seoMetadata:obj(item.data.seo_metadata),commercialMetadata:obj(item.data.commercial_metadata),experienceConfig:obj(item.data.experience_config),attributes:obj(item.data.attributes),sellableType:text(item.data.sellable_type)}}
}
