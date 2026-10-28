import { createServiceClient } from '@/lib/supabase/server'
import { getMarketplaceContext, hasMarketplacePermission, hasMarketplaceWorkspaceAccess } from '../auth/context'
import { MarketplaceError } from '../server/errors'
import type { MarketplaceRequestContext } from '../domain/types'

type Row=Record<string,unknown>
const str=(v:unknown)=>String(v??'').trim()
const uuid=(v:unknown)=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(str(v))
const cleanDecimal=(v:unknown)=>/^\d+(?:\.\d{1,8})?$/.test(str(v)) && Number(str(v))>0
async function requireOperator(write:boolean){
 const ctx=await getMarketplaceContext()
 if(!ctx)throw new MarketplaceError('AUTHENTICATION_REQUIRED','Session AngelCare requise.')
 if(!hasMarketplaceWorkspaceAccess(ctx,'workspace.supplier_command'))throw new MarketplaceError('PERMISSION_DENIED','Supplier Command 360 non autorisé.')
 if(!hasMarketplacePermission(ctx,write?'marketplace.catalog.manage':'marketplace.catalog.view'))throw new MarketplaceError('PERMISSION_DENIED','Permission catalogue manquante.')
 return ctx
}
export async function snapshotSupplierImport(){
 await requireOperator(false)
 const db=await createServiceClient()
 const {data,error}=await db.from('angelcare_marketplace_suppliers').select('id,supplier_code,display_name,status,quality_status').neq('status','archived').order('display_name').limit(500)
 if(error)throw new MarketplaceError('CONFIGURATION_ERROR','Répertoire fournisseur inaccessible.')
 return {suppliers:data||[],mode:'canonical-product360',languages:['fr','en','ar'],publication:'governed'}
}
function validateRow(row:Row,index:number){
 const errors:string[]=[]
 const key=str(row.item_key),supplierId=str(row.supplier_id),sku=str(row.supplier_sku)
 if(!key||key.length>160)errors.push('item_key requis (max 160)')
 if(!uuid(supplierId))errors.push('supplier_id UUID requis')
 if(sku.length<2||sku.length>120)errors.push('supplier_sku requis (2–120)')
 if(!cleanDecimal(row.supplier_unit_cost))errors.push('supplier_unit_cost doit être positif (8 décimales max)')
 if(!cleanDecimal(row.supplier_moq))errors.push('supplier_moq doit être positif (8 décimales max)')
 if(!/^[A-Z]{3}$/.test(str(row.supplier_currency)))errors.push('supplier_currency ISO requise')
 return {line:index+2,item_key:key,errors}
}
export async function associateSupplierImport(raw:Row){
 const ctx:MarketplaceRequestContext=await requireOperator(true)
 if(!Array.isArray(raw.rows)||raw.rows.length<1||raw.rows.length>100)throw new MarketplaceError('VALIDATION_ERROR','Lot de liaison limité à 1–100 produits.')
 const lines=raw.rows as Row[],errors=lines.map(validateRow).filter(x=>x.errors.length)
 if(errors.length)throw new MarketplaceError('VALIDATION_ERROR',errors.slice(0,8).map(x=>`Ligne ${x.line}: ${x.errors.join(', ')}`).join(' | '))
 const keys=lines.map(x=>str(x.item_key))
 if(new Set(keys).size!==keys.length)throw new MarketplaceError('VALIDATION_ERROR','item_key dupliqué dans le lot de liaison.')
 const db=await createServiceClient()
 const supplierIds=[...new Set(lines.map(x=>str(x.supplier_id)))]
 const [items,suppliers]=await Promise.all([
   db.from('angelcare_marketplace_catalog_items').select('id,item_key,kind,status,name_fr,name_en,name_ar,short_description_fr,short_description_en,short_description_ar,description_fr,description_en,description_ar,seo_metadata').in('item_key',keys),
   db.from('angelcare_marketplace_suppliers').select('id,display_name,status,quality_status').in('id',supplierIds),
 ])
 if(items.error||suppliers.error)throw new MarketplaceError('CONFIGURATION_ERROR','Références catalogue/fournisseur non disponibles.')
 const itemByKey=new Map((items.data||[]).map(x=>[str(x.item_key),x]))
 const supplierById=new Map((suppliers.data||[]).map(x=>[str(x.id),x]))
 const output:Array<{item_key:string;catalogId?:string;offerId?:string;status:'linked'|'failed';message:string}>=[]
 // Each offer uses the existing audited/idempotent R1 supplier command. A partial
 // result is reported explicitly; the operator can retry failed rows safely.
 for(const line of lines){
  const key=str(line.item_key),item=itemByKey.get(key),supplier=supplierById.get(str(line.supplier_id))
  if(!item||!['product','kit'].includes(str(item.kind))){output.push({item_key:key,status:'failed',message:'Produit/kit absent du catalogue canonique — terminer le job Product 360.'});continue}
  if(!supplier||!['approved','active'].includes(str(supplier.status))||!['approved','conditional'].includes(str(supplier.quality_status))){output.push({item_key:key,status:'failed',message:'Fournisseur non qualifié.'});continue}
  const missing=['name_fr','name_en','name_ar','short_description_fr','short_description_en','short_description_ar','description_fr','description_en','description_ar'].filter(k=>!str((item as Row)[k]))
  const seo=(item as Row).seo_metadata as Row|undefined
  for(const language of ['fr','en','ar']){if(!str(seo?.['title_'+language]))missing.push('seo_title_'+language);if(!str(seo?.['description_'+language]))missing.push('seo_description_'+language)}
  if(missing.length){output.push({item_key:key,status:'failed',message:'Traductions canoniques manquantes : '+missing.join(', ')});continue}
  try{
   const {data,error}=await db.rpc('ac_sc_command',{
     p_actor:ctx.actor.id,p_action:'offer.save',
     p_payload:{supplierId:str(line.supplier_id),catalogId:str(item.id),sku:str(line.supplier_sku),currency:str(line.supplier_currency),unitCost:str(line.supplier_unit_cost),moq:str(line.supplier_moq)},
     p_key:crypto.randomUUID(),p_reason:'Supplier multilingual CSV → canonical Product 360 association',
   })
   if(error)throw new Error(error.message)
   output.push({item_key:key,catalogId:str(item.id),offerId:str(data?.id),status:'linked',message:'Offre en brouillon liée au produit canonique.'})
  }catch(e){output.push({item_key:key,catalogId:str(item.id),status:'failed',message:e instanceof Error?e.message:'Échec liaison'})}
 }
 return {rows:output,total:output.length,linked:output.filter(x=>x.status==='linked').length,failed:output.filter(x=>x.status==='failed').length,publication:'NOT_AUTOMATIC'}
}
