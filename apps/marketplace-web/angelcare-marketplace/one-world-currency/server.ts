
import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceError } from '../server/errors'
import { calculateQuote } from './finance'
type Row=Record<string,unknown>
const txt=(v:unknown)=>String(v??'').trim()
const int=(v:unknown)=>{const n=Number(v);if(!Number.isSafeInteger(n))throw new MarketplaceError('VALIDATION_ERROR','Invalid integer');return n}
function fail(e:unknown):never{throw new MarketplaceError('INTERNAL_ERROR','ONE WORLD database operation failed',{cause:e})}
export async function snapshot(){
 const db=await createServiceClient()
 const [countries,rates,batches,margins,audit,config]=await Promise.all([
  db.from('ac_owc_countries').select('*').order('name').limit(1000),
  db.from('ac_owc_rates').select('*').order('created_at',{ascending:false}).limit(1500),
  db.from('ac_owc_rate_batches').select('*').order('created_at',{ascending:false}).limit(150),
  db.from('ac_owc_margin_rules').select('*').order('updated_at',{ascending:false}).limit(500),
  db.from('ac_owc_audit').select('*').order('created_at',{ascending:false}).limit(100),
  db.from('ac_owc_configuration').select('*').eq('id',1).single()
 ])
 for(const r of [countries,rates,batches,margins,audit,config])if(r.error)fail(r.error)
 return {countries:countries.data||[],rates:rates.data||[],batches:batches.data||[],margins:margins.data||[],audit:audit.data||[],config:config.data}
}
async function audit(db:any,actor:string,action:string,entity:string,entity_id:string,after_value:Row,reason=''){
 const r=await db.from('ac_owc_audit').insert({actor_id:actor,action,entity,entity_id,after_value,reason})
 if(r.error)fail(r.error)
}
export async function mutate(input:Row,actor:string){
 const action=txt(input.action),db=await createServiceClient()
 if(action==='saveCountry'){
  const code=txt(input.code).toUpperCase(),currency=txt(input.currency).toUpperCase()
  if(!/^[A-Z]{2}$/.test(code)||!/^[A-Z]{3}$/.test(currency))throw new MarketplaceError('VALIDATION_ERROR','Invalid ISO country/currency')
  const uplift_bp=int(input.upliftBp)
  if(uplift_bp<=-10000||uplift_bp>=100000)throw new MarketplaceError('VALIDATION_ERROR','Invalid uplift')
  const row={code,name:txt(input.name).slice(0,120),region:txt(input.region).slice(0,80),currency,uplift_bp,enabled:input.enabled!==false,updated_by:actor,updated_at:new Date().toISOString()}
  if(!row.name||!row.region)throw new MarketplaceError('VALIDATION_ERROR','Name and region required')
  const r=await db.from('ac_owc_countries').upsert(row,{onConflict:'code'}).select('*').single()
  if(r.error)fail(r.error);await audit(db,actor,action,'country',code,row);return r.data
 }
 if(action==='saveMargin'){
  const scope=txt(input.scope),key=txt(input.key),uplift_bp=int(input.upliftBp)
  if(!['global','region','country'].includes(scope)||!key||uplift_bp<=-10000||uplift_bp>=100000)throw new MarketplaceError('VALIDATION_ERROR','Invalid margin rule')
  const row={scope,scope_key:key,uplift_bp,enabled:true,created_by:actor,updated_by:actor,updated_at:new Date().toISOString()}
  const r=await db.from('ac_owc_margin_rules').upsert(row,{onConflict:'scope,scope_key'}).select('*').single()
  if(r.error)fail(r.error);await audit(db,actor,action,'margin_rule',scope+':'+key,row);return r.data
 }
 if(action==='fetchRates'){
  const url='https://api.frankfurter.dev/v2/rates?base=USD'
  const controller=new AbortController()
  const timeout=setTimeout(()=>controller.abort(),12000)
  let result:unknown
  try{
   const response=await fetch(url,{signal:controller.signal,cache:'no-store',headers:{accept:'application/json'}})
   if(!response.ok)throw new MarketplaceError('CONFIGURATION_ERROR','FX source unavailable')
   result=await response.json()
  }finally{clearTimeout(timeout)}
  if(!Array.isArray(result))throw new MarketplaceError('DATA_INTEGRITY','Invalid Frankfurter payload')
  const observations=(result as Row[]).filter(x=>x.base==='USD'&&typeof x.quote==='string'&&x.quote!=='USD'&&typeof x.rate==='number'&&x.rate>0)
   .slice(0,250).map(x=>({currency:txt(x.quote),rate:String(x.rate),observed_on:txt(x.date)}))
  if(!observations.length)throw new MarketplaceError('DATA_INTEGRITY','No valid USD reference rates returned')
  return mutate({action:'stageRates',source:'frankfurter',label:'Frankfurter USD '+new Date().toISOString().slice(0,10),rows:observations},actor)
 }
 if(action==='stageRates'){
  const source=txt(input.source)
  if(!['manual','csv','frankfurter'].includes(source))throw new MarketplaceError('VALIDATION_ERROR','Invalid rate source')
  if(!Array.isArray(input.rows)||input.rows.length===0||input.rows.length>300)throw new MarketplaceError('VALIDATION_ERROR','1-300 rates required')
  const seen=new Set<string>(),rows:Row[]=[]
  for(const x of input.rows as Row[]){
   const c=txt(x.currency).toUpperCase(),r=txt(x.rate),day=txt(x.observed_on)
   if(!/^[A-Z]{3}$/.test(c)||seen.has(c)||!/^\d+(\.\d{1,12})?$/.test(r)||Number(r)<=0||!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new MarketplaceError('VALIDATION_ERROR','Invalid/duplicate currency, rate or date')
   if(c==='USD')throw new MarketplaceError('VALIDATION_ERROR','USD identity rate is immutable')
   if(new Date(day+'T00:00:00Z').getTime()>Date.now())throw new MarketplaceError('VALIDATION_ERROR','Future observed date')
   seen.add(c);rows.push({currency:c,rate:r,observed_on:day,source,status:'staged'})
  }
  const b=await db.from('ac_owc_rate_batches').insert({source,label:txt(input.label)||source+' batch',created_by:actor}).select('*').single()
  if(b.error||!b.data)fail(b.error)
  const inserted=await db.from('ac_owc_rates').insert(rows.map(x=>({...x,batch_id:b.data.id})))
  if(inserted.error)fail(inserted.error)
  await audit(db,actor,action,'rate_batch',b.data.id,{source,count:rows.length})
  return {batch:b.data,count:rows.length}
 }
 if(action==='approveRates'){
  const id=txt(input.batchId)
  if(!/^[\da-f-]{36}$/i.test(id))throw new MarketplaceError('VALIDATION_ERROR','Invalid batch ID')
  const b=await db.from('ac_owc_rate_batches').select('*').eq('id',id).single()
  if(b.error||!b.data)fail(b.error)
  if(b.data.created_by===actor)throw new MarketplaceError('PERMISSION_DENIED','Four-eyes approval: another admin must approve rates')
  const r=await db.rpc('ac_owc_activate_batch',{p_batch:id,p_actor:actor})
  if(r.error)fail(r.error)
  return {activated:Number(r.data)}
 }
 if(action==='simulate'){
  const code=txt(input.country).toUpperCase()
  const country=await db.from('ac_owc_countries').select('*').eq('code',code).single()
  if(country.error||!country.data)throw new MarketplaceError('NOT_FOUND','Country not configured')
  const c=country.data
  const active=await db.from('ac_owc_rates').select('*').eq('currency',c.currency).eq('status','active').limit(1).maybeSingle()
  if(active.error)fail(active.error)
  if(!active.data)throw new MarketplaceError('NOT_READY','No active rate for '+c.currency)
  const rules=await db.from('ac_owc_margin_rules').select('*').eq('enabled',true)
  if(rules.error)fail(rules.error)
  const match=(rules.data||[]).find((x:any)=>x.scope==='country'&&x.scope_key===code)||
   (rules.data||[]).find((x:any)=>x.scope==='region'&&x.scope_key===c.region)||
   (rules.data||[]).find((x:any)=>x.scope==='global'&&x.scope_key==='*')
  const upliftBp=match?.uplift_bp??c.uplift_bp??0
  const quote=calculateQuote({usd:txt(input.usd),rate:String(active.data.rate),currency:c.currency,upliftBp})
  const snap={country_code:code,operator_id:actor,base_usd:txt(input.usd),display_currency:c.currency,rate:String(active.data.rate),uplift_bp:upliftBp,result_minor:quote.minor,rate_id:active.data.id}
  const saved=await db.from('ac_owc_simulations').insert(snap).select('id').single()
  if(saved.error)fail(saved.error)
  return {...quote,country:code,usd:snap.base_usd,rate:snap.rate,upliftBp,simulationId:saved.data?.id,mode:'shadow'}
 }
 throw new MarketplaceError('VALIDATION_ERROR','Unknown operation')
}
