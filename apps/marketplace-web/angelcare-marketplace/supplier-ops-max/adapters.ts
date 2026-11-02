/**
 * Read-only supplier connector adapters. API credentials never leave server.
 * CJ listV2 and Fulfillbot product search are documented. HyperSKU and EPROLO
 * intentionally fail closed until vendor-provided API specifications are reviewed.
 */
import { PROVIDERS, type Provider, type ProviderState, type SupplierListing, type SupplierVariant, finiteMoney, literalText } from './contract'

const str=(x:unknown,max=500)=>literalText(x,max)
const obj=(x:unknown):Record<string,any>=>x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,any>:{}
const arr=(x:unknown):unknown[]=>Array.isArray(x)?x:[]
const num=(x:unknown):number|null=>{const n=finiteMoney(x);return n===null?null:n}
const img=(x:unknown):string|null=>{const u=str(x,1500);try{const url=new URL(u);return url.protocol==='https:'?url.toString():null}catch{return null}}
function linkList(x:unknown):string[]{
 const list=Array.isArray(x)?x:typeof x==='string'?x.split(/[,|]+/):[]
 return [...new Set(list.map(img).filter((u):u is string=>Boolean(u)))].slice(0,24)
}
function variants(x:unknown):SupplierVariant[]{return arr(x).slice(0,120).map((v,i)=>{
 const r=obj(v);const id=str(r.vid||r.variantId||r.skuId||r.id||r.variantSku||i,180)
 return {id,sku:str(r.variantSku||r.sku||id,180),label:str(r.variantNameEn||r.variantName||r.name||r.specification||`Variant ${i+1}`,300),cost:num(r.variantSellPrice??r.sellPrice??r.price),stock:num(r.inventoryNum??r.totalInventoryNum??r.stock),attributes:obj(r.attributes),imageUrl:img(r.variantImage||r.image||r.img)}
})}
function normalizeCJ(record:unknown):SupplierListing|null{
 const r=obj(record);const id=str(r.id||r.pid||r.productId,200)
 if(!id)return null
 const image=img(r.bigImage||r.productImage||r.productImageUrl||r.image)
 return {provider:'cj',productId:id,sku:str(r.sku||r.spu||r.productSku||id,200),title:str(r.nameEn||r.productNameEn||r.productName||id,500),imageUrl:image,
  images:linkList(r.productImageSet||r.productImages||r.imgs).length?linkList(r.productImageSet||r.productImages||r.imgs):image?[image]:[],
  currency:'USD',cost:num(r.sellPrice??r.nowPrice??r.discountPrice),stock:num(r.totalVerifiedInventory??r.warehouseInventoryNum),moq:num(r.directMinOrderNum),
  category:str(r.threeCategoryName||r.categoryName||r.categoryId)||null,description:str(r.description||r.productDescription,15000)||null,
  variants:variants(r.variants||r.variantList||r.productVariants),sourceUrl:null,fetchedAt:new Date().toISOString(),provenance:'live_provider_api'}
}
function normalizeFulfillbot(record:unknown):SupplierListing|null{
 const r=obj(record);const id=str(r.productId||r.product_id||r.id||r.itemId,200)
 if(!id)return null
 const image=img(r.image||r.mainImage||r.imageUrl||r.picUrl||r.thumbnail)
 return {provider:'fulfillbot',productId:id,sku:str(r.sku||r.productSku||r.itemId||id,200),title:str(r.title||r.name||r.productName||id,500),imageUrl:image,
  images:linkList(r.images||r.gallery||r.imageUrls).length?linkList(r.images||r.gallery||r.imageUrls):image?[image]:[],
  currency:str(r.currency||r.currencyCode||'CNY',8).toUpperCase(),cost:num(r.price??r.unitPrice??r.salePrice),stock:num(r.stock??r.inventory??r.quantity),moq:num(r.moq??r.minOrderQuantity??r.minimumOrderQty),
  category:str(r.category||r.categoryName)||null,description:str(r.description||r.detail,15000)||null,
  variants:variants(r.skus||r.variants||r.skuList),sourceUrl:img(r.productUrl||r.url),fetchedAt:new Date().toISOString(),provenance:'live_provider_api'}
}
const cfg={
 cj:{name:'CJdropshipping',docs:'https://developers.cjdropshipping.com/en/api/api2/',capabilities:['search','details','variants','inventory','freight','orders','tracking'] as const,note:'Live search and product details implemented; order execution remains governed by existing purchasing approvals.'},
 fulfillbot:{name:'Fulfillbot',docs:'https://app.fulfillbot.com/developer/api-docs',capabilities:['search','details','variants','orders','freight','tracking'] as const,note:'Live sourcing search implemented. Product coverage depends on the provider; purchases require separate approval.'},
 hypersku:{name:'HyperSKU',docs:'https://support.hypersku.com/en/articles/2941652-what-s-hypersku-how-to-sign-up-and-get-started',capabilities:[] as const,note:'Open API is advertised; exact approved endpoints and credentials are required. No guessed calls.'},
 eprolo:{name:'EPROLO',docs:'https://eprolo.com/eprolo-api/',capabilities:[] as const,note:'API document and access must be requested from the account manager. No guessed calls.'}
}
export function providerStates():ProviderState[]{return PROVIDERS.map(id=>{
 const can=id==='cj'?Boolean(process.env.CJ_ACCESS_TOKEN):id==='fulfillbot'?Boolean(process.env.FULFILLBOT_API_KEY):false
 return {id,name:cfg[id].name,docs:cfg[id].docs,capabilities:[...cfg[id].capabilities],mode:id==='hypersku'||id==='eprolo'?'documentation_required':can?'configured':'credential_missing',credentialsConfigured:can,note:cfg[id].note}
})}
async function upstream(url:URL,headers:Record<string,string>):Promise<Record<string,any>>{
 const known=new Set(['developers.cjdropshipping.com','api.fulfillbot.com'])
 if(url.protocol!=='https:'||!known.has(url.hostname))throw Error('Blocked upstream hostname')
 const response=await fetch(url.toString(),{headers:{'Accept':'application/json',...headers},cache:'no-store',signal:AbortSignal.timeout(15000),redirect:'error'})
 if(!response.ok)throw Error(`Supplier API responded HTTP ${response.status}`)
 const raw=await response.text()
 if(raw.length>2_000_000)throw Error('Supplier API response exceeds safe limit')
 let payload:unknown
 try{payload=JSON.parse(raw)}catch{throw Error('Supplier API returned invalid JSON')}
 const data=obj(payload)
 if(data.result===false||data.success===false||data.code&&Number(data.code)!==200&&Number(data.code)!==0)throw Error(`Supplier API rejected request: ${str(data.message||data.code,150)}`)
 return data
}
export async function findSupplierProducts(provider:Provider,query:string,page=1,size=24):Promise<{items:SupplierListing[];total:number|null;page:number;provider:Provider}>{
 if(!PROVIDERS.includes(provider))throw Error('Unknown provider')
 if(!['cj','fulfillbot'].includes(provider))throw Error(`Provider ${provider} requires verified API documentation before live search`)
 const q=str(query,150);if(q.length<2)throw Error('Search query must contain at least 2 characters')
 page=Math.max(1,Math.min(1000,Math.trunc(page)||1));size=Math.max(1,Math.min(60,Math.trunc(size)||24))
 if(provider==='cj'){
  const token=process.env.CJ_ACCESS_TOKEN;if(!token)throw Error('CJ_ACCESS_TOKEN not configured server-side')
  const url=new URL('https://developers.cjdropshipping.com/api2.0/v1/product/listV2')
  url.searchParams.set('keyWord',q);url.searchParams.set('page',String(page));url.searchParams.set('size',String(size))
  const raw=await upstream(url,{'CJ-Access-Token':token})
  const data=obj(raw.data)
  // listV2: data.content = [{ productList: [...] }], NOT data.list.
  const items=arr(data.content).flatMap(c=>arr(obj(c).productList)).map(normalizeCJ).filter((item):item is SupplierListing=>item!==null)
  const total=Number(data.totalRecords)
  return {items,total:Number.isFinite(total)?total:null,page,provider}
 }
 const token=process.env.FULFILLBOT_API_KEY;if(!token)throw Error('FULFILLBOT_API_KEY not configured server-side')
 const url=new URL('https://api.fulfillbot.com/api/v1/open/products/search')
 url.searchParams.set('q',q);url.searchParams.set('page',String(page));url.searchParams.set('limit',String(size))
 const raw=await upstream(url,{Authorization:`Bearer ${token}`})
 const d=raw.data
 const data=obj(d)
 const records=Array.isArray(d)?d:arr(data.items||data.products||data.list||data.results||raw.items)
 const items=records.map(normalizeFulfillbot).filter((item):item is SupplierListing=>item!==null)
 const count=Number(data.total??data.totalCount??raw.total)
 return {items,total:Number.isFinite(count)?count:null,page,provider}
}
export async function fetchSupplierDetail(provider:Provider,id:string):Promise<SupplierListing>{
 const productId=str(id,200)
 if(!productId||!['cj','fulfillbot'].includes(provider))throw Error('Unsupported provider product detail request')
 if(provider==='cj'){
  if(!process.env.CJ_ACCESS_TOKEN)throw Error('CJ_ACCESS_TOKEN not configured')
  const url=new URL('https://developers.cjdropshipping.com/api2.0/v1/product/query')
  url.searchParams.set('pid',productId)
  const data=(await upstream(url,{'CJ-Access-Token':process.env.CJ_ACCESS_TOKEN})).data
  const listing=normalizeCJ(data)
  if(!listing)throw Error('CJ product details are incomplete')
  return listing
 }
 if(!process.env.FULFILLBOT_API_KEY)throw Error('FULFILLBOT_API_KEY not configured')
 const url=new URL(`https://api.fulfillbot.com/api/v1/open/products/${encodeURIComponent(productId)}`)
 const data=(await upstream(url,{Authorization:`Bearer ${process.env.FULFILLBOT_API_KEY}`})).data
 const listing=normalizeFulfillbot(data)
 if(!listing)throw Error('Fulfillbot product details are incomplete')
 return listing
}
