import { createServiceClient } from '@/lib/supabase/server'
import { getMarketplaceContext, hasMarketplacePermission, hasMarketplaceWorkspaceAccess } from '../auth/context'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { createCommerceResource, commerceResourceAction, getCommerceResource } from '../commerce-studio/repository'
import { getCatalogItemBySlug } from '../marketplace-core/repository'
import { evaluateProduct360Readiness, loadProduct360Snapshot } from '../enterprise-command/product-360-import-engine'

type Obj=Record<string,unknown>
const str=(v:unknown)=>String(v??'').trim()
const id=(v:unknown)=>{const s=str(v);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s))throw new MarketplaceError('VALIDATION_ERROR','Invalid ID');return s}
function requires(ctx:MarketplaceRequestContext,permission:'marketplace.catalog.manage'|'marketplace.catalog.view'|'marketplace.catalog.publish') {
 if(!hasMarketplacePermission(ctx,permission))throw new MarketplaceError('PERMISSION_DENIED','Permission Marketplace requise : '+permission)
}
export async function launchContext(){
 const ctx=await getMarketplaceContext()
 if(!ctx)throw new MarketplaceError('AUTHENTICATION_REQUIRED','Authentification requise')
 if(!hasMarketplaceWorkspaceAccess(ctx,'workspace.supplier_command'))throw new MarketplaceError('PERMISSION_DENIED','Supplier Command requis')
 return ctx
}
async function supplierQualifies(supplierId:string){
 const db=await createServiceClient()
 const {data,error}=await db.from('angelcare_marketplace_suppliers').select('id,status,quality_status,display_name').eq('id',supplierId).single()
 if(error||!data)throw new MarketplaceError('NOT_FOUND','Fournisseur absent')
 if(!['approved','active'].includes(data.status)||!['approved','conditional'].includes(data.quality_status))throw new MarketplaceError('DEPENDENCY_BLOCKED','Qualification fournisseur non approuvée')
 return data
}
export async function loadProductLaunch(productId?:string){
 const ctx=await launchContext();requires(ctx,'marketplace.catalog.view')
 const db=await createServiceClient()
 const {data:suppliers,error:se}=await db.from('angelcare_marketplace_suppliers').select('id,display_name,supplier_code,status,quality_status').neq('status','archived').order('display_name').limit(250)
 if(se)throw new MarketplaceError('CONFIGURATION_ERROR','Impossible de lire les fournisseurs')
 const {data:categories,error:ce}=await db.from('angelcare_marketplace_catalog_categories').select('id,title,slug,status').eq('status','published').limit(300)
 if(ce)throw new MarketplaceError('CONFIGURATION_ERROR','Catégories canoniques indisponibles')
 let product=null,offers:Obj[]=[],readiness=null,publicResult=null
 if(productId){
  const pid=id(productId)
  product=await getCommerceResource('catalog-items',pid)
  if(!product)throw new MarketplaceError('NOT_FOUND','Produit canonique introuvable')
  const {data, error}=await db.from('angelcare_marketplace_supplier_offers').select('id,supplier_id,status,supplier_sku,unit_cost,currency_label').eq('catalog_item_id',pid).limit(150)
  if(error)throw new MarketplaceError('CONFIGURATION_ERROR','Offres source indisponibles')
  offers=data||[]
  const snapshot=await loadProduct360Snapshot(pid,db)
  readiness=evaluateProduct360Readiness(snapshot,str(snapshot.sellable_type)||str(snapshot.kind))
  if(str(product.status)==='published'&&str(product.slug)){
   publicResult=await getCatalogItemBySlug({slug:str(product.slug),publicOnly:true})
  }
 }
 return {suppliers:suppliers||[],categories:categories||[],product,offers,readiness,publicVisible:Boolean(publicResult),mode:'guarded',publicCurrencyBridge:'NOT_INTEGRATED'}
}
export async function productLaunchAction(raw:Obj){
 const ctx=await launchContext();const action=str(raw.action)
 if(action==='createDraft'){
  requires(ctx,'marketplace.catalog.manage')
  const sid=id(raw.supplierId);await supplierQualifies(sid)
  const name=str(raw.nameFr),short=str(raw.shortFr),desc=str(raw.descriptionFr),sku=str(raw.sku)
  if(name.length<5||name.length>180||short.length<15||desc.length<40||sku.length<2)throw new MarketplaceError('VALIDATION_ERROR','Nom, descriptions et SKU sont requis')
  const key='sc360-'+crypto.randomUUID().replaceAll('-','').slice(0,14)
  const result=await createCommerceResource({resource:'catalog-items',context:ctx,payload:{
   item_key:key,sku,slug:key,kind:'product',sellable_type:'physical_product',
   name_fr:name,short_description_fr:short,description_fr:desc,
   price_mode:'quote_only',price_amount:null,currency_label:'Dh',
   availability_status:'configuration_required',status:'draft',
   commercial_metadata:{origin:'supplier-command-360',supplier_id:sid,source_sku:sku,retail_base:'USD',retail_conversion_state:'not_integrated'},
  }})
  // Creation of the canonical draft is separate from offer linkage to avoid pretending
  // a multi-service transaction occurred. The UI retains this ID for resumable linking.
  return {catalogId:str(result.record.id),slug:str(result.record.slug),status:'draft',next:'LINK_SUPPLIER_OFFER',supplierId:sid}
 }
 if(action==='publish'){
  requires(ctx,'marketplace.catalog.publish');requires(ctx,'marketplace.catalog.manage')
  if(!hasMarketplacePermission(ctx,'marketplace.admin.access'))throw new MarketplaceError('PERMISSION_DENIED','Publication réservée à un administrateur')
  const pid=id(raw.catalogId)
  const db=await createServiceClient()
  const {data:item,error:ie}=await db.from('angelcare_marketplace_catalog_items').select('id,status,slug,kind,price_mode,currency_label,availability_status,commercial_metadata').eq('id',pid).single()
  if(ie||!item)throw new MarketplaceError('NOT_FOUND','Produit introuvable')
  if(item.kind!=='product'&&item.kind!=='kit')throw new MarketplaceError('VALIDATION_ERROR','Seuls les produits et kits sont pris en charge')
  // No foreign-currency retail payment can be activated while PayPal/Currency
  // presentment integrations remain unchanged. Quote-only publication is allowed.
  if(item.price_mode!=='quote_only')throw new MarketplaceError('DEPENDENCY_BLOCKED','Publication de prix encaissable bloquée : adaptateur USD/ONE WORLD non intégré')
  const {data:offers,error:oe}=await db.from('angelcare_marketplace_supplier_offers').select('supplier_id,status').eq('catalog_item_id',pid).in('status',['approved','active']).limit(100)
  if(oe)throw new MarketplaceError('CONFIGURATION_ERROR','Offres fournisseurs indisponibles')
  if(!offers?.length)throw new MarketplaceError('DEPENDENCY_BLOCKED','Offre fournisseur approuvée requise')
  let qualified=false
  for(const offer of offers){try{await supplierQualifies(String(offer.supplier_id));qualified=true;break}catch{/* other supplier may qualify */}}
  if(!qualified)throw new MarketplaceError('DEPENDENCY_BLOCKED','Aucun fournisseur qualifié pour ce produit')
  const snapshot=await loadProduct360Snapshot(pid,db)
  const readiness=evaluateProduct360Readiness(snapshot,str(snapshot.sellable_type)||str(snapshot.kind))
  if(!readiness.ready)throw new MarketplaceError('INVALID_STATE_TRANSITION','Product 360 incomplet : '+readiness.reasons.join(', '))
  if(item.status!=='approved'&&item.status!=='paused')throw new MarketplaceError('INVALID_STATE_TRANSITION','Produit à approuver dans Product 360 avant publication')
  await commerceResourceAction({resource:'catalog-items',id:pid,action:'publish',payload:{},context:ctx})
  const readback=await getCatalogItemBySlug({slug:String(item.slug),publicOnly:true})
  if(!readback)throw new MarketplaceError('LIVE_VERIFICATION_FAILED','Publication écrite mais non visible en lecture canonique. Inspection requise.')
  return {catalogId:pid,slug:String(item.slug),status:'published',publicVisible:true}
 }
 throw new MarketplaceError('VALIDATION_ERROR','Action de lancement inconnue')
}
