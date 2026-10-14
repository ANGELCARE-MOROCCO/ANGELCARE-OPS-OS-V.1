import {doctrineProfiles} from './doctrine-profiles'
import { createServiceClient } from '@/lib/supabase/server'
import { getExperienceSchema,listExperienceSchemas } from '../category-native/repository'
import { MarketplaceError } from '../server/errors'
import type { MarketplaceRequestContext,MarketplacePermission } from '../domain/types'
import {hasMarketplacePermission} from '../auth/context'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { refreshCommerceSurfaces } from '../commerce-studio/publication'
import { invalidateStudioReference } from '../studio-dependency-invalidation/invalidation'
import { bindingsFromRows,text,type Row } from '../catalogue-population/model'
import { parseCategoryNativeCsv } from '../category-native/validation'
import { compileProfile,fingerprint,normalizeTarget,prepareRows,profileFingerprint,issueCsv,fullRejectedCsv,templateDocument,targetFields,type PreparedRow } from './contract'
import { applyCollections,collectionContracts,academyCompanions,mediaBindings } from './collections'
import { planOffer } from './planner'

function validateInput<T>(read:()=>T):T{try{return read()}catch(e){if(e instanceof MarketplaceError)throw e;throw new MarketplaceError('VALIDATION_ERROR',e instanceof Error?e.message:String(e))}}
const RUNS='angelcare_marketplace_catalogue_import_runs',LINES='angelcare_marketplace_catalogue_import_lines'
function error(cause:any):never {if(/CONFLICT|CHANGED|DENIED/.test(cause?.message||''))throw new MarketplaceError('CONFLICT','L’état a changé ou le périmètre est incompatible. Relisez le dossier avant de poursuivre.',{cause});throw new MarketplaceError(['42P01','PGRST202'].includes(cause?.code)?'CONFIGURATION_ERROR':'INTERNAL_ERROR',['42P01','PGRST202'].includes(cause?.code)?'Activez Catalogue Import R2 avec le SQL fourni.':'Opération d’import impossible ; état conservé.',{cause})}
function requireRights(context:MarketplaceRequestContext,keys:MarketplacePermission[]){for(const key of keys)if(!hasMarketplacePermission(context,key))throw new MarketplaceError('FORBIDDEN','Permission requise : '+key)}
function plannedPermissions(rows:PreparedRow[],manifest:Row[],academy:Row[],target:Row):MarketplacePermission[]{const values=rows.map(r=>r.values),clears=rows.flatMap(r=>r.clears),required:MarketplacePermission[]=[];if(target.categoryKeys.length||values.some(r=>Object.hasOwn(r,'category_keys')||Object.hasOwn(r,'primary_category_key'))||clears.includes('category_keys'))required.push('marketplace.categories.manage');if(manifest.length||values.some(r=>['media_json','gallery_references','primary_image_reference'].some(k=>Object.hasOwn(r,k)))||clears.some(k=>['media_json','gallery_references','primary_image_reference'].includes(k)))required.push('marketplace.media.manage');if(values.some(r=>Object.keys(r).some(k=>k.startsWith('price_rule')))||clears.some(k=>k.startsWith('price_rule')))required.push('marketplace.finance.price_books.manage');if(academy.length)required.push('marketplace.academy.catalog.manage','marketplace.academy.cohorts.manage');return required}
export async function assertRunRights(id:string,context:MarketplaceRequestContext){const run=await readRun(id,context);requireRights(context,run.target.requiredPermissions||[]);return run}
export async function requiresPublication(id:string,context:MarketplaceRequestContext){await readRun(id,context);const db=await createServiceClient();const r=await db.from(LINES).select('id',{count:'exact',head:true}).eq('run_id',id).eq('plan->after->>status','published');if(r.error)error(r.error);return Number(r.count)>0}
async function rpc(db:any,name:string,args:Row){const r=await db.rpc(name,args);if(r.error)error(r.error);return r.data}
function scope(q:any,c:MarketplaceRequestContext){if(c.territoryId)q=q.eq('territory_id',c.territoryId);if(c.tenantId)q=q.eq('tenant_id',c.tenantId);return q}
export async function readRun(id:string,context:MarketplaceRequestContext){const db=await createServiceClient(),r=await scope(db.from(RUNS).select('*').eq('id',id),context).maybeSingle();if(r.error)error(r.error);if(!r.data)throw new MarketplaceError('NOT_FOUND','Lot absent ou hors périmètre.');return r.data as Row}
export async function runPage(context:MarketplaceRequestContext,page=1){const db=await createServiceClient();const r=await scope(db.from(RUNS).select('id,reference,profile_key,target,status,source_name,revision,created_at,updated_at,created_by',{count:'exact'}),context).order('created_at',{ascending:false}).order('id').range((page-1)*24,page*24-1);if(r.error)error(r.error);return{rows:r.data||[],total:r.count||0,page,pageSize:24}}
export async function linesPage(id:string,context:MarketplaceRequestContext,page=1,status=''){await readRun(id,context);const db=await createServiceClient();let q=db.from(LINES).select('id,row_number,identity_key,item_id,original,prepared,issues,status,plan,applied_at,rolled_back_at,error',{count:'exact'}).eq('run_id',id);if(status)q=q.eq('status',status);const r=await q.order('row_number').order('id').range((page-1)*40,page*40-1);if(r.error)error(r.error);return{rows:r.data||[],total:r.count||0,page,pageSize:40}}
async function allLines(db:any,id:string){const all:Row[]=[];for(let offset=0;;offset+=200){const r=await db.from(LINES).select('*').eq('run_id',id).order('row_number').order('id').range(offset,offset+199);if(r.error)error(r.error);all.push(...r.data||[]);if((r.data||[]).length<200)break}return all}
export async function counts(id:string,context:MarketplaceRequestContext){await readRun(id,context);const db=await createServiceClient();const keys=['unchecked','invalid','ready','applied','failed','conflict','rolled_back'];const values=await Promise.all(keys.map(async status=>{const r=await db.from(LINES).select('id',{head:true,count:'exact'}).eq('run_id',id).eq('status',status);if(r.error)error(r.error);return[status,r.count||0]}));return Object.fromEntries(values)}
async function resolveSchema(key:string){return doctrineProfiles().find(v=>v.schema_key===key)||await getExperienceSchema(key)}
export async function bootstrap(){const schemas=await listExperienceSchemas();return{schemas:[...schemas,...doctrineProfiles()],contract:'ANGELCARE_CATALOGUE_IMPORT_R2'}}
export async function createRun(body:Row,context:MarketplaceRequestContext){
 const target=validateInput(()=>normalizeTarget(body.target||{})),schema=await resolveSchema(target.schemaKey)
 if(!schema||schema.id.startsWith('blueprint:')||schema.status!=='active')throw new MarketplaceError('CONFIGURATION_ERROR','Un schéma natif actif et persistant est requis.')
 const source=String(body.source||'');if(new TextEncoder().encode(source).byteLength>20*1024*1024)throw new MarketplaceError('VALIDATION_ERROR','CSV supérieur à 20 Mo.')
 const profile=compileProfile(schema),hash=await profileFingerprint(profile)
 const templateHash=(await templateDocument(profile,target)).hash;let rows=validateInput(()=>prepareRows(profile,target,source,templateHash))
 const collections=body.collections&&typeof body.collections==='object'&&!Array.isArray(body.collections)?body.collections:{}
 rows=validateInput(()=>applyCollections(rows,collections,collectionContracts(profile,target)))
 const companionRows=validateInput(()=>academyCompanions(text(body.academy),rows.map(r=>r.identity)))
 if(companionRows.length&&!['course','cohort','academy_programme','admission_programme','certification_pathway'].includes(profile.sellable))throw new MarketplaceError('VALIDATION_ERROR','Le fichier Academy ne correspond pas à ce schéma.')
 const manifest=validateInput(()=>mediaBindings(Array.isArray(body.manifest)?body.manifest:[])),keys=new Set(rows.map(r=>r.identity))
 for(const b of manifest)if(!keys.has(b.itemKey)||b.checksum&&!/^[0-9a-f]{64}$/i.test(b.checksum))throw new MarketplaceError('VALIDATION_ERROR','Manifeste hors fichier ou SHA-256 invalide.')
 if(manifest.length&&!targetFields(profile,target).some(f=>f.module==='media'||f.module==='variants'))throw new MarketplaceError('VALIDATION_ERROR','Ce parcours ne modifie pas les médias.')
 const db=await createServiceClient(),existing=new Map<string,Row>()
 for(let i=0;i<rows.length;i+=100){const r=await db.from('angelcare_marketplace_catalog_items').select('id,item_key,territory_id,tenant_id').in('item_key',rows.slice(i,i+100).map(r=>r.identity).filter(Boolean));if(r.error)error(r.error);for(const item of r.data||[]){if(context.territoryId&&item.territory_id&&item.territory_id!==context.territoryId||context.tenantId&&item.tenant_id!==context.tenantId)throw new MarketplaceError('FORBIDDEN','Une clé du fichier appartient à un autre périmètre.');existing.set(item.item_key,item)}}
 const requiredPermissions=plannedPermissions(rows,manifest,companionRows,{...target,categoryKeys:targetFields(profile,target).some(f=>f.module==='categories')?target.categoryKeys:[]});requireRights(context,requiredPermissions);
 if(body.correctionOf){const parent=await readRun(text(body.correctionOf),context);const old=await allLines(db,parent.id);const applied=new Set(old.filter(l=>['applied','rolled_back'].includes(l.status)).map(l=>l.identity_key));if(rows.some(row=>applied.has(row.identity)))throw new MarketplaceError('CONFLICT','Une correction ne peut pas reprendre une ligne déjà appliquée.');}
 const id=crypto.randomUUID(),seen=new Set<string>()
 // Keep malformed/duplicate identities correctable in the saved source, without
 // allowing ambiguous rows to enter the execution plan.
 const lines=rows.map(row=>{const duplicate=!row.identity||seen.has(row.identity);seen.add(row.identity);return{row_number:row.number,identity_key:duplicate?`!invalid-line-${row.number}`:row.identity,item_id:existing.get(row.identity)?.id||crypto.randomUUID(),original:row.original,prepared:row,issues:row.issues,status:row.issues.some(i=>i.severity==='error')||duplicate?'invalid':'unchecked'}})
 const sourceHash=await fingerprint({actor:context.actor.id,territory:context.territoryId,tenant:context.tenantId,target,source,collections,academy:companionRows,manifest,profile:hash,correctionOf:text(body.correctionOf)})
 return rpc(db,'angelcare_import_r2_create',{p_run:{id,created_by:context.actor.id,territory_id:context.territoryId,tenant_id:context.tenantId,source_name:text(body.sourceName)||'import.csv',source_csv:source,source_hash:sourceHash,profile_key:profile.key,profile_fingerprint:hash,profile_snapshot:schema,target:{...target,requiredPermissions},manifest,companions:{collections,academy:companionRows}},p_lines:lines})
}
export async function registerAsset(id:string,body:Row,context:MarketplaceRequestContext){
 const run=await readRun(id,context),db=await createServiceClient(),path=text(body.path),binding=(run.manifest||[]).find((b:Row)=>b.path===path)
 if(!binding||!['preparing','correct'].includes(run.status))throw new MarketplaceError('INVALID_STATE_TRANSITION','Les médias sont figés après validation. Créez une correction.')
 const r=await db.from('angelcare_marketplace_media_assets').select('*').eq('id',text(body.assetId)).eq('status','active').maybeSingle();if(r.error)error(r.error);const asset=r.data
 if(!asset||binding.checksum&&text(asset.metadata?.sha256)!==binding.checksum)throw new MarketplaceError('DATA_INTEGRITY','Asset absent ou empreinte différente.')
 if(context.territoryId&&asset.territory_id&&asset.territory_id!==context.territoryId)throw new MarketplaceError('FORBIDDEN','Média hors territoire.')
 const next=await db.from(RUNS).update({assets:{...run.assets,[path]:{id:asset.id,asset_key:asset.asset_key,url:asset.desktop_url||asset.public_url,sha256:asset.metadata?.sha256}},revision:run.revision+1,updated_at:new Date().toISOString()}).eq('id',id).eq('revision',Number(body.revision)).select('*').maybeSingle();if(next.error)error(next.error);if(!next.data)throw new MarketplaceError('CONFLICT','Le lot a changé ; relisez les médias vérifiés.');return next.data
}
async function currentProfile(run:Row){const schema=await resolveSchema(run.profile_key);if(!schema||schema.status!=='active')throw new MarketplaceError('CONFLICT','Le schéma n’est plus actif.');const profile=compileProfile(schema);if(await profileFingerprint(profile)!==run.profile_fingerprint)throw new MarketplaceError('CONFLICT','Le contrat a changé : téléchargez le nouveau template et préparez un nouveau lot.');return profile}
export async function prepareNext(id:string,context:MarketplaceRequestContext){
 const run=await assertRunRights(id,context);if(!['preparing','correct'].includes(run.status))return{run,counts:await counts(id,context)}
 const profile=await currentProfile(run),db=await createServiceClient()
 const pending=await db.from(LINES).select('*').eq('run_id',id).eq('status','unchecked').order('row_number').limit(8);if(pending.error)error(pending.error)
 if((run.manifest||[]).some((b:Row)=>!run.assets?.[b.path]))throw new MarketplaceError('INVALID_STATE_TRANSITION','Tous les médias du manifeste doivent être vérifiés avant le préflight.');
 const refs=[...new Set<string>((pending.data||[]).flatMap((l:Row)=>Object.entries(l.prepared.values).filter(([k])=>k.startsWith('relation_')).flatMap(([,v])=>Array.isArray(v)?v:text(v).split('|')).filter(Boolean)))];const vr=refs.length?await db.from(LINES).select('item_id,identity_key,status').eq('run_id',id).in('identity_key',refs):{data:[],error:null};if(vr.error)error(vr.error);const virtualItems=(vr.data||[]).filter((r:Row)=>r.status!=='invalid').map((r:Row)=>({id:r.item_id,item_key:r.identity_key,public_reference:r.identity_key,status:'draft'}))
 for(const line of pending.data||[]){
  const row:PreparedRow=structuredClone(line.prepared)
  try{
   const before=await rpc(db,'angelcare_import_r2_snapshot',{p_item:line.item_id})
   const media=(run.manifest||[]).filter((b:Row)=>b.itemKey===row.identity)
   for(const b of media)if(!run.assets?.[b.path])throw Error('Média à vérifier avant le préflight : '+b.path)
   if(media.some((b:Row)=>b.role!=='variant')){const named=media.filter((b:Row)=>b.role!=='variant').map((b:Row)=>({media_key:b.role==='gallery'?'gallery-'+b.order:b.role,reference:run.assets[b.path].asset_key,sort_order:b.order,alt_text_fr:b.altFr,alt_text_en:b.altEn,alt_text_ar:b.altAr,status:'active'}));if(row.values.media_json)throw Error('Médias fournis en JSON et en manifeste ; choisissez une représentation.');row.values.media_json=named}
   const variantMedia=media.filter((b:Row)=>b.role==='variant');if(variantMedia.length){const variants=Array.isArray(row.values.variants_json)?row.values.variants_json.map((v:Row)=>({...v})):[];for(const b of variantMedia){let variant=variants.find((v:Row)=>v.variant_key===b.variantKey);if(!variant){const existing=(before?.variants||[]).find((v:Row)=>v.variant_key===b.variantKey&&v.status!=='archived');if(!existing)throw Error('Variante absente : '+b.variantKey+' ; fournissez sa définition native.');const replacement:Row={...existing};variants.push(replacement);variant=replacement}variant!.media_asset_reference=run.assets[b.path].asset_key;delete variant!.media_asset_id}row.values.variants_json=variants}
   const plan=await planOffer({db,context,profile,target:run.target,row,before,itemId:line.item_id,runId:id,virtual:virtualItems})
   // Academy child imports are validated and applied through their own native
   // companion authority in the same row transaction (SQL R2 extension).
   const academy=(run.companions?.academy||[]).filter((r:Row)=>r.item_key===row.identity)
   if(academy.length){const module=await import('./academy');plan.academy=await module.planAcademy(db,context,line.item_id,academy)}
   const r=await db.from(LINES).update({plan,status:'ready',error:null,issues:row.issues}).eq('id',line.id).eq('status','unchecked');if(r.error)error(r.error)
  }catch(e){const message=e instanceof Error?e.message:String(e);const r=await db.from(LINES).update({status:'invalid',error:message,issues:[...row.issues,{row:row.number,key:'_native_plan',value:null,expected:'Références et dossier natifs valides',message,severity:'error'}]}).eq('id',line.id).eq('status','unchecked');if(r.error)error(r.error)}
 }
 const totals=await counts(id,context),status=totals.unchecked?'preparing':totals.invalid?'correct':'ready'
 const changed=await db.from(RUNS).update({status,revision:run.revision+1,updated_at:new Date().toISOString()}).eq('id',id).eq('revision',run.revision);if(changed.error)error(changed.error)
 return{run:await readRun(id,context),counts:totals}
}
export async function executeNext(id:string,body:Row,context:MarketplaceRequestContext){
 const run=await assertRunRights(id,context),profile=await currentProfile(run),db=await createServiceClient()
 if(body.approved!==true||Number(body.revision)!==run.revision||body.fingerprint!==run.profile_fingerprint)throw new MarketplaceError('CONFLICT','Revue et version courante du lot requises.')
 const lease=await rpc(db,'angelcare_import_r2_claim',{p_id:id,p_actor:context.actor.id,p_territory:context.territoryId,p_tenant:context.tenantId,p_revision:run.revision,p_hash:run.profile_fingerprint})
 try{
  const pending=await db.from(LINES).select('id').eq('run_id',id).eq('status','ready').order('row_number').limit(12);if(pending.error)error(pending.error)
  for(const line of pending.data||[]){try{
    const received=await rpc(db,'angelcare_import_r2_apply',{p_run:id,p_line:line.id,p_lease:lease.lease_token,p_actor:context.actor.id,p_territory:context.territoryId,p_tenant:context.tenantId})
    await invalidateStudioReference({reference:{sourceId:'catalog.items',entityId:received.item_id},reason:'catalogue_import_r2.applied',context})
   }catch(e){const message=e instanceof Error?e.message:String(e);const r=await db.from(LINES).update({status:'conflict',error:message}).eq('id',line.id).eq('status','ready');if(r.error)error(r.error)}
  }
 }finally{await rpc(db,'angelcare_import_r2_release',{p_run:id,p_lease:lease.lease_token})}
 await writeMarketplaceAudit({context,requestId:crypto.randomUUID(),action:'marketplace.catalogue_import.applied',objectType:'catalogue_import_run',objectId:id,afterValue:{profile:profile.key,counts:await counts(id,context)},source:'catalogue-import-r2'})
 refreshCommerceSurfaces(['/angelcare-marketplace/fr','/angelcare-marketplace/en','/angelcare-marketplace/ar'])
 return{run:await readRun(id,context),counts:await counts(id,context)}
}
export async function exportRun(id:string,context:MarketplaceRequestContext){const run=await readRun(id,context),db=await createServiceClient(),lines=await allLines(db,id),original=parseCategoryNativeCsv(run.source_csv),headers=Object.keys(original[0]||{});const rejected=lines.filter(l=>['invalid','failed','conflict'].includes(l.status)).map(l=>({...l.prepared,original:l.original,issues:l.issues.some((i:Row)=>i.severity==='error')?l.issues:[...l.issues,{row:l.row_number,key:'_native_plan',message:l.error||'Ligne à revoir',severity:'error'}]}));return{source:run.source_csv,rejected:fullRejectedCsv(rejected,headers),issues:issueCsv(rejected),proofs:lines.map(l=>({identity:l.identity_key,status:l.status,itemId:l.item_id,before:l.before_snapshot,after:l.after_snapshot,appliedAt:l.applied_at,error:l.error})),companions:run.companions,manifest:run.manifest,target:run.target}}
export async function rollbackNext(id:string,body:Row,context:MarketplaceRequestContext){const run=await readRun(id,context);if(body.confirmed!==true||Number(body.revision)!==run.revision)throw new MarketplaceError('CONFLICT','Confirmez la restauration sur la version courante.');const db=await createServiceClient(),pending=await db.from(LINES).select('id').eq('run_id',id).eq('status','applied').order('row_number',{ascending:false}).limit(12);if(pending.error)error(pending.error);const conflicts:Row[]=[];for(const line of pending.data||[]){try{const restored=await rpc(db,'angelcare_import_r2_rollback',{p_run:id,p_line:line.id,p_actor:context.actor.id,p_territory:context.territoryId,p_tenant:context.tenantId});await invalidateStudioReference({reference:{sourceId:'catalog.items',entityId:restored.item_id},reason:'catalogue_import_r2.rollback',context})}catch(e){conflicts.push({lineId:line.id,error:e instanceof Error?e.message:String(e)})}}await writeMarketplaceAudit({context,requestId:crypto.randomUUID(),action:'marketplace.catalogue_import.rollback',objectType:'catalogue_import_run',objectId:id,afterValue:{conflicts},source:'catalogue-import-r2'});refreshCommerceSurfaces(['/angelcare-marketplace/fr','/angelcare-marketplace/en','/angelcare-marketplace/ar']);return{run:await readRun(id,context),counts:await counts(id,context),conflicts}}
export {listExperienceSchemas,templateDocument,compileProfile}
