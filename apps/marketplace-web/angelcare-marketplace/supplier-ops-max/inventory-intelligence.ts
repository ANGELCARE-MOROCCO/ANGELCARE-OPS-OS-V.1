import 'server-only'
import { cjInventory } from './cj-native'
import { normalizeCjWarehouses, type WarehouseStock } from './inventory-normalization'

export type InventorySnapshot=WarehouseStock&{
  id:string;selection_id:string;provider_product_id:string;provider:string;variant_sku:string|null;
  capture_id:string;checked_at:string;created_at:string;error_code:string|null
}
export type InventoryOverview={available:boolean;items:InventorySnapshot[];error?:string;staleAfterMinutes:number}
const uuid=(v:unknown)=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(v??''))
const toText=(v:unknown)=>String(v??'').trim().slice(0,200)

/** Auth/tenant gate is performed by server.ts. Service-role queries MUST be scoped here as well. */
export async function readInventory(db:any,tenantId:string|null,selectionId?:string):Promise<InventoryOverview>{
 let query=db.from('ac_som_cj_inventory_snapshots').select('id,selection_id,provider_product_id,provider,variant_id,variant_sku,warehouse_key,warehouse_name,country_code,cj_managed,factory_managed,total_reported,verification_code,state,error_code,capture_id,checked_at,created_at')
  .order('checked_at',{ascending:false}).limit(1200)
 query=tenantId?query.eq('tenant_id',tenantId):query.is('tenant_id',null)
 if(selectionId){if(!uuid(selectionId))throw Error('Selection UUID required');query=query.eq('selection_id',selectionId)}
 const {data,error}=await query
 if(error){
  if(error.code==='42P01'||error.code==='PGRST205'||/does not exist|schema cache/i.test(String(error.message)))return {available:false,items:[],error:'R4 inventory migration not installed',staleAfterMinutes:30}
  throw Error('Inventory snapshot access failed: '+String(error.message).slice(0,180))
 }
 // Each variant's newest capture is authoritative; older captures remain in DB for audit history.
 const captures=new Map<string,string>()
 const current:InventorySnapshot[]=[]
 for(const record of data||[]){
  const key=String(record.selection_id)+':'+String(record.variant_id)
  if(!captures.has(key))captures.set(key,String(record.capture_id))
  if(String(record.capture_id)===captures.get(key))current.push(record as InventorySnapshot)
 }
 return {available:true,items:current,staleAfterMinutes:30}
}

export async function refreshSelectionInventory(args:{
 db:any;actorId:string;tenantId:string|null;selection:{id:string;provider:string;provider_product_id:string;normalized:{variants?:Array<{id:string;sku?:string}>};selected_variant_ids:string[]};
 variantIds?:string[]
}){
 const {db,selection,tenantId}=args
 if(selection.provider!=='cj')throw Error('CJ warehouse refresh requires a CJ source product')
 if(!uuid(selection.id))throw Error('Canonical supplier selection ID invalid')
 const vars=selection.normalized?.variants||[]
 const indexed=new Map(vars.map(v=>[v.id,v]))
 const requested=args.variantIds?.length?args.variantIds:(selection.selected_variant_ids?.length?selection.selected_variant_ids:vars.map(v=>v.id))
 const distinct=[...new Set(requested)]
 if(!distinct.length)throw Error('Refresh supplier product details to obtain CJ variant IDs before inventory sync')
 if(distinct.length>12)throw Error('Maximum 12 variants per controlled refresh. Select a smaller batch to protect CJ API points.')
 for(const id of distinct)if(!indexed.has(id))throw Error('Unknown CJ variant ID for this selection: '+id.slice(0,40))
 const results:{variantId:string;status:'captured'|'unknown'|'error';warehouses:number;errorCode?:string}[]=[]
 for(const id of distinct){
  const captureId=crypto.randomUUID(), checkedAt=new Date().toISOString(), variant=indexed.get(id)!
  let entries:WarehouseStock[]
  let problem:string|null=null
  try{
   const upstream=await cjInventory(id)
   entries=normalizeCjWarehouses(id,upstream.warehouses?.map(x=>({vid:x.variantId,areaId:x.warehouseId,areaEn:x.warehouse,countryCode:x.countryCode,totalInventoryNum:x.total,cjInventoryNum:x.cjManaged,factoryInventoryNum:x.factoryManaged,verifiedWarehouse:x.verification})))
  }catch(error){
   problem=error instanceof Error?error.message:'CJ stock request failed'
   entries=[]
  }
  if(!entries.length)entries=[{variant_id:id,warehouse_key:'__unavailable__',warehouse_name:'Provider did not return a warehouse',country_code:null,
   cj_managed:null,factory_managed:null,total_reported:null,verification_code:null,state:problem?'provider_error':'provider_empty',error_code:problem?problem.slice(0,160):null}]
  const records=entries.map(s=>({...s,tenant_id:tenantId||null,selection_id:selection.id,provider:'cj',provider_product_id:selection.provider_product_id,
   variant_sku:variant.sku||null,capture_id:captureId,checked_at:checkedAt}))
  const {error}=await db.from('ac_som_cj_inventory_snapshots').insert(records)
  if(error)throw Error('R4 inventory persistence failed: '+String(error.message).slice(0,200))
  results.push({variantId:id,status:problem?'error':entries[0].state==='provider_empty'?'unknown':'captured',warehouses:problem?0:entries[0].state==='provider_empty'?0:entries.length,...(problem?{errorCode:problem.slice(0,120)}:{})})
 }
 const {error:auditError}=await db.from('ac_som_events').insert({actor_id:args.actorId,tenant_id:tenantId||null,selection_id:selection.id,
  action:'r4.inventory.refresh',note:'CJ warehouse inventory refreshed; snapshots preserve factory/CJ distinction',details:{variants:results.map(r=>({id:r.variantId,status:r.status,warehouses:r.warehouses}))}})
 if(auditError)throw Error('Inventory data was persisted but audit recording failed: '+String(auditError.message).slice(0,160))
 return {selectionId:selection.id,results,checkedAt:new Date().toISOString(),notAnAvailabilityGuarantee:true}
}
