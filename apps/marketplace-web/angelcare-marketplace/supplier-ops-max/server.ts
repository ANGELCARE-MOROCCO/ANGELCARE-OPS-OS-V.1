import { createServiceClient } from '@/lib/supabase/server'
import { getMarketplaceContext, hasMarketplacePermission, hasMarketplaceWorkspaceAccess } from '../auth/context'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { applyProduct360ImportRow, loadProduct360Snapshot, evaluateProduct360Readiness } from '../enterprise-command/product-360-import-engine'
import { commerceResourceAction, createCommerceResource, updateCommerceResource, archiveCommerceResource } from '../commerce-studio/repository'
import { mutate as oneWorldMutate } from '../one-world-currency/server'
import { providerStates, findSupplierProducts, fetchSupplierDetail, searchSupplierWithFilters } from './adapters'
import { cjCategories, cjHealth, cjInventory, cjFreight, cjConfiguration, cjSearchParameters, type CjSearchFilters } from './cj-native'
import { financeCatalogue, proposal as proposeFinanceRule,activateRetail,approvedRetailRule } from './finance-bridge'
import { previewCjSandbox,prepareCjSandbox,submitCjSandbox,reconcileCjSandbox,listCjBridges } from './cj-order-bridge'
import { getDiscoveryItemById } from '../catalog-discovery/repository'
import { readInventory, refreshSelectionInventory } from './inventory-intelligence'
import { evaluateWarehouseStockGate } from './inventory-normalization'
import { PROVIDERS, type Provider, type Selection, type SupplierListing, EMPTY_COMPLIANCE, EMPTY_EDITORIAL, editorialGate, literalText, finiteMoney, supplierKey } from './contract'

type Row=Record<string,any>
const str=(x:unknown,max=300)=>literalText(x,max)
const isProvider=(x:unknown):x is Provider=>typeof x==='string'&&PROVIDERS.includes(x as Provider)
const uuid=(x:unknown)=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(str(x))
const clean=(x:unknown)=>x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,any>:{}
const maxItems=150
async function context(write=false):Promise<MarketplaceRequestContext>{
 const ctx=await getMarketplaceContext()
 if(!ctx)throw new MarketplaceError('AUTHENTICATION_REQUIRED','AngelCare session required')
 if(!hasMarketplaceWorkspaceAccess(ctx,'workspace.supplier_command'))throw new MarketplaceError('PERMISSION_DENIED','Supplier workspace access required')
 if(!hasMarketplacePermission(ctx,write?'marketplace.catalog.manage':'marketplace.catalog.view'))throw new MarketplaceError('PERMISSION_DENIED','Supplier catalogue permission missing')
 return ctx
}
function scope(query:any,ctx:MarketplaceRequestContext){
 return ctx.tenantId?query.eq('tenant_id',ctx.tenantId):query.is('tenant_id',null)
}
function failDb(error:unknown,area:string):never{
 const message=typeof error==='object'&&error&&'message' in error?String((error as Row).message):String(error)
 throw new MarketplaceError('CONFIGURATION_ERROR',`Supplier Ops MAX — ${area}: ${message.slice(0,260)}. Apply the additive Supplier Ops SQL migration if not installed.`)
}
function projection(row:Row):Selection{
 return {
  id:str(row.id),provider:row.provider as Provider,provider_product_id:str(row.provider_product_id),
  title:str(row.title,600),sku:str(row.sku,200),image_url:str(row.image_url,1500)||null,
  currency:str(row.currency,8),cost:row.cost===null?null:Number(row.cost),stock:row.stock===null?null:Number(row.stock),supplier_moq:row.supplier_moq===null?null:Number(row.supplier_moq),
  normalized:row.normalized as SupplierListing,catalog_item_id:str(row.catalog_item_id)||null,
  category_key:str(row.category_key)||null,category_keys:Array.isArray(row.category_keys)?row.category_keys.map(String):row.category_key?[String(row.category_key)]:[],
  canonical_supplier_id:str(row.canonical_supplier_id)||null,supplier_offer_id:str(row.supplier_offer_id)||null,
  selected_variant_ids:Array.isArray(row.selected_variant_ids)?row.selected_variant_ids.map(String):[],
  status:row.status,editorial:{...EMPTY_EDITORIAL,...clean(row.editorial)},
  compliance:{...EMPTY_COMPLIANCE,...clean(row.compliance)},
  target_margin:row.target_margin===null?null:Number(row.target_margin),
  shipping_cost:row.shipping_cost===null?null:Number(row.shipping_cost),
  duty_cost:row.duty_cost===null?null:Number(row.duty_cost),
  updated_at:str(row.updated_at),created_at:str(row.created_at)
 }
}
async function getOne(db:any,ctx:MarketplaceRequestContext,id:unknown):Promise<Selection>{
 if(!uuid(id))throw new MarketplaceError('VALIDATION_ERROR','Selection UUID required')
 const result=await scope(db.from('ac_som_selections').select('*').eq('id',str(id)),ctx).maybeSingle()
 if(result.error)failDb(result.error,'selection lookup')
 if(!result.data)throw new MarketplaceError('NOT_FOUND','Supplier selection not found')
 return projection(result.data)
}
async function requireFreshCjStock(db:any,ctx:MarketplaceRequestContext,selection:Selection){
 if(selection.provider!=='cj'){
  if(selection.stock===null||selection.stock<=0)throw new MarketplaceError('DEPENDENCY_BLOCKED','Positive source inventory required for selected supplier')
  return
 }
 const state=await readInventory(db,ctx.tenantId||null,selection.id)
 if(!state.available)throw new MarketplaceError('DEPENDENCY_BLOCKED','R4 inventory snapshot migration required before CJ product launch')
 const gate=evaluateWarehouseStockGate(state.items,selection.selected_variant_ids)
 if(!gate.ok)throw new MarketplaceError('DEPENDENCY_BLOCKED','Fresh CJ variant warehouse evidence missing: '+gate.missing.slice(0,6).join('; '))
}
async function audit(db:any,ctx:MarketplaceRequestContext,action:string,selectionId:string|null,note:string,details:Row={}){
 const {error}=await db.from('ac_som_events').insert({actor_id:ctx.actor.id,tenant_id:ctx.tenantId||null,territory_id:ctx.territoryId||null,
  selection_id:selectionId,action,note:note.slice(0,500),details})
 if(error)failDb(error,'audit event')
}
export async function loadSupplierOpsMax(){
 const ctx=await context();const db=await createServiceClient()
 const [selections,categories,events,imports]=await Promise.all([
  scope(db.from('ac_som_selections').select('*').neq('status','archived').order('updated_at',{ascending:false}).limit(maxItems),ctx),
  db.from('angelcare_marketplace_catalog_categories').select('id,category_key,title,status,allowed_sellable_types').eq('locale','fr').eq('status','published').limit(500),
  scope(db.from('ac_som_events').select('id,action,note,selection_id,created_at,details').order('created_at',{ascending:false}).limit(65),ctx),
  db.from('angelcare_marketplace_catalog_items').select('id,item_key,status,slug,name_fr,updated_at').like('item_key','ac-supplier-%').order('updated_at',{ascending:false}).limit(120)
 ])
 if(selections.error)failDb(selections.error,'selections')
 if(categories.error)failDb(categories.error,'canonical taxonomy')
 if(events.error)failDb(events.error,'audit')
 if(imports.error)failDb(imports.error,'import history')
 const savedResult=await scope(db.from('ac_som_saved_searches').select('id,name,keyword,provider,filters,updated_at').eq('actor_id',ctx.actor.id).order('updated_at',{ascending:false}).limit(30),ctx)
 const savedSearches=savedResult.error?[]:savedResult.data||[]
 const savedSearchesAvailable=!savedResult.error
 const [finance,bridges,inventory]=await Promise.all([
  financeCatalogue(db),listCjBridges(db).then(items=>({items,available:true})).catch(()=>({items:[],available:false})),
  readInventory(db,ctx.tenantId||null)
 ])
 return {providers:providerStates(),selections:(selections.data||[]).map(projection),categories:categories.data||[],events:events.data||[],imports:imports.data||[],
   generatedAt:new Date().toISOString(),providerDataState:'live_on_request',commercialDataState:'canonical',publication:'existing_commerce_authority',
   finance,cjBridges:bridges,inventory,savedSearches,savedSearchesAvailable,cj:cjConfiguration(),capabilities:{liveProviders:['cj','fulfillbot'],pendingProviderContracts:['hypersku','eprolo'],automaticPaidOrders:false}}
}
export async function supplierOpsSearch(provider:unknown,query:unknown,page:unknown,filters:CjSearchFilters={}){
 await context(false)
 if(!isProvider(provider))throw new MarketplaceError('VALIDATION_ERROR','Unknown supplier connector')
 try{return await searchSupplierWithFilters(provider,{...filters,keyWord:str(query,150)||undefined,page:Number(page)||1})}
 catch(e){throw new MarketplaceError('DEPENDENCY_BLOCKED',e instanceof Error?e.message:'Upstream supplier search failed')}
}
export async function supplierOpsCategories(){await context(false);return {tree:await cjCategories(),source:'CJ API V2',checkedAt:new Date().toISOString()}}
export async function supplierOpsHealth(){await context(false);return cjHealth()}
export async function supplierOpsStock(variantId:unknown){await context(false);return cjInventory(str(variantId,200))}
export async function supplierOpsInventory(selectionId?:unknown){const ctx=await context(false),db=await createServiceClient();return readInventory(db,ctx.tenantId||null,selectionId?str(selectionId):undefined)}
export async function supplierOpsFreight(raw:Record<string,string>){await context(false);return cjFreight({variantId:str(raw.variantId,200),origin:str(raw.origin,2),destination:str(raw.destination,2),quantity:Number(raw.quantity)||1,zip:str(raw.zip,30)||undefined})}
export async function supplierOpsCjOptions(purchaseId:unknown){
 const ctx=await context(false)
 if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Purchase-order information requires administrator')
 if(!uuid(purchaseId))throw new MarketplaceError('VALIDATION_ERROR','Canonical PO UUID required')
 const db=await createServiceClient()
 const po=await db.from('ac_sc_purchase_orders').select('id,reference,status,approved_by,approved_at').eq('id',str(purchaseId)).single()
 if(po.error||!po.data||!['issued','accepted'].includes(po.data.status)||!po.data.approved_by)throw new MarketplaceError('DEPENDENCY_BLOCKED','Issued and approved canonical PO required')
 const lines=await db.from('ac_sc_purchase_lines').select('id,journey_id,supplier_offer_id,quantity').eq('purchase_id',po.data.id)
 if(lines.error)failDb(lines.error,'CJ order options')
 const ids=[...new Set((lines.data||[]).map((x:Row)=>str(x.journey_id)))]
 if(ids.length!==1||!uuid(ids[0]))throw new MarketplaceError('DEPENDENCY_BLOCKED','A single real customer journey is required')
 const journey=await db.from('angelcare_marketplace_journeys').select('id,customer_account_id').eq('id',ids[0]).single()
 if(journey.error||!journey.data?.customer_account_id)throw new MarketplaceError('DEPENDENCY_BLOCKED','Customer account is not linked to the PO')
 const addresses=await db.from('angelcare_marketplace_customer_addresses').select('id,label,city,recipient_name').eq('customer_account_id',journey.data.customer_account_id).eq('status','active').limit(30)
 if(addresses.error)failDb(addresses.error,'CJ customer address choices')
 const options=[] as Row[]
 for(const line of lines.data||[]){
  const selection=await db.from('ac_som_selections').select('id,normalized,selected_variant_ids').eq('supplier_offer_id',line.supplier_offer_id).eq('provider','cj').limit(2)
  if(selection.error)failDb(selection.error,'CJ variant options')
  const record=selection.data?.length===1?selection.data[0]:null
  const variants=(record?.normalized?.variants||[]).filter((x:Row)=>record?.selected_variant_ids?.includes(x.id)).map((x:Row)=>({id:x.id,sku:x.sku,label:x.label}))
  options.push({lineId:line.id,quantity:Number(line.quantity),variants})
 }
 return {purchaseId:po.data.id,reference:po.data.reference,addresses:addresses.data||[],lines:options,personalDataNotInLogs:true}
}
export async function supplierOpsDetail(provider:unknown,productId:unknown){
 await context(false)
 if(!isProvider(provider))throw new MarketplaceError('VALIDATION_ERROR','Unknown supplier connector')
 try{return await fetchSupplierDetail(provider,str(productId,200))}
 catch(e){throw new MarketplaceError('DEPENDENCY_BLOCKED',e instanceof Error?e.message:'Upstream detail failed')}
}
export async function supplierOpsAction(raw:Row){
 const action=str(raw.action,60),ctx=await context(true),db=await createServiceClient()
 if(action==='r4-save-search'){
  const provider=raw.provider
  if(provider!=='cj'&&provider!=='fulfillbot')throw new MarketplaceError('VALIDATION_ERROR','Only authorized live suppliers can be used in saved searches')
  const name=str(raw.name,70),keyword=str(raw.keyword,150)
  if(name.length<3)throw new MarketplaceError('VALIDATION_ERROR','Saved search name must be at least three characters')
  const allowed=['categoryId','countryCode','startSellPrice','endSellPrice','startWarehouseInventory','verifiedWarehouse','productFlag','productType','supplierId','hasCertification','customization','addMarkStatus','orderBy','sort']
  const filters=clean(raw.filters),validated:Row={}
  for(const key of allowed)if(filters[key]!==undefined)validated[key]=filters[key]
  if(provider==='cj')cjSearchParameters({...validated,keyWord:keyword,page:1,size:24})
  else if(!keyword||Object.keys(validated).length)throw new MarketplaceError('VALIDATION_ERROR','Fulfillbot searches require keyword only')
  const count=await scope(db.from('ac_som_saved_searches').select('id',{count:'exact',head:true}).eq('actor_id',ctx.actor.id),ctx)
  if(count.error)failDb(count.error,'saved search availability')
  if((count.count||0)>=30)throw new MarketplaceError('VALIDATION_ERROR','Maximum 30 saved sourcing searches per operator')
  const result=await db.from('ac_som_saved_searches').insert({tenant_id:ctx.tenantId||null,actor_id:ctx.actor.id,provider,name,keyword,filters:validated}).select('id').single()
  if(result.error)failDb(result.error,'saved sourcing search')
  await audit(db,ctx,'r4.search.saved',null,'Operator saved a real-provider sourcing search',{id:result.data.id,provider})
  return {id:result.data.id,stored:true}
 }
 if(action==='r4-delete-search'){
  if(!uuid(raw.id))throw new MarketplaceError('VALIDATION_ERROR','Saved-search UUID required')
  const result=await scope(db.from('ac_som_saved_searches').delete().eq('actor_id',ctx.actor.id).eq('id',str(raw.id)),ctx).select('id')
  if(result.error)failDb(result.error,'saved-search deletion')
  if(!result.data?.length)throw new MarketplaceError('NOT_FOUND','Owned saved search not found')
  await audit(db,ctx,'r4.search.deleted',null,'Operator deleted their saved search',{id:str(raw.id)})
  return {deleted:true}
 }
 if(action==='r4-refresh-inventory'){
  if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Inventory refresh requires authorized admin access')
  const selection=await getOne(db,ctx,raw.id)
  const ids=Array.isArray(raw.variantIds)?raw.variantIds.map((v:unknown)=>str(v,200)):[]
  if(ids.length>12)throw new MarketplaceError('VALIDATION_ERROR','Maximum 12 variants per refresh')
  const result=await refreshSelectionInventory({db,actorId:ctx.actor.id,tenantId:ctx.tenantId||null,selection,variantIds:ids})
  return {...result,source:'CJ_API_V2',stockIsNotReserved:true}
 }
 if(action==='select'){
  const input=clean(raw.product) as SupplierListing
  if(!isProvider(input.provider)||!['cj','fulfillbot'].includes(input.provider)||input.provenance!=='live_provider_api')throw new MarketplaceError('VALIDATION_ERROR','Verified live-provider product required')
  const id=str(input.productId,200)
  if(!id)throw new MarketplaceError('VALIDATION_ERROR','Provider product ID required')
  // Never trust a client-declared provenance flag, product price or image.
  // Re-run the exact read-only source search on the server and use that payload.
  const verified=await searchSupplierWithFilters(input.provider,{...clean(raw.filters),keyWord:str(raw.query,150)||undefined,page:Number(raw.page)||1})
  let product=verified.items.find(x=>x.productId===id)
  if(!product)throw new MarketplaceError('DEPENDENCY_BLOCKED','The provider no longer returned this product; search again')
  if(product.variants.length===0){try{const details=await fetchSupplierDetail(product.provider,product.productId);if(details.productId===product.productId)product=details}catch{/* source search remains authoritative when details endpoint is unavailable */}}
  const title=str(product.title,500),sku=str(product.sku,200)
  if(title.length<3||!sku)throw new MarketplaceError('VALIDATION_ERROR','Verified provider title and SKU required')
  const key=[ctx.tenantId||'global',input.provider,id].join(':')
  const existing=await scope(db.from('ac_som_selections').select('id,editorial,compliance,status').eq('selection_key',key),ctx).maybeSingle()
  if(existing.error)failDb(existing.error,'selection deduplication')
  if(existing.data){
   const updated=await scope(db.from('ac_som_selections').update({normalized:product,title,sku,image_url:product.imageUrl||null,
    currency:str(product.currency,8)||'USD',cost:finiteMoney(product.cost),stock:finiteMoney(product.stock),supplier_moq:finiteMoney(product.moq),updated_at:new Date().toISOString()})
    .eq('id',existing.data.id),ctx).select('*').single()
   if(updated.error)failDb(updated.error,'selection refresh')
   await audit(db,ctx,'selection.refreshed',str(existing.data.id),'Existing curated metadata preserved')
   return {selection:projection(updated.data),created:false}
  }
  const inserted=await db.from('ac_som_selections').insert({selection_key:key,tenant_id:ctx.tenantId||null,territory_id:ctx.territoryId||null,
   provider:input.provider,provider_product_id:id,title,sku,image_url:product.imageUrl||null,currency:str(product.currency,8)||'USD',
   cost:finiteMoney(product.cost),stock:finiteMoney(product.stock),supplier_moq:finiteMoney(product.moq),normalized:product,editorial:EMPTY_EDITORIAL,compliance:EMPTY_COMPLIANCE,
   created_by:ctx.actor.id,status:'selected'}).select('*').single()
  if(inserted.error)failDb(inserted.error,'selection creation')
  await audit(db,ctx,'selection.saved',str(inserted.data.id),'Provider product added to selection',{provider:input.provider,productId:id})
  return {selection:projection(inserted.data),created:true}
 }
 if(action==='edit'){
  const prior=await getOne(db,ctx,raw.id)
  if(prior.status==='archived')throw new MarketplaceError('VALIDATION_ERROR','Archived selection is read only')
  const incoming=clean(raw.patch)
  const patch:Row={updated_at:new Date().toISOString()}
  if('category_key' in incoming||'category_keys' in incoming){
   const chosen=Array.isArray(incoming.category_keys)?[...new Set(incoming.category_keys.map((v:unknown)=>str(v,150)).filter(Boolean))]:[str(incoming.category_key,150)].filter(Boolean)
   if(chosen.length>25)throw new MarketplaceError('VALIDATION_ERROR','Maximum 25 storefront categories per selection')
   const key=str(incoming.category_key||prior.category_key||chosen[0],150)
   if(!chosen.length||!chosen.includes(key))throw new MarketplaceError('VALIDATION_ERROR','Choose primary category within selected categories')
   const categoryRows=await db.from('angelcare_marketplace_catalog_categories').select('id,category_key,allowed_sellable_types').in('category_key',chosen).eq('locale','fr').eq('status','published')
   if(categoryRows.error)failDb(categoryRows.error,'category assignment verification')
   for(const selectedKey of chosen){
    const candidates=(categoryRows.data||[]).filter((x:Row)=>x.category_key===selectedKey)
    if(candidates.length!==1)throw new MarketplaceError('VALIDATION_ERROR','Category unavailable or ambiguous: '+selectedKey)
    const allowed=candidates[0].allowed_sellable_types||[]
    if(allowed.length&&!allowed.includes('product')&&!allowed.includes('physical_product'))throw new MarketplaceError('VALIDATION_ERROR','Category does not accept physical products: '+selectedKey)
   }
   patch.category_keys=chosen
   if(key){const cat=await db.from('angelcare_marketplace_catalog_categories').select('id,allowed_sellable_types').eq('category_key',key).eq('locale','fr').eq('status','published').limit(2)
    if(cat.error)failDb(cat.error,'category mapping')
    if(cat.data.length!==1)throw new MarketplaceError('VALIDATION_ERROR','Category missing or ambiguous; choose a single canonical category')
    const allowed=cat.data[0].allowed_sellable_types||[]
    if(allowed.length&&!allowed.includes('product')&&!allowed.includes('physical_product'))throw new MarketplaceError('VALIDATION_ERROR','Selected category does not support physical products')
   }
   patch.category_key=key||null
  }
  if('canonical_supplier_id' in incoming){
   const supplierId=str(incoming.canonical_supplier_id)
   if(supplierId&&!uuid(supplierId))throw new MarketplaceError('VALIDATION_ERROR','Canonical supplier must be a UUID')
   if(supplierId){
    const q=await db.from('angelcare_marketplace_suppliers').select('id,status,quality_status').eq('id',supplierId).single()
    if(q.error||!q.data||!['approved','active'].includes(q.data.status)||!['approved','conditional'].includes(q.data.quality_status))throw new MarketplaceError('DEPENDENCY_BLOCKED','Canonical supplier must be operational and quality-approved')
   }
   patch.canonical_supplier_id=supplierId||null
  }
  if('selected_variant_ids' in incoming){
   if(!Array.isArray(incoming.selected_variant_ids))throw new MarketplaceError('VALIDATION_ERROR','Selected variants must be an array')
   const known=new Set(prior.normalized.variants.map(x=>x.id)),ids=[...new Set(incoming.selected_variant_ids.map(String))]
   if(ids.length>120||ids.some(id=>!known.has(id)))throw new MarketplaceError('VALIDATION_ERROR','Unknown provider variant')
   patch.selected_variant_ids=ids
  }
  if('image_url' in incoming){
   const requested=str(incoming.image_url,1500)
   if(!prior.normalized.images.includes(requested))throw new MarketplaceError('VALIDATION_ERROR','Image must originate from live provider gallery')
   patch.image_url=requested
  }
  if('editorial' in incoming){
   const ed=clean(incoming.editorial),out:Row={...prior.editorial}
   for(const key of Object.keys(EMPTY_EDITORIAL))if(Object.hasOwn(ed,key))out[key]=str(ed[key],key.startsWith('description_')?15000:3000)
   patch.editorial=out
  }
  if('compliance' in incoming){
   const cc=clean(incoming.compliance),out:Row={...prior.compliance}
   for(const key of Object.keys(EMPTY_COMPLIANCE))if(Object.hasOwn(cc,key))out[key]=key==='evidenceNotes'?str(cc[key],3000):cc[key]===true
   patch.compliance=out
  }
  for(const key of ['target_margin','shipping_cost','duty_cost','supplier_moq'])if(Object.hasOwn(incoming,key)){
   const n=finiteMoney(incoming[key]);if(n===null&&incoming[key]!==null&&incoming[key]!=='')throw new MarketplaceError('VALIDATION_ERROR','Invalid '+key)
   if(key==='supplier_moq'&&n!==null&&n<=0)throw new MarketplaceError('VALIDATION_ERROR','Supplier MOQ must be positive')
   if(key==='target_margin'&&n!==null&&n>=1)throw new MarketplaceError('VALIDATION_ERROR','Margin must be below 100%')
   patch[key]=n
  }
  if('status' in incoming){
   const next=str(incoming.status)
   if(!['selected','review','ready','archived'].includes(next))throw new MarketplaceError('VALIDATION_ERROR','Invalid selection status')
   if(next==='ready'){const gate=editorialGate({...prior,...patch,editorial:{...prior.editorial,...patch.editorial},compliance:{...prior.compliance,...patch.compliance}} as Selection)
     if(!gate.ok)throw new MarketplaceError('VALIDATION_ERROR','Readiness blocked: '+gate.missing.slice(0,12).join(', '))}
   patch.status=next
  }
  const updated=await scope(db.from('ac_som_selections').update(patch).eq('id',prior.id),ctx).select('*').single()
  if(updated.error)failDb(updated.error,'selection update')
  await audit(db,ctx,'selection.edited',prior.id,'Curation, mapping or evidence updated',{changed:Object.keys(patch).filter(x=>x!=='updated_at')})
  return {selection:projection(updated.data),gate:editorialGate(projection(updated.data))}
 }
 if(action==='refresh'){
  const previous=await getOne(db,ctx,raw.id)
  const newListing=await supplierOpsDetail(previous.provider,previous.provider_product_id)
  if(newListing.productId!==previous.provider_product_id)throw new MarketplaceError('DEPENDENCY_BLOCKED','Provider identity drift')
  const result=await scope(db.from('ac_som_selections').update({normalized:newListing,title:newListing.title,
   image_url:newListing.imageUrl,sku:newListing.sku,stock:newListing.stock,cost:newListing.cost,supplier_moq:newListing.moq,updated_at:new Date().toISOString()}).eq('id',previous.id),ctx).select('*').single()
  if(result.error)failDb(result.error,'live product refresh')
  await audit(db,ctx,'selection.provider_refresh',previous.id,'Product detail refreshed from provider')
  return {selection:projection(result.data)}
 }
 if(action==='import-draft'){
  if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Admin approval required for canonical import')
  const selection=await getOne(db,ctx,raw.id)
  if(selection.catalog_item_id)return {catalogId:selection.catalog_item_id,linked:true,message:'Existing canonical product; no duplicate created'}
  if(!selection.canonical_supplier_id)throw new MarketplaceError('DEPENDENCY_BLOCKED','Map a quality-approved canonical supplier before import')
  const gate=editorialGate(selection)
  if(!gate.ok)throw new MarketplaceError('DEPENDENCY_BLOCKED','Complete selection dossier before import: '+gate.missing.join(', '))
  await requireFreshCjStock(db,ctx,selection)
  const imageAge=Date.now()-new Date(selection.normalized.fetchedAt).valueOf()
  if(!Number.isFinite(imageAge)||imageAge>24*60*60*1000)throw new MarketplaceError('DEPENDENCY_BLOCKED','Supplier snapshot older than 24h. Refresh product first.')
  const e=selection.editorial,key=supplierKey(selection.provider,selection.provider_product_id)
  const before=await db.from('angelcare_marketplace_catalog_items').select('id,item_key,commercial_metadata').eq('item_key',key).maybeSingle()
  if(before.error)failDb(before.error,'canonical deduplication')
  if(before.data){
   const origin=clean(before.data.commercial_metadata)
   if(!str(origin.import_note,2000).includes(`Supplier Ops MAX · ${selection.provider} · ${selection.provider_product_id} ·`))throw new MarketplaceError('DEPENDENCY_BLOCKED','Canonical identity collision — manual review required')
   const linked=await scope(db.from('ac_som_selections').update({catalog_item_id:before.data.id,status:'imported',updated_at:new Date().toISOString()}).eq('id',selection.id),ctx).select('*').single()
   if(linked.error)failDb(linked.error,'canonical relink')
   return {catalogId:before.data.id,linked:true,message:'Recovered existing product without recreating'}
  }
  const normalized:Row={
   item_key:key,slug:key,sku:selection.sku,kind:'product',sellable_type:'physical_product',inventory_mode:'external_supplier',delivery_mode:'delivery',
   name_fr:e.name_fr,name_en:e.name_en,name_ar:e.name_ar,
   short_description_fr:e.short_fr,short_description_en:e.short_en,short_description_ar:e.short_ar,
   description_fr:e.description_fr,description_en:e.description_en,description_ar:e.description_ar,
   category_keys:selection.category_keys,primary_category_key:selection.category_key,
   primary_image_reference:selection.image_url,
   gallery_references:selection.normalized.images.filter(x=>x!==selection.image_url).slice(0,10),
   variants_json:selection.normalized.variants.filter(v=>selection.selected_variant_ids.includes(v.id)).map(v=>({variant_key:v.id.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,90),name_fr:v.label,name_en:v.label,sku:v.sku,status:'active',inventory_reference:v.id})),
   seo_title_fr:e.seo_title_fr,seo_description_fr:e.seo_description_fr,
   seo_title_en:e.seo_title_en,seo_description_en:e.seo_description_en,
   seo_title_ar:e.seo_title_ar,seo_description_ar:e.seo_description_ar,
   price_mode:'quote_only',currency_label:'MAD',status:'draft',availability_status:'available',
   territory_mode:'national',territory_fallback_behavior:'request_quote',
   fulfillment_mode:'provider',fulfillment_lead_time:e.fulfillment_lead_time,
   fulfillment_delivery_method:e.fulfillment_delivery_method,fulfillment_capacity_model:'provider_capacity',
   fulfillment_customer_handover:e.fulfillment_customer_handover,
   trust_headline:e.trust_headline,trust_certifications:e.trust_certifications,
   trust_guarantees:e.trust_guarantees,trust_safety_information:e.trust_safety_information,
   trust_provider_requirements:e.trust_provider_requirements,
   sourcing_source_type:'vendor',sourcing_required_capabilities:['supplier_stock','tracking','destination_compliance'],
   sourcing_assignment_strategy:'manual',
   import_note:`Supplier Ops MAX · ${selection.provider} · ${selection.provider_product_id} · ${new Date().toISOString()}`
  }
  // Canonical Product 360 import is non-atomic across tables but has snapshot/restore
  // on failure. No custom parallel catalogue and no direct publication in this operation.
  const response=await applyProduct360ImportRow({db,context:ctx,doctrineKey:'physical_product',source:normalized,normalized,
   action:'create',importJobId:crypto.randomUUID(),requestId:crypto.randomUUID(),allowIncompleteDraft:false})
  const linked=await scope(db.from('ac_som_selections').update({catalog_item_id:response.itemId,status:'imported',updated_at:new Date().toISOString()}).eq('id',selection.id),ctx).select('*').single()
  if(linked.error){await audit(db,ctx,'import.link_pending',selection.id,'Canonical product created; linking needs recovery',{catalogId:response.itemId});failDb(linked.error,'canonical import mapping')}
  await audit(db,ctx,'import.canonical_draft',selection.id,'Canonical product created as a draft only',{catalogId:response.itemId,readiness:response.readiness})
  return {catalogId:response.itemId,readiness:response.readiness,status:'draft',publication:'NOT_AUTOMATIC'}
 }
 if(action==='one-world-simulate'){
  if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Finance simulation requires admin access')
  const selection=await getOne(db,ctx,raw.id)
  // The canonical ONE WORLD quote authority consumes USD. No fabricated source FX.
  if(selection.currency!=='USD')throw new MarketplaceError('DEPENDENCY_BLOCKED','Supplier quote must first be converted into verified USD before ONE WORLD simulation')
  if(selection.cost===null||selection.cost<=0||selection.shipping_cost===null||selection.duty_cost===null)throw new MarketplaceError('DEPENDENCY_BLOCKED','Supplier price, verified freight and known customs/taxes required')
  const country=str(raw.country,2).toUpperCase()
  if(!/^[A-Z]{2}$/.test(country))throw new MarketplaceError('VALIDATION_ERROR','ISO destination country required')
  const usd=(selection.cost+selection.shipping_cost+selection.duty_cost).toFixed(6)
  const simulated=await oneWorldMutate({action:'simulate',usd,country},ctx.actor.id)
  await audit(db,ctx,'pricing.one_world_shadow',selection.id,'ONE WORLD authority calculated a shadow destination quote',{country,usd,simulationId:simulated.simulationId})
  return {...simulated,source:'ONE_WORLD_NATIVE_SHADOW',approval:'NOT_A_CUSTOMER_PRICE_OR_APPROVED_PRICE_BOOK'}
 }
 if(action==='sync-categories'){
  if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Canonical admin rights required')
  const selection=await getOne(db,ctx,raw.id)
  if(!selection.catalog_item_id||!selection.category_key||!selection.category_keys.length)throw new MarketplaceError('VALIDATION_ERROR','Import and select eligible categories first')
  const item=await db.from('angelcare_marketplace_catalog_items').select('id,status,sellable_type').eq('id',selection.catalog_item_id).maybeSingle()
  if(item.error||!item.data)throw new MarketplaceError('DEPENDENCY_BLOCKED','Canonical product no longer exists')
  if(item.data.status==='published')throw new MarketplaceError('INVALID_STATE_TRANSITION','Unpublish via canonical Commerce Studio before changing live assignments')
  if(!['physical_product','product'].includes(str(item.data.sellable_type)))throw new MarketplaceError('VALIDATION_ERROR','Category syncing requires a physical product')
  const lookup=await db.from('angelcare_marketplace_catalog_categories').select('id,category_key,territory_id,allowed_sellable_types').in('category_key',selection.category_keys).eq('locale','fr').eq('status','published')
  if(lookup.error)failDb(lookup.error,'canonical category lookup')
  const categories=new Map<string,Row>()
  for(const key of selection.category_keys){
   const candidates=(lookup.data||[]).filter((c:Row)=>c.category_key===key)
   const global=candidates.filter((c:Row)=>!c.territory_id)
   const category=global.length===1?global[0]:candidates.length===1?candidates[0]:null
   if(!category)throw new MarketplaceError('VALIDATION_ERROR',`Missing or ambiguous canonical category: ${key}`)
   const allowed=category.allowed_sellable_types||[]
   if(allowed.length&&!allowed.includes('physical_product')&&!allowed.includes('product'))throw new MarketplaceError('VALIDATION_ERROR',`Ineligible storefront category: ${key}`)
   categories.set(key,category)
  }
  if(!categories.has(selection.category_key))throw new MarketplaceError('VALIDATION_ERROR','Primary must be selected')
  const before=await db.from('angelcare_marketplace_catalog_item_categories').select('id,category_id,is_primary,sort_order').eq('catalog_item_id',selection.catalog_item_id)
  if(before.error)failDb(before.error,'existing assignment lookup')
  const desiredIds=new Set([...categories.values()].map((c:Row)=>str(c.id)))
  // Two-phase mutation avoids temporarily creating two primary assignments.
  // All changes pass through Commerce Studio audit/version/cache invalidation.
  const existingPrimary=(before.data||[]).find((c:Row)=>c.is_primary)
  const requestedPrimaryId=str((categories.get(selection.category_key) as Row).id)
  if(existingPrimary&&str(existingPrimary.category_id)!==requestedPrimaryId){
   await updateCommerceResource({resource:'catalog-item-categories',id:str(existingPrimary.id),payload:{is_primary:false},context:ctx})
  }
  for(const [index,key] of selection.category_keys.entries()){
   const category=categories.get(key) as Row
   const existing=(before.data||[]).find((c:Row)=>c.category_id===category.id)
   const payload={catalog_item_id:selection.catalog_item_id,category_id:category.id,is_primary:!!(existing&&existing.is_primary&&str(existing.category_id)===requestedPrimaryId),sort_order:index*10}
   if(existing)await updateCommerceResource({resource:'catalog-item-categories',id:str(existing.id),payload,context:ctx})
   else await createCommerceResource({resource:'catalog-item-categories',payload:{...payload,is_primary:false},context:ctx})
  }
  for(const extra of before.data||[])if(!desiredIds.has(str(extra.category_id)))await archiveCommerceResource({resource:'catalog-item-categories',id:str(extra.id),context:ctx})
  // Primary assignment is a final explicit and verified mutation.
  const refreshed=await db.from('angelcare_marketplace_catalog_item_categories').select('id,category_id,is_primary').eq('catalog_item_id',selection.catalog_item_id).eq('category_id',requestedPrimaryId).maybeSingle()
  if(refreshed.error||!refreshed.data)throw new MarketplaceError('DEPENDENCY_BLOCKED','Primary category not persisted; retry synchronization')
  if(!refreshed.data.is_primary)await updateCommerceResource({resource:'catalog-item-categories',id:str(refreshed.data.id),payload:{is_primary:true},context:ctx})
  const after=await db.from('angelcare_marketplace_catalog_item_categories').select('category_id,is_primary').eq('catalog_item_id',selection.catalog_item_id)
  if(after.error)failDb(after.error,'assignment verification')
  const final=after.data||[]
  if(final.length!==desiredIds.size||final.filter((c:Row)=>c.is_primary).length!==1||final.some((c:Row)=>!desiredIds.has(str(c.category_id))))throw new MarketplaceError('DEPENDENCY_BLOCKED','Category verification mismatch; safely retry synchronization')
  await audit(db,ctx,'categories.canonical_synced',selection.id,'Storefront categories synchronized through Commerce Studio',{categoryKeys:selection.category_keys,primary:selection.category_key})
  return {catalogId:selection.catalog_item_id,assigned:final.length,primary:selection.category_key,verified:true}
 }
 if(action==='link-offer'){
  if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Supplier approval required')
  const selection=await getOne(db,ctx,raw.id)
  if(!selection.catalog_item_id||!selection.canonical_supplier_id)throw new MarketplaceError('DEPENDENCY_BLOCKED','Import and canonical supplier mapping required')
  if(selection.supplier_offer_id)return {offerId:selection.supplier_offer_id,linked:true}
  if(selection.cost===null||selection.cost<=0||selection.supplier_moq===null||selection.supplier_moq<=0)throw new MarketplaceError('VALIDATION_ERROR','Verified positive cost and MOQ required')
  const verified=await db.from('angelcare_marketplace_suppliers').select('id,status,quality_status').eq('id',selection.canonical_supplier_id).single()
  if(verified.error||!verified.data||!['approved','active'].includes(verified.data.status)||!['approved','conditional'].includes(verified.data.quality_status))throw new MarketplaceError('DEPENDENCY_BLOCKED','Supplier qualification required')
  const existing=await db.from('angelcare_marketplace_supplier_offers').select('id').eq('supplier_id',selection.canonical_supplier_id).eq('catalog_item_id',selection.catalog_item_id).eq('supplier_sku',selection.sku).limit(2)
  if(existing.error)failDb(existing.error,'offer deduplication')
  let offerId=str(existing.data?.[0]?.id)
  if(!offerId){
   const response=await db.rpc('ac_sc_command',{p_actor:ctx.actor.id,p_action:'offer.save',p_payload:{supplierId:selection.canonical_supplier_id,
    catalogId:selection.catalog_item_id,sku:selection.sku,currency:selection.currency,unitCost:String(selection.cost),moq:String(selection.supplier_moq)},
    p_key:crypto.randomUUID(),p_reason:'Supplier Ops MAX: canonical provider offer — human approval required'})
   if(response.error)throw new MarketplaceError('DEPENDENCY_BLOCKED','Canonical supplier offer failed: '+response.error.message.slice(0,200))
   offerId=str(response.data?.id)
  }
  if(!offerId)throw new MarketplaceError('DEPENDENCY_BLOCKED','Canonical supplier offer returned no ID')
  const upd=await scope(db.from('ac_som_selections').update({supplier_offer_id:offerId,updated_at:new Date().toISOString()}).eq('id',selection.id),ctx)
  if(upd.error)failDb(upd.error,'supplier offer linkage')
  await audit(db,ctx,'offer.canonical_linked',selection.id,'Supplier offer linked; approval remains within Supplier 360',{offerId})
  return {offerId,linked:true,approval:'PENDING_CANONICAL_SUPPLIER_OFFER_APPROVAL'}
 }
 if(action==='finance-propose'){
  if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Finance proposal requires marketplace administrator')
  const selection=await getOne(db,ctx,raw.id)
  const out=await proposeFinanceRule(ctx,db,selection,raw)
  await audit(db,ctx,'finance.price_rule_proposed',selection.id,'Draft rule submitted to canonical Finance for independent approval',{ruleId:out.ruleId,bookId:raw.priceBookId})
  return out
 }
 if(action==='finance-activate'){
  if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Finance activation requires marketplace administrator')
  const selection=await getOne(db,ctx,raw.id)
  if(raw.confirm!==`ACTIVATE PRICE ${selection.id}`)throw new MarketplaceError('VALIDATION_ERROR','Type ACTIVATE PRICE <selection UUID>')
  const out=await activateRetail(ctx,db,selection)
  await audit(db,ctx,'finance.approved_retail_activated',selection.id,'Applied approved, active Finance rule; no independent price authority',{ruleId:out.sourceRuleId})
  return out
 }
 if(action==='cj-preview'||action==='cj-prepare'||action==='cj-submit'||action==='cj-reconcile'){
  if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','CJ order authority requires marketplace administrator')
  if(action==='cj-preview')return previewCjSandbox(ctx,db,raw)
  if(action==='cj-prepare')return prepareCjSandbox(ctx,db,raw)
  if(action==='cj-submit')return submitCjSandbox(ctx,db,raw)
  return reconcileCjSandbox(ctx,db,raw)
 }
 if(action==='verify-public'){
  const selection=await getOne(db,ctx,raw.id)
  if(!selection.catalog_item_id||!selection.category_keys.length)throw new MarketplaceError('VALIDATION_ERROR','Imported product and at least one assigned category required')
  const item=await getDiscoveryItemById({locale:'fr',id:selection.catalog_item_id})
  if(!item)throw new MarketplaceError('DEPENDENCY_BLOCKED','Canonical public discovery projection does not contain this product')
  const perCategory=[] as {key:string;present:boolean}[]
  for(const key of selection.category_keys){
   const membership=await db.from('angelcare_marketplace_catalog_discovery_memberships_v').select('id').eq('assigned_category_key',key).eq('id',selection.catalog_item_id).eq('status','published').limit(1)
   if(membership.error)failDb(membership.error,'public category projection')
   perCategory.push({key,present:!!membership.data?.length})
  }
  if(perCategory.some(x=>!x.present))throw new MarketplaceError('DEPENDENCY_BLOCKED','At least one assigned public category cannot retrieve the product')
  await audit(db,ctx,'publication.discovery_projection_verified',selection.id,'Canonical public catalogue view verified, HTTP rendering still requires live test',{catalogId:selection.catalog_item_id,categories:perCategory.map(x=>x.key)})
  return {catalogId:selection.catalog_item_id,projection:'PUBLIC_CATALOG_DISCOVERY_VERIFIED',categories:perCategory,
   link:`/angelcare-marketplace/fr/marketplace/item/${item.slug}`,httpRendering:'NOT_TESTED',checkout:'NOT_TESTED'}
 }
 if(action==='readiness'){
  const selection=await getOne(db,ctx,raw.id)
  if(!selection.catalog_item_id)throw new MarketplaceError('VALIDATION_ERROR','Selection not imported')
  const snapshot=await loadProduct360Snapshot(selection.catalog_item_id,db)
  return {catalogId:selection.catalog_item_id,readiness:evaluateProduct360Readiness(snapshot,'physical_product')}
 }
 if(action==='publish'){
  if(!hasMarketplacePermission(ctx,'marketplace.catalog.publish')||!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Admin and publish permissions required')
  const selection=await getOne(db,ctx,raw.id)
  if(!selection.catalog_item_id)throw new MarketplaceError('VALIDATION_ERROR','Canonical import required before publication')
  if(!selection.supplier_offer_id)throw new MarketplaceError('DEPENDENCY_BLOCKED','Canonical supplier offer must be linked and approved first')
  await requireFreshCjStock(db,ctx,selection)
  if(Date.now()-new Date(selection.normalized.fetchedAt).valueOf()>24*60*60*1000)throw new MarketplaceError('DEPENDENCY_BLOCKED','Supplier product specifications older than 24h: refresh the product dossier')
  const offer=await db.from('angelcare_marketplace_supplier_offers').select('id,status').eq('id',selection.supplier_offer_id).single()
  if(offer.error||!offer.data||!['approved','active'].includes(offer.data.status))throw new MarketplaceError('DEPENDENCY_BLOCKED','Supplier offer requires approval in existing Supplier 360')
  const catRows=await db.from('angelcare_marketplace_catalog_item_categories').select('category_id,is_primary').eq('catalog_item_id',selection.catalog_item_id)
  if(catRows.error)failDb(catRows.error,'canonical category pre-publish')
  const categoryLookup=await db.from('angelcare_marketplace_catalog_categories').select('id,category_key,territory_id').in('category_key',selection.category_keys).eq('locale','fr').neq('status','archived')
  if(categoryLookup.error)failDb(categoryLookup.error,'category pre-publish resolution')
  const mapped=new Map<string,string>()
  for(const key of selection.category_keys){const rows=(categoryLookup.data||[]).filter((r:Row)=>r.category_key===key),global=rows.filter((r:Row)=>!r.territory_id),cat=global.length===1?global[0]:rows.length===1?rows[0]:null
   if(!cat)throw new MarketplaceError('DEPENDENCY_BLOCKED','Category mapping ambiguous; synchronize first: '+key)
   mapped.set(key,str(cat.id))}
  const expected=new Set(mapped.values()),active=catRows.data||[]
  if(active.length!==expected.size||active.some((r:Row)=>!expected.has(str(r.category_id)))||active.filter((r:Row)=>r.is_primary).length!==1||!active.some((r:Row)=>r.is_primary&&str(r.category_id)===mapped.get(selection.category_key ?? '')))throw new MarketplaceError('DEPENDENCY_BLOCKED','Storefront assignments changed; use Sync categories first')
  // Fresh stock, vendor qualification, compliance and explicit acknowledgement are
  // additional gates. The existing Commerce Studio still decides publication.
  const gate=editorialGate(selection)
  if(!gate.ok)throw new MarketplaceError('DEPENDENCY_BLOCKED','Supplier evidence incomplete: '+gate.missing.join(', '))
  if(raw.confirm!==`PUBLISH ${selection.id}`)throw new MarketplaceError('VALIDATION_ERROR','Type PUBLISH <selection UUID> to confirm')
  const approvedPrice=await approvedRetailRule(db,selection.catalog_item_id)
  const canonicalRetail=await db.from('angelcare_marketplace_catalog_items').select('price_mode,price_amount,currency_label').eq('id',selection.catalog_item_id).single()
  if(canonicalRetail.error||canonicalRetail.data?.price_mode!=='fixed'||Number(canonicalRetail.data.price_amount)!==approvedPrice.price||!['MAD','Dh'].includes(str(canonicalRetail.data.currency_label)))
   throw new MarketplaceError('DEPENDENCY_BLOCKED','Approved MAD Finance rule must be activated on canonical Product 360 before retail publication')
  const snapshot=await loadProduct360Snapshot(selection.catalog_item_id,db)
  const readiness=evaluateProduct360Readiness(snapshot,'physical_product')
  if(!readiness.ready)throw new MarketplaceError('DEPENDENCY_BLOCKED','Product 360: '+readiness.reasons.join(', '))
  await commerceResourceAction({resource:'catalog-items',id:selection.catalog_item_id,action:'publish',payload:{},context:ctx})
  const marked=await scope(db.from('ac_som_selections').update({status:'published',updated_at:new Date().toISOString()}).eq('id',selection.id),ctx)
  if(marked.error)failDb(marked.error,'published status synchronization')
  await audit(db,ctx,'publication.canonical',selection.id,'Published via Commerce Studio authority',{catalogId:selection.catalog_item_id})
  return {catalogId:selection.catalog_item_id,publication:'CANONICAL_PUBLISHED_STOREFRONT_UNVERIFIED',nextAction:'Inspect each assigned public storefront and actual customer product detail before certifying publication'}
 }
 throw new MarketplaceError('VALIDATION_ERROR','Unknown Supplier Ops MAX action')
}
