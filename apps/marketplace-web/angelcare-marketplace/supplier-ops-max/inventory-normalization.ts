/** CJ inventory normalization: preserve distinctions in the provider's inventory contract.
 * No "unknown = zero", no factory stock advertised as CJ warehouse stock.
 */
export type StockStatus='provider_reported'|'provider_empty'|'provider_error'
export type WarehouseStock={
  variant_id:string;warehouse_key:string;warehouse_name:string;country_code:string|null;
  cj_managed:number|null;factory_managed:number|null;total_reported:number|null;
  verification_code:string|null;state:StockStatus;error_code:string|null
}
const clean=(v:unknown,max=200)=>String(v??'').trim().slice(0,max)
export function supplierQuantity(value:unknown):number|null{
  if(value===null||value===undefined||value==='')return null
  const n=Number(value)
  return Number.isSafeInteger(n)&&n>=0&&n<=1_000_000_000?n:null
}
export function normalizeCjWarehouses(variantId:string,response:unknown):WarehouseStock[]{
  if(!/^[a-zA-Z0-9_-]{3,200}$/.test(variantId))throw Error('Invalid provider variant identity')
  if(!Array.isArray(response))throw Error('CJ inventory payload is not a warehouse array')
  const found=new Set<string>()
  const out:WarehouseStock[]=[]
  for(const entry of response){
    if(!entry||typeof entry!=='object'||Array.isArray(entry))continue
    const row=entry as Record<string,unknown>
    if(row.vid&&clean(row.vid)!==variantId)throw Error('CJ variant identity mismatch in stock response')
    const key=clean(row.areaId,100)
    if(!key)throw Error('CJ inventory row has no stable warehouse ID')
    if(found.has(key))throw Error('CJ duplicated a warehouse ID within one inventory response')
    found.add(key)
    const cj=supplierQuantity(row.cjInventoryNum)
    const factory=supplierQuantity(row.factoryInventoryNum)
    const total=supplierQuantity(row.totalInventoryNum)
    if((row.cjInventoryNum!=null&&cj===null)||(row.factoryInventoryNum!=null&&factory===null)||(row.totalInventoryNum!=null&&total===null))throw Error('CJ returned an invalid warehouse quantity')
    const country=clean(row.countryCode,2).toUpperCase()
    out.push({variant_id:variantId,warehouse_key:key,warehouse_name:clean(row.areaEn,200)||`Warehouse ${key}`,
      country_code:/^[A-Z]{2}$/.test(country)?country:null,cj_managed:cj,factory_managed:factory,total_reported:total,
      verification_code:row.verifiedWarehouse==null?null:clean(row.verifiedWarehouse,20),state:'provider_reported',error_code:null})
  }
  return out
}
export function stockFreshness(checkedAt:string,now=Date.now(),maxAgeMs=30*60*1000):'fresh'|'stale'|'unknown'{
 const parsed=Date.parse(checkedAt)
 return !Number.isFinite(parsed)||parsed>now+60_000?'unknown':now-parsed<=maxAgeMs?'fresh':'stale'
}
export function warehouseStockDecision(rows:WarehouseStock[]):'reported'|'factory_only'|'unknown'|'empty'{
 if(!rows.length||rows.every(r=>r.state!=='provider_reported'))return 'unknown'
 const cj=rows.reduce((s,r)=>s+(r.cj_managed??0),0)
 if(cj>0)return 'reported'
 if(rows.some(r=>(r.factory_managed??0)>0))return 'factory_only'
 return rows.some(r=>r.cj_managed!==null)?'empty':'unknown'
}
/** Publication guard: positive CURRENT CJ-managed stock for every listed variant.
 * Stock is supplier-reported, never a reservation; Finance and Commerce gates remain separate.
 */
export function evaluateWarehouseStockGate(rows:Array<WarehouseStock&{checked_at:string}>,variantIds:string[],now=Date.now()):{ok:boolean;missing:string[];providerReportedUnits:number}{
 const missing:string[]=[]
 let providerReportedUnits=0
 if(!variantIds.length)return {ok:false,missing:['No explicit provider variant selected'],providerReportedUnits}
 for(const id of [...new Set(variantIds)]){
  const forVariant=rows.filter(r=>r.variant_id===id&&r.state==='provider_reported'&&stockFreshness(r.checked_at,now)==='fresh')
  if(!forVariant.length){missing.push(`No fresh CJ warehouse response for variant ${id}`);continue}
  const total=forVariant.reduce((s,r)=>s+(r.cj_managed??0),0)
  if(total<=0){missing.push(`No positive CJ-managed warehouse stock for variant ${id}; factory stock is separate`);continue}
  providerReportedUnits+=total
 }
 return {ok:missing.length===0,missing,providerReportedUnits}
}
