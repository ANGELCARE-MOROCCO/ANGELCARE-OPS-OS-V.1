import { applyProduct360ImportRow } from '../enterprise-command/product-360-import-engine'
import { PRODUCT_360_IMPORT_FIELDS, normalizeProductImportRow } from '../enterprise-command/product-360-contract'
import { requireProductDoctrine } from '../enterprise-command/product-doctrine'
import { categoryNativeDoctrineAttributes } from '../category-native/product360-enrichment'
import type { MarketplaceRequestContext } from '../domain/types'
import { text,present,type Row } from '../catalogue-population/model'
import { compileProfile, targetFields, applies, mergeIntent, profileFingerprint, originalFieldValue, stable, type ImportTarget, type PreparedRow, type ImportProfile } from './contract'
import { planningClient,canonicalSnapshot } from './planning-client'

const relationKeys:Record<string,string>={relation_cross_sell_refs:'cross_sell_ids',relation_upsell_refs:'upsell_ids',relation_alternative_refs:'alternative_ids',relation_bundle_refs:'bundle_ids'}
const strip=(row:Row)=>Object.fromEntries(Object.entries(row).filter(([key])=>!['id','created_at','updated_at','created_by','updated_by','catalog_item_id'].includes(key)))
function mergeCollection(before:Row[],incoming:Row[],key:(v:Row)=>string){const entries=new Map(before.map(v=>[key(v),strip(v)]));for(const v of incoming)entries.set(key(v),v);return[...entries.values()]}
export function projectionFor(profile:ImportProfile,target:ImportTarget,row:PreparedRow,before:Row|null):Row{
 const out:Row={item_key:row.identity,status:before?.status||'draft'}
 const values={...row.values}
 for(const field of PRODUCT_360_IMPORT_FIELDS)if(Object.hasOwn(values,field.key))out[field.key]=values[field.key]
 for(const key of row.clears)out[key]=''
 for(const field of requireProductDoctrine(profile.sellable).fields)if(Object.hasOwn(values,field.key))out[field.key]=values[field.key]
 const bridge=categoryNativeDoctrineAttributes(profile.schema,values),dependencies:Record<string,string[]>={duration_minutes:['session_duration_minutes','minimum_duration_hours'],booking_lead_hours:['minimum_lead_time_hours'],provider_capability:['provider_capability','provider_certification','tutor_qualification','provider_training_requirements'],service_area:['territory_codes'],cancellation_policy:['cancellation_policy_key'],age_range:['age_min','age_max'],safety_protocol:['authorized_pickup_protocol','handover_proof_type','lateness_policy'],audience:['intended_audience','audience_types','age_min','age_max'],format:['delivery_modality','event_format','onsite_online_modes'],inventory_mode:['stock_quantity'],kit_contents:['components'],starts_at:['start_date'],ends_at:['end_date'],capacity:['seat_capacity'],buyer_type:['organization_type'],scope:['solution_scope','programme_modules','required_roles','benefit_models','partner_types','venue_types','objectives'],deliverables:['required_components','programme_modules','staffing_requirements','qualification_requirements','covered_service_keys','objectives'],deployment_model:['programme_mode','onboarding_type','guest_booking_integration'],plan_key:['solution_key'],feature_bundle:['included_modules'],activation_flow:['onboarding_type'],site_type:['organization_type'],report_template:['report_type']}
 for(const [key,value]of Object.entries(bridge))if(Object.hasOwn(values,key)||(dependencies[key]||[]).some(k=>Object.hasOwn(values,k)))out[key]=value
 for(const key of row.clears)out[key]=''
 if('stock_quantity' in values){out.availability_capacity=values.stock_quantity;out.availability_status=Number(values.stock_quantity)>0?'available':'out_of_stock'}
 // The schema describes price units. The catalogue stores a canonical visibility mode.
 const nativePrice=text(values.price_mode||values.pricing_mode)
 if(nativePrice){out.price_mode=['fixed','starting_from','quote_only','subscription'].includes(nativePrice)?nativePrice:nativePrice==='free'?'fixed':'starting_from';if(nativePrice==='free')out.price_amount=0}
 if(!before){if(!out.name_fr)throw Error('name_fr requis.');out.slug=text(out.slug)||row.identity;}
 for(const [input,key]of Object.entries(relationKeys))if(input in out)out[input]=mergeIntent(before?.relation_config?.[key],out[input],row.clears.includes(input)?'replace':target.relationMode)
 const media=(before?.media||[]).filter((v:Row)=>v.status!=='archived').map((v:Row)=>({...strip(v),reference:v.asset_url}))
 const touchedMedia='media_json' in out||'primary_image_reference' in out||'gallery_references' in out
 if(touchedMedia){let incoming:Row[]=Array.isArray(out.media_json)?out.media_json:[]
  if(out.primary_image_reference)incoming=[...incoming.filter(v=>v.media_key!=='primary'),{media_key:'primary',reference:out.primary_image_reference,sort_order:0}]
  if(Array.isArray(out.gallery_references))incoming=[...incoming.filter(v=>!text(v.media_key).startsWith('gallery-')),...out.gallery_references.map((reference:string,i:number)=>({media_key:'gallery-'+(i+1),reference,sort_order:(i+1)*10}))]
  let kept=media
  if(row.clears.includes('primary_image_reference'))kept=kept.filter((v:Row)=>v.media_key!=='primary')
  if(row.clears.includes('gallery_references'))kept=kept.filter((v:Row)=>!text(v.media_key).startsWith('gallery-'))
  out.media_json=row.clears.includes('media_json')?[]:target.collectionMode==='replace'&&('media_json' in row.values||row.clears.includes('media_json'))?incoming:mergeCollection(kept,incoming,v=>text(v.media_key))
  delete out.gallery_references;delete out.primary_image_reference
 }
 for(const [field,beforeKey,identity]of [
  ['variants_json','variants',(v:Row)=>text(v.variant_key)],
  ['availability_json','availability',(v:Row)=>[v.territory_id||v.territory_code||'',v.city_zone_id||'',v.audience||'all'].join('|')],
  ['price_rules_json','priceRules',(v:Row)=>[v.price_book_id||v.price_book_reference||'',v.pricing_model||'fixed'].join('|')],
 ] as const)if(Array.isArray(out[field])&&target.collectionMode==='merge')out[field]=mergeCollection((before?.[beforeKey]||[]).filter((v:Row)=>v.status!=='archived'),out[field],identity)
 return out
}
export async function planOffer(input:{db:any;context:MarketplaceRequestContext;profile:ImportProfile;target:ImportTarget;row:PreparedRow;before:Row|null;itemId:string;runId:string;virtual:Row[]}):Promise<Row>{
 const {db,context,profile,target,row,before,itemId}=input
 if(target.task==='create'&&before)throw Error('La clé existe déjà : choisissez Mettre à jour.')
 if(target.task!=='create'&&!before)throw Error('La clé n’existe pas : choisissez Créer des offres.')
 if(before){const schema=text(before.experience_schema_key||before.commercial_metadata?.experience_schema_key);if(schema&&(!profile.native||schema!==profile.key))throw Error('Cette offre appartient à un autre schéma ; migration explicite requise.');if(text(before.sellable_type)&&before.sellable_type!==profile.sellable)throw Error('Le type commercial existant est incompatible.');if(context.territoryId&&before.territory_id&&before.territory_id!==context.territoryId)throw Error('Offre hors territoire.');if(context.tenantId&&before.tenant_id!==context.tenantId)throw Error('Offre hors tenant.')}
 const effective={...(before||{}),...(before?.experience_configuration||{}),...row.values};for(const key of row.clears)delete effective[key];for(const field of profile.fields)if(field.field_key in row.values&&!applies(field.conditional_rule,effective))throw Error(field.label_fr+' : ce champ ne s’applique pas aux choix du dossier.');
 const source=projectionFor(profile,target,row,before)
 if('category_keys' in row.values||(targetFields(profile,target).some(f=>f.module==='categories')&&target.categoryKeys.length)||row.clears.includes('category_keys')){
  const ids=(before?.categories||[]).map((v:Row)=>v.category_id)
  const result=ids.length?await db.from('angelcare_marketplace_catalog_categories').select('id,category_key').in('id',ids):{data:[],error:null}
  if(result.error)throw result.error
  const keys=(result.data||[]).map((v:Row)=>v.category_key)
  const incoming=mergeIntent(row.values.category_keys,target.categoryKeys,'add')
  source.category_keys=mergeIntent(keys,incoming,row.clears.includes('category_keys')?'replace':target.categoryMode)
 }
 if('category_keys' in source||source.primary_category_key){
  const keys=mergeIntent(source.category_keys,source.primary_category_key?[source.primary_category_key]:[],'add');if(keys.length){const found=await db.from('angelcare_marketplace_catalog_categories').select('*').in('category_key',keys).eq('locale','fr').neq('status','archived');if(found.error)throw found.error;for(const key of keys){const candidates=(found.data||[]).filter((v:Row)=>v.category_key===key),global=candidates.filter((v:Row)=>!v.territory_id),chosen=global.length===1?global[0]:candidates.length===1?candidates[0]:null;if(!chosen)throw Error('Catégorie absente ou ambiguë : '+key);if(context.territoryId&&chosen.territory_id&&chosen.territory_id!==context.territoryId)throw Error('Catégorie hors territoire : '+key);const allowed=chosen.allowed_sellable_types;if(Array.isArray(allowed)&&allowed.length&&!allowed.includes(profile.sellable)&&!allowed.includes(requireProductDoctrine(profile.sellable).catalogKind))throw Error('Type commercial refusé par la catégorie : '+key)}}
 }
 for(const refKey of ['slug','sku'])if(source[refKey]){
  const result=await db.from('angelcare_marketplace_catalog_items').select('id,item_key').eq(refKey,source[refKey]).limit(2)
  if(result.error)throw result.error
  if((result.data||[]).some((v:Row)=>v.id!==itemId))throw Error(`${refKey} est déjà utilisé par une autre offre.`)
 }
 const staging=planningClient(db,before,itemId,input.virtual),definition=requireProductDoctrine(profile.sellable)
 const result=await applyProduct360ImportRow({db:staging.client,context,doctrineKey:profile.sellable,source,normalized:normalizeProductImportRow(source,definition),action:before?'update':'create',importJobId:input.runId,allowIncompleteDraft:true})
 const after=staging.snapshot()
 // Native schema data is separate from Product360 projections and private run metadata.
 const native:Row={...(before?.experience_configuration||{})},attributes:Row={...(after.attributes||{})}
 for(const field of profile.fields){if(field.field_key in row.values){native[field.field_key]=row.values[field.field_key];if(profile.schema.fields.some(f=>f.field_key===field.field_key)&&!PRODUCT_360_IMPORT_FIELDS.some(f=>f.key===field.field_key))attributes[field.field_key]=row.values[field.field_key]}if(row.clears.includes(field.field_key)){delete native[field.field_key];delete attributes[field.field_key]}}
 if('age_min' in native&&'age_max' in native&&Number(native.age_min)>Number(native.age_max))throw Error('L’âge maximum devient inférieur à l’âge minimum existant.')
 after.id=itemId;after.territory_id=before?.territory_id||context.territoryId||null
 if(profile.native){after.experience_schema_key=profile.key;after.experience_schema_version=profile.version;}after.experience_configuration=native;after.attributes=attributes
 after.commercial_metadata={...(after.commercial_metadata||{}),...(profile.native&&present(row.values.price_mode||row.values.pricing_mode)?{pricing_model:row.values.price_mode||row.values.pricing_mode}:{}),...(profile.native?{experience_schema_key:profile.key,experience_schema_version:profile.version}:{}),import_job_id:input.runId}
 if(before&&target.categoryMode!=='replace'&&!row.clears.includes('category_keys')){
  let preserve=before.categories||[]
  if(target.categoryMode==='remove'){const keyResult=await db.from('angelcare_marketplace_catalog_categories').select('id,category_key').in('id',preserve.map((v:Row)=>v.category_id));if(keyResult.error)throw keyResult.error;const removed=new Set(mergeIntent(row.values.category_keys,target.categoryKeys,'add'));const ids=new Set((keyResult.data||[]).filter((v:Row)=>removed.has(v.category_key)).map((v:Row)=>v.id));preserve=preserve.filter((v:Row)=>!ids.has(v.category_id))}
  const assigned=new Set((after.categories||[]).map((v:Row)=>v.category_id));after.categories=[...after.categories,...preserve.filter((v:Row)=>!assigned.has(v.category_id))]
  if(!row.values.primary_category_key){const primary=preserve.find((v:Row)=>v.is_primary);if(primary)after.categories=after.categories.map((v:Row)=>({...v,is_primary:v.category_id===primary.category_id}))}
 }
 if(before&&target.collectionMode==='merge'&&!row.clears.includes('availability_json')){const identity=(v:Row)=>[v.territory_id||'',v.city_zone_id||'',v.audience||'all'].join('|');const replaced=new Set((after.availability||[]).map(identity));after.availability=[...after.availability,...(before.availability||[]).filter((v:Row)=>!replaced.has(identity(v)))]}
 if((context.territoryId||context.tenantId)&&Object.keys(relationKeys).some(k=>k in row.values||row.clears.includes(k))){const ids=[...new Set<string>(Object.values(relationKeys).flatMap(k=>after.relation_config?.[k]||[]))].filter(id=>!input.virtual.some(v=>v.id===id));if(ids.length){const linked=await db.from('angelcare_marketplace_catalog_items').select('id,territory_id,tenant_id').in('id',ids);if(linked.error)throw linked.error;for(const v of linked.data||[])if(context.territoryId&&v.territory_id&&v.territory_id!==context.territoryId||context.tenantId&&v.tenant_id!==context.tenantId)throw Error('Une relation appartient à un autre périmètre.')}}
 const editorialEffective=(after.media||[]).filter((v:Row)=>text(v.media_key).startsWith('editorial-')).map((v:Row)=>{const role=text(v.media_key).replace('editorial-',''),override=after.experience_config?.editorial?.[role]?.image;return{role,assignedImage:v.asset_url,effectiveImage:override||v.asset_url,source:override?'Réglage explicite du dossier 360':'Placement média nommé'}})
 const changes=profile.fields.filter(f=>f.field_key in row.values||row.clears.includes(f.field_key)).map(f=>({key:f.field_key,label:f.label_fr,destination:f.destination,before:originalFieldValue(before,f),after:row.clears.includes(f.field_key)?null:row.values[f.field_key],intent:row.clears.includes(f.field_key)?'clear':'set'}))
 return {before:canonicalSnapshot(before),after:canonicalSnapshot(after),itemId,source,readiness:result.readiness,changes,editorialEffective,schemaFingerprint:await profileFingerprint(profile)}
}
