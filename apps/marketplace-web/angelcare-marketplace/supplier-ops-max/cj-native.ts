/**
 * CJ API V2 native server-only transport.
 * Official contracts: https://developers.cjdropshipping.com/en/api/api2/
 * No arbitrary URLs, no unauthenticated public routes, no payments, no token logging.
 */
import 'server-only'

const ROOT = 'https://developers.cjdropshipping.com/api2.0/v1/'
const ENDPOINTS = {
  categories: ['GET','product/getCategory'],
  search: ['GET','product/listV2'],
  product: ['GET','product/query'],
  variants: ['GET','product/variant/query'],
  variant: ['GET','product/variant/queryByVid'],
  stock: ['GET','product/stock/queryByVid'],
  stockSku: ['GET','product/stock/queryBySku'],
  freight: ['POST','logistic/freightCalculate'],
  orders: ['GET','shopping/order/list'],
  order: ['GET','shopping/order/getOrderDetail'],
  tracking: ['GET','logistic/trackInfo'],
  createOrder: ['POST','shopping/order/createOrderV2'],
} as const
export type CjEndpoint = keyof typeof ENDPOINTS
export type CjSearchFilters = {
  keyWord?: string; categoryId?: string; countryCode?: string;
  startSellPrice?: number; endSellPrice?: number; startWarehouseInventory?: number;
  verifiedWarehouse?: 0|1|2; productFlag?: 0|1|2|3; productType?: 4|10|11;
  supplierId?: string; hasCertification?: 0|1; customization?: 0|1;
  addMarkStatus?: 0|1; orderBy?: 0|1|2|3|4; sort?: 'asc'|'desc';
  page?: number; size?: number
}
export type CjCategory = { id:string; name:string; path:string; depth:1|2|3; children:CjCategory[] }
const text = (value:unknown,max=200):string => String(value??'').trim().slice(0,max)
const obj = (value:unknown):Record<string,any> => value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,any>:{}
const asArray = (value:unknown):unknown[] => Array.isArray(value)?value:[]
const safeId = (value:unknown):string => {const s=text(value);if(!/^[\w-]{3,200}$/.test(s))throw Error('Invalid CJ identifier');return s}
const validCountry = (value:unknown):string => {const s=text(value,2).toUpperCase();if(!/^[A-Z]{2}$/.test(s))throw Error('Invalid ISO country code');return s}
function boundedInteger(value:unknown, low:number, high:number){const n=Number(value);if(!Number.isInteger(n)||n<low||n>high)throw Error('Out-of-range CJ filter');return n}
function boundedMoney(value:unknown){const n=Number(value);if(!Number.isFinite(n)||n<0||n>1e8)throw Error('Out-of-range CJ price');return n}

let cached:{token:string;expires:number}|null=null
let renewal:Promise<string>|null=null
let lastRequest=0
let queue=Promise.resolve()
let latestHealth:{checkedAt:string;ok:boolean;status:string;endpoint:string}|null=null
export function cjConfiguration(){return {
 configured:Boolean(process.env.CJ_ACCESS_TOKEN||process.env.SUPPLIER_INTEL_CJ_ACCESS_TOKEN||process.env.SUPPLIER_INTEL_CJ_API_KEY),
 tokenSource:process.env.CJ_ACCESS_TOKEN?'CJ_ACCESS_TOKEN':process.env.SUPPLIER_INTEL_CJ_ACCESS_TOKEN?'SUPPLIER_INTEL_CJ_ACCESS_TOKEN':process.env.SUPPLIER_INTEL_CJ_API_KEY?'SUPPLIER_INTEL_CJ_API_KEY':'none',
 health:latestHealth,
 orderMode:process.env.SUPPLIER_INTEL_CJ_ORDER_MODE==='sandbox'?'sandbox':process.env.SUPPLIER_INTEL_CJ_ORDER_MODE==='live'?'live':'disabled',
 ordersEnabled:process.env.SUPPLIER_INTEL_CJ_ORDERS_ENABLED==='true'
}}
async function singleFileAuth():Promise<string>{
 const configured=process.env.CJ_ACCESS_TOKEN||process.env.SUPPLIER_INTEL_CJ_ACCESS_TOKEN
 if(cached&&cached.expires>Date.now()+60_000)return cached.token
 if(configured)return configured
 const key=process.env.SUPPLIER_INTEL_CJ_API_KEY
 if(!key)throw Error('CJ credentials not configured on server')
 // One in-flight renewal per runtime. Store token only in memory; never echo token to browser.
 if(!renewal)renewal=(async()=>{
  const result=await rawRequest('authentication/getAccessToken','POST',undefined,{apiKey:key},false)
  const data=obj(result.data),token=String(data.accessToken||'')
  if(!token||token.length>2048)throw Error('CJ authentication did not return a usable token')
  const date=Date.parse(String(data.accessTokenExpiryDate||''))
  cached={token,expires:Number.isFinite(date)?date:Date.now()+86_400_000}
  return token
 })().finally(()=>{renewal=null})
 return renewal
}
// Serialize calls per running process to respect documented 1 QPS; limit production
// concurrency across replicas separately by a shared gateway or scheduler.
async function withBudget<T>(fn:()=>Promise<T>):Promise<T>{
 const call=queue.catch(()=>{}).then(async()=>{
  const wait=Math.max(0,1100-(Date.now()-lastRequest))
  if(wait)await new Promise(r=>setTimeout(r,wait))
  lastRequest=Date.now()
  return fn()
 })
 queue=call.then(()=>{},()=>{})
 return call
}
async function rawRequest(path:string,method:'GET'|'POST',params?:URLSearchParams,body?:unknown,auth=true):Promise<Record<string,any>>{
 const url=new URL(path,ROOT);if(url.origin!=='https://developers.cjdropshipping.com'||!url.pathname.startsWith('/api2.0/v1/'))throw Error('CJ endpoint blocked')
 if(params)url.search=params.toString()
 const headers:Record<string,string>={Accept:'application/json'}
 if(body!==undefined)headers['Content-Type']='application/json'
 if(auth)headers['CJ-Access-Token']=await singleFileAuth()
 return withBudget(async()=>{
  let res:Response
  try{res=await fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(14000)})}
  catch{throw Error('CJ network request failed or timed out')}
  if(!res.ok)throw Error(res.status===401?'CJ_AUTH_REJECTED':`CJ returned HTTP ${res.status}`)
  const payload=await res.text()
  if(payload.length>3_000_000)throw Error('CJ response exceeds bounded size')
  let json:Record<string,any>
  try{json=obj(JSON.parse(payload))}catch{throw Error('Invalid JSON returned by CJ')}
  if(json.result===false||json.success===false||typeof json.code==='number'&&json.code!==200&&json.code!==0){
   const code=Number(json.code)||0
   if(code===1600100||code===1600200||code===401)throw Error('CJ_AUTH_REJECTED')
   throw Error(`CJ rejected request (code ${code}; requestId ${text(json.requestId,60)})`)
  }
  return json
 })
}
export async function cjCall(operation:CjEndpoint,query:Record<string,string|number|undefined>={},body?:Record<string,unknown>):Promise<Record<string,any>>{
 const [verb,path]=ENDPOINTS[operation]
 if(operation==='createOrder'){
  if(process.env.SUPPLIER_INTEL_CJ_ORDERS_ENABLED!=='true'||process.env.SUPPLIER_INTEL_CJ_ORDER_MODE!=='sandbox')throw Error('CJ sandbox order execution is disabled')
  if(!body||body.payType!==3||body.isSandbox!==1)throw Error('CJ order must be payment-free sandbox only')
 }
 const params=new URLSearchParams()
 for(const [key,value] of Object.entries(query))if(value!==undefined&&value!=='')params.set(key,String(value))
 try{return await rawRequest(path,verb,params,body)}catch(error){
  // A stale configured token may be recovered with the account API key. Never
  // automatically retry writes after an ambiguous upstream result.
  if(operation==='createOrder'||!(error instanceof Error)||error.message!=='CJ_AUTH_REJECTED'||!process.env.SUPPLIER_INTEL_CJ_API_KEY)throw error
  // Do not mutate process.env or reveal secrets. Issue a single credential exchange,
  // then use the refreshed token explicitly for one retry.
  const refreshed=await rawRequest('authentication/getAccessToken','POST',undefined,{apiKey:process.env.SUPPLIER_INTEL_CJ_API_KEY},false)
  const token=text(obj(refreshed.data).accessToken,2048)
  if(!token)throw Error('CJ API key renewal returned no access token')
  cached={token,expires:Date.parse(String(obj(refreshed.data).accessTokenExpiryDate))||Date.now()+86400000}
  return rawRequest(path,verb,params,body)
 }
}

export async function cjHealth(){
 try{await cjCall('categories');latestHealth={checkedAt:new Date().toISOString(),ok:true,status:'verified',endpoint:'product/getCategory'}}
 catch{latestHealth={checkedAt:new Date().toISOString(),ok:false,status:'unavailable_or_unauthorized',endpoint:'product/getCategory'}}
 return {configuration:cjConfiguration(),authenticationTest:latestHealth}
}
export async function cjCategories():Promise<CjCategory[]>{
 const raw=await cjCall('categories')
 return asArray(raw.data).map((top,i)=>{
  const first=obj(top),name=text(first.categoryFirstName),id=text(first.categoryFirstId||name,200)
  const children=asArray(first.categoryFirstList).map((mid,j)=>{
   const second=obj(mid),name2=text(second.categorySecondName)
   const children=asArray(second.categorySecondList).map(leaf=>{
    const third=obj(leaf)
    return {id:text(third.categoryId),name:text(third.categoryName),path:[name,name2,text(third.categoryName)].join(' / '),depth:3 as const,children:[]}
   }).filter(x=>x.id)
   return {id:text(second.categorySecondId||`branch-${i}-${j}`),name:name2,path:[name,name2].join(' / '),depth:2 as const,children}
  })
  return {id:id||`root-${i}`,name,path:name,depth:1 as const,children}
 })
}
export function cjSearchParameters(filters:CjSearchFilters):Record<string,string|number>{
 const accepted:Record<string,string|number>={}
 const strFields=['keyWord','categoryId','supplierId'] as const
 for(const key of strFields){const value=filters[key];if(value!==undefined&&String(value).trim())accepted[key]=text(value,key==='keyWord'?200:200)}
 if(filters.countryCode)accepted.countryCode=validCountry(filters.countryCode)
 for(const key of ['startSellPrice','endSellPrice'] as const)if(filters[key]!==undefined)accepted[key]=boundedMoney(filters[key])
 for(const key of ['startWarehouseInventory'] as const)if(filters[key]!==undefined)accepted[key]=boundedInteger(filters[key],0,100000000)
 for(const key of ['verifiedWarehouse','productFlag','productType','hasCertification','customization','addMarkStatus','orderBy'] as const)if(filters[key]!==undefined){
  const allowed:Record<string,number[]>={verifiedWarehouse:[0,1,2],productFlag:[0,1,2,3],productType:[4,10,11],hasCertification:[0,1],customization:[0,1],addMarkStatus:[0,1],orderBy:[0,1,2,3,4]}
  const n=Number(filters[key]);if(!allowed[key].includes(n))throw Error('Invalid CJ filter: '+key);accepted[key]=n
 }
 if(filters.sort){if(filters.sort!=='asc'&&filters.sort!=='desc')throw Error('Invalid CJ sorting');accepted.sort=filters.sort}
 accepted.page=boundedInteger(filters.page??1,1,1000)
 accepted.size=boundedInteger(filters.size??24,1,60)
 if(accepted.startSellPrice!==undefined&&accepted.endSellPrice!==undefined&&accepted.startSellPrice>accepted.endSellPrice)throw Error('Invalid supplier price range')
 return accepted
}
export async function cjSearch(filters:CjSearchFilters){return cjCall('search',cjSearchParameters(filters))}
export async function cjVariants(pid:string){const raw=await cjCall('variants',{pid:safeId(pid)});return asArray(raw.data)}
export async function cjInventory(vid:string){const raw=await cjCall('stock',{vid:safeId(vid)});if(!Array.isArray(raw.data))throw Error('CJ stock response has no warehouse list');return {checkedAt:new Date().toISOString(),warehouses:asArray(raw.data).map(v=>{const r=obj(v);return {
  variantId:text(r.vid),warehouseId:text(r.areaId),warehouse:text(r.areaEn),countryCode:text(r.countryCode),
  total: r.totalInventoryNum??null,cjManaged:r.cjInventoryNum??null,factoryManaged:r.factoryInventoryNum??null,
  verification:r.verifiedWarehouse??null,
 }} )}}
export async function cjFreight(input:{variantId:string;origin:string;destination:string;quantity:number;zip?:string}){
 const payload={startCountryCode:validCountry(input.origin),endCountryCode:validCountry(input.destination),products:[{vid:safeId(input.variantId),quantity:boundedInteger(input.quantity,1,1000)}],...(input.zip?{zip:text(input.zip,30)}:{})}
 const result=await cjCall('freight',{},payload)
 return {checkedAt:new Date().toISOString(),currency:'USD',origin:payload.startCountryCode,destination:payload.endCountryCode,variantId:input.variantId,methods:asArray(result.data).map(x=>{const r=obj(x);return {
  name:text(r.logisticName),price:r.logisticPrice??null,estimatedDays:text(r.logisticAging),taxesFee:r.taxesFee??null,customsFee:r.clearanceOperationFee??null,totalPostageFee:r.totalPostageFee??null
 }} )}
}
