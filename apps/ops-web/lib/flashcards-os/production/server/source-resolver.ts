import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { PRODUCTION_TENANT_KEY, PRODUCTION_VIEW_PREFIX } from '../config'
import type { ProductionSourceOption, ProductionSourceType, ResolvedProductionSource } from '../types'

type Client=Awaited<ReturnType<typeof createServiceClient>>
function table(client:Client,name:string){return client.from(`${PRODUCTION_VIEW_PREFIX}${name}`)}
function strings(value:unknown):string[]{return Array.isArray(value)?value.filter(Boolean).map(String):[]}
function first<T>(value:T[]){return value[0]??null}
function snapshot(row:any){return row?.snapshot && typeof row.snapshot==='object'?row.snapshot:row||{}}

function option(type:ProductionSourceType,row:any,label:string,collectionIds:string[]=[]):ProductionSourceOption{
 return {sourceType:type,sourceId:String(row.id),label,code:String(row.code||''),status:String(row.status||''),collectionIds,metadata:{name:row.name||row.title||label,version:Number(row.version_no||row.version||1)}}
}

export async function loadProductionSourceOptions():Promise<ProductionSourceOption[]>{
 const client=await createServiceClient()
 const [collections,packages,journeys,plans,b2c,b2b,designs]=await Promise.all([
  table(client,'collections').select('id,code,name,status').eq('tenant_key',PRODUCTION_TENANT_KEY).neq('status','archived').order('updated_at',{ascending:false}).limit(150),
  table(client,'solution_scenarios').select('id,code,name,status,version_no,collection_ids').eq('tenant_key',PRODUCTION_TENANT_KEY).order('created_at',{ascending:false}).limit(100),
  table(client,'journey_scenarios').select('id,code,name,status,version_no,collection_ids').eq('tenant_key',PRODUCTION_TENANT_KEY).order('created_at',{ascending:false}).limit(100),
  table(client,'ready_learning_plans').select('id,code,name,status,version_no,collection_ids').eq('tenant_key',PRODUCTION_TENANT_KEY).order('created_at',{ascending:false}).limit(100),
  table(client,'b2c_sellables').select('*').eq('tenant_key',PRODUCTION_TENANT_KEY).order('created_at',{ascending:false}).limit(100),
  table(client,'b2b_sellables').select('*').eq('tenant_key',PRODUCTION_TENANT_KEY).order('created_at',{ascending:false}).limit(100),
  table(client,'product_designs').select('id,code,title,status,version_no').eq('tenant_key',PRODUCTION_TENANT_KEY).in('status',['approved','ready_for_umz3']).order('updated_at',{ascending:false}).limit(100),
 ])
 for(const result of [collections,packages,journeys,plans,b2c,b2b,designs])if(result.error)throw new Error(`Production source catalogue unavailable: ${result.error.message}`)
 return [
  ...(collections.data||[]).map((r:any)=>option('collection',r,`${r.code} · ${r.name}`,[String(r.id)])),
  ...(packages.data||[]).map((r:any)=>option('package_scenario',r,`${r.code} · ${r.name}`,strings(r.collection_ids))),
  ...(journeys.data||[]).map((r:any)=>option('journey_scenario',r,`${r.code} · ${r.name}`,strings(r.collection_ids))),
  ...(plans.data||[]).map((r:any)=>option('ready_learning_plan',r,`${r.code} · ${r.name}`,strings(r.collection_ids))),
  ...(b2c.data||[]).map((r:any)=>option('b2c_sellable',r,`${r.code} · ${r.name}`,strings(r.collection_ids).length?strings(r.collection_ids):(r.direct_collection_id?[String(r.direct_collection_id)]:[]))),
  ...(b2b.data||[]).map((r:any)=>option('b2b_sellable',r,`${r.code} · ${r.name}`,strings(r.collection_ids).length?strings(r.collection_ids):(r.direct_collection_id?[String(r.direct_collection_id)]:[]))),
  ...(designs.data||[]).map((r:any)=>option('product_design',r,`${r.code} · ${r.title}`,[])),
 ]
}

export async function resolveProductionSource(sourceType:ProductionSourceType,sourceId:string):Promise<ResolvedProductionSource>{
 if(!sourceId)throw new Error('Production source is required.')
 const client=await createServiceClient()
 let row:any=null
 let designId:string|null=null
 let collectionIds:string[]=[]
 if(sourceType==='collection'){
  const q=await table(client,'collections').select('*').eq('tenant_key',PRODUCTION_TENANT_KEY).eq('id',sourceId).maybeSingle();if(q.error||!q.data)throw new Error('Collection source not found.');row=q.data;collectionIds=[String(row.id)]
 }else if(sourceType==='package_scenario'){
  const q=await table(client,'solution_scenarios').select('*').eq('tenant_key',PRODUCTION_TENANT_KEY).eq('id',sourceId).maybeSingle();if(q.error||!q.data)throw new Error('Package scenario source not found.');row=q.data;collectionIds=strings(row.collection_ids)
 }else if(sourceType==='journey_scenario'){
  const q=await table(client,'journey_scenarios').select('*').eq('tenant_key',PRODUCTION_TENANT_KEY).eq('id',sourceId).maybeSingle();if(q.error||!q.data)throw new Error('Learning programme source not found.');row=q.data;collectionIds=strings(row.collection_ids)
 }else if(sourceType==='ready_learning_plan'){
  const q=await table(client,'ready_learning_plans').select('*').eq('tenant_key',PRODUCTION_TENANT_KEY).eq('id',sourceId).maybeSingle();if(q.error||!q.data)throw new Error('Ready learning plan source not found.');row=q.data;collectionIds=strings(row.collection_ids)
 }else if(sourceType==='b2c_sellable'||sourceType==='b2b_sellable'){
  const q=await table(client,sourceType==='b2c_sellable'?'b2c_sellables':'b2b_sellables').select('*').eq('tenant_key',PRODUCTION_TENANT_KEY).eq('id',sourceId).maybeSingle();if(q.error||!q.data)throw new Error(`${sourceType==='b2c_sellable'?'B2C':'B2B'} sellable source not found.`);row=q.data;collectionIds=strings(row.collection_ids);if(!collectionIds.length&&row.direct_collection_id)collectionIds=[String(row.direct_collection_id)]
 }else{
  const q=await table(client,'product_designs').select('*').eq('tenant_key',PRODUCTION_TENANT_KEY).eq('id',sourceId).maybeSingle();if(q.error||!q.data)throw new Error('Product Design source not found.');if(!['approved','ready_for_umz3'].includes(String(q.data.status)))throw new Error('Product Design must be approved or ready for production.');row=q.data;designId=String(row.id)
 }
 const collectionId=first(collectionIds)
 let primaryCollection:any=null
 if(collectionId){const c=await table(client,'collections').select('*').eq('tenant_key',PRODUCTION_TENANT_KEY).eq('id',collectionId).maybeSingle();if(!c.error)primaryCollection=c.data}
 const title=String(row.name||row.title||primaryCollection?.name||row.code||'Production source')
 return {
  sourceType,sourceId:String(row.id),title,code:String(row.code||''),status:String(row.status||''),designId,collectionId,
  collectionIds,collectionVersionIds:strings(row.collection_version_ids),
  sourceSnapshot:{sourceType,sourceId:String(row.id),source:snapshot(row),primaryCollection:primaryCollection||null,collectionIds},
  sourceRecord:row,primaryCollection,
 }
}
