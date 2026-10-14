import {createServiceClient} from '@/lib/supabase/server'
import {requireMarketplaceApiContext,hasMarketplacePermission} from '../auth/context'
import {writeMarketplaceAudit} from '../audit/write-audit'
import {apiSuccess,apiFailure,parseJsonObject,requestId} from '../server/request'
import {MarketplaceError} from '../server/errors'
import {affectedCommercePaths,refreshCommerceSurfaces} from '../commerce-studio/publication'
import {schemaContract} from '../atomic-dossier/contract'
import {editorialImage,editorialValidation,normalizeEditorial} from './model'
import type {EditorialSnapshot} from './admin-contract'
type Row=Record<string,unknown>
const object=(v:unknown):Row=>v&&typeof v==='object'&&!Array.isArray(v)?v as Row:{}
const text=(v:unknown)=>typeof v==='string'?v:''
export async function handleEditorialConfiguration(request:Request,itemId:string){const rid=requestId(request);try{
 if(!['GET','PATCH'].includes(request.method))throw new MarketplaceError('VALIDATION_ERROR','Méthode non prise en charge.')
 const context=await requireMarketplaceApiContext(request.method==='GET'?'marketplace.catalog.view':'marketplace.catalog.manage')
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId))throw new MarketplaceError('VALIDATION_ERROR','Identifiant d’offre invalide.')
 const db=await createServiceClient(),read=await db.from('angelcare_marketplace_catalog_items').select('id,slug,name_fr,name_en,name_ar,status,experience_schema_key,commercial_metadata,experience_config,updated_at,territory_id').eq('id',itemId).maybeSingle()
 if(read.error)throw new MarketplaceError('INTERNAL_ERROR','Lecture de la configuration éditoriale impossible.')
 if(!read.data)throw new MarketplaceError('NOT_FOUND','Offre introuvable.')
 const item=read.data as Row;if(context.territoryId&&item.territory_id&&context.territoryId!==item.territory_id)throw new MarketplaceError('FORBIDDEN','Offre hors de votre territoire.')
 const schemaKey=text(item.experience_schema_key)||text(object(item.commercial_metadata).experience_schema_key),domain=schemaContract(schemaKey)?.domain
 if(!domain)throw new MarketplaceError('CONFIGURATION_ERROR','Un schéma atomique pris en charge est requis pour configurer ce pack.')
 const experience=object(item.experience_config)
 function snapshot(updated:Row,media:EditorialSnapshot['media']=[]):EditorialSnapshot{return{itemId,name:text(updated.name_fr),slug:text(updated.slug),status:text(updated.status),schemaKey,domain:domain!,updatedAt:text(updated.updated_at),canManage:hasMarketplacePermission(context,'marketplace.catalog.manage'),config:normalizeEditorial(object(updated.experience_config).editorial,domain),media}}
 if(request.method==='GET'){const media=await db.from('angelcare_marketplace_catalog_item_media').select('media_key,asset_url,alt_text_fr,media_type').eq('catalog_item_id',itemId).eq('status','active').order('sort_order',{ascending:true});if(media.error)throw new MarketplaceError('INTERNAL_ERROR','Lecture des médias impossible.');const rows=(media.data||[]).flatMap((m:Row)=>{const url=editorialImage(m.asset_url);return url&&text(m.media_type).startsWith('image')?[{key:text(m.media_key),url,label:text(m.alt_text_fr)||text(m.media_key)}]:[]});return apiSuccess(snapshot(item,rows),{requestId:rid})}
 const body=await parseJsonObject(request),expected=text(body.expectedUpdatedAt)
 if(!expected||expected!==text(item.updated_at))throw new MarketplaceError('CONFLICT','Cette offre a changé. Relisez la version actuelle ; votre brouillon est conservé.')
 if(!body.config||typeof body.config!=='object'||Array.isArray(body.config))throw new MarketplaceError('VALIDATION_ERROR','Configuration éditoriale requise.')
 const errors=editorialValidation(body.config,domain);if(errors.length)throw new MarketplaceError('VALIDATION_ERROR',errors.join(' '))
 const config=normalizeEditorial(body.config,domain),result=await db.from('angelcare_marketplace_catalog_items').update({experience_config:{...experience,editorial:config},updated_at:new Date().toISOString()}).eq('id',itemId).eq('updated_at',expected).select('id,slug,name_fr,status,experience_config,updated_at').maybeSingle()
 if(result.error)throw new MarketplaceError('INTERNAL_ERROR','Enregistrement non confirmé. Votre brouillon est conservé.')
 if(!result.data)throw new MarketplaceError('CONFLICT','Une autre modification a été enregistrée. Votre brouillon est conservé.')
 const saved=result.data as Row
 await writeMarketplaceAudit({context,requestId:rid,action:'marketplace.catalog.editorial.updated',objectType:'catalog_item',objectId:itemId,beforeValue:normalizeEditorial(experience.editorial,domain),afterValue:config,source:'atomic-editorial-r3',request})
 const paths=affectedCommercePaths({objectType:'catalog-items',slug:text(saved.slug)});for(const locale of ['fr','en','ar'])paths.push('/angelcare-marketplace/'+locale+'/marketplace/item/'+encodeURIComponent(text(saved.slug)));refreshCommerceSurfaces([...new Set(paths)])
 return apiSuccess(snapshot(saved),{requestId:rid})
 }catch(error){return apiFailure(error,rid)}}
