import {prepareTaxonomy,executeTaxonomy,rollbackTaxonomy} from './taxonomy'
import {requireMarketplaceApiContext,hasMarketplacePermission} from '../auth/context'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '../server/request'
import {MarketplaceError} from '../server/errors'
import {createServiceClient} from '@/lib/supabase/server'
import {getCommerceResource} from '../commerce-studio/repository'
import {evaluateProduct360ReadinessRecord} from '../enterprise-command/product-360-readiness'
import * as authority from './repository'
import {schemaKey,text} from './model'
export async function handlePopulation(request:Request){const rid=requestId(request);try{
 const context=await requireMarketplaceApiContext('marketplace.catalog.view');const url=new URL(request.url);const part=url.searchParams.get('part')||'bootstrap';
 if(request.method==='GET'){
  if(part==='bootstrap')return apiSuccess({inventory:await authority.inventory(context),schemas:hasMarketplacePermission(context,'marketplace.experience_schema.view')||hasMarketplacePermission(context,'marketplace.category_native_import.view')?await authority.listExperienceSchemas():[]},{requestId:rid});
  if(part==='categories')return apiSuccess(await authority.categoryPage(context,Object.fromEntries(url.searchParams)),{requestId:rid});
  if(part==='offers'){const page=await authority.offerPage(context,Object.fromEntries(url.searchParams));return apiSuccess({...page,rows:page.rows.map((item:any)=>({...item,readiness:evaluateProduct360ReadinessRecord(item,text(item.sellable_type||item.kind))}))},{requestId:rid})}
  if(part==='batches'){if(!hasMarketplacePermission(context,'marketplace.category_native_import.view')&&!hasMarketplacePermission(context,'marketplace.categories.manage'))throw new MarketplaceError('FORBIDDEN','Accès aux lots refusé.');return apiSuccess(await authority.batchList(context,Math.max(1,Number(url.searchParams.get('page'))||1)),{requestId:rid})}
  if(part==='batch'){const batch=await authority.readBatch(url.searchParams.get('id')||'',context);await requireMarketplaceApiContext(batch.schema_key==='catalog-taxonomy'?'marketplace.categories.manage':'marketplace.category_native_import.view');return apiSuccess({...batch,nativeJob:batch.native_job_id?await authority.getImportJob(batch.native_job_id):null},{requestId:rid})}
  if(part==='item'){const item=await getCommerceResource('catalog-items',url.searchParams.get('id')||'');if(!item)throw new MarketplaceError('NOT_FOUND','Offre absente.');if(context.territoryId&&item.territory_id&&item.territory_id!==context.territoryId)throw new MarketplaceError('FORBIDDEN','Offre hors territoire.');return apiSuccess({...item,readiness:evaluateProduct360ReadinessRecord(item,text(item.sellable_type||item.kind)),schemaKey:schemaKey(item),editRow:await authority.editSeed(text(item.id),context)},{requestId:rid})}
  if(part==='asset'){await requireMarketplaceApiContext('marketplace.media.view');const key=text(url.searchParams.get('key'));const db=await createServiceClient();const {data,error}=await db.from('angelcare_marketplace_media_assets').select('*').eq(/^[0-9a-f-]{36}$/i.test(key)?'id':'asset_key',key).eq('status','active').limit(2);if(error||data?.length!==1)throw new MarketplaceError('VALIDATION_ERROR','Asset exact absent ou ambigu.');return apiSuccess(data[0],{requestId:rid})}
  if(part==='media'){await requireMarketplaceApiContext('marketplace.media.view');const db=await createServiceClient();const q=text(url.searchParams.get('query'));const page=Math.max(1,Number(url.searchParams.get('page'))||1);let query=db.from('angelcare_marketplace_media_assets').select('*',{count:'exact'}).neq('status','archived');if(q)query=query.ilike('file_name','%'+q.replaceAll('%','\\%').replaceAll('_','\\_')+'%');const {data,error,count}=await query.order('updated_at',{ascending:false}).order('id').range((page-1)*36,page*36-1);if(error)throw new MarketplaceError('INTERNAL_ERROR','Lecture médias impossible.');return apiSuccess({rows:data,total:count,page,pageSize:36},{requestId:rid})}
  throw new MarketplaceError('VALIDATION_ERROR','Lecture inconnue.');
 }
 if(request.method!=='POST')throw new MarketplaceError('VALIDATION_ERROR','Méthode inconnue.');const body=await parseJsonObject(request);const action=text(body.action);
 if(action==='taxonomy-prepare'||action==='taxonomy-execute'||action==='taxonomy-rollback'){await requireMarketplaceApiContext('marketplace.categories.manage');return apiSuccess(action==='taxonomy-prepare'?await prepareTaxonomy(body,context):action==='taxonomy-rollback'?await rollbackTaxonomy(text(body.id),context):await executeTaxonomy(text(body.id),context),{requestId:rid})}
 if(action==='categories'){await requireMarketplaceApiContext('marketplace.catalog.manage');await requireMarketplaceApiContext('marketplace.categories.manage');return apiSuccess(await authority.categoryMutation(body,context),{requestId:rid})}
 await requireMarketplaceApiContext('marketplace.category_native_import.manage');
 if(action==='create')return apiSuccess(await authority.createBatch(body,context),{requestId:rid,status:201});
 if(action==='asset'){await requireMarketplaceApiContext('marketplace.media.manage');return apiSuccess(await authority.registerBatchAsset(text(body.id),body,context),{requestId:rid})}
 if(action==='validate')return apiSuccess(await authority.validateBatch(text(body.id),context),{requestId:rid});
 if(action==='execute')return apiSuccess(await authority.executeBatch(text(body.id),context),{requestId:rid});
 throw new MarketplaceError('VALIDATION_ERROR','Action inconnue.');
 }catch(error){return apiFailure(error,rid)}}
