import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { assertTransition, canPublish, validateArabic, validatePlaceholderParity } from './validation'
import {bridgePublishedEntityTranslation} from './entity-bridge'
import {listInventory} from './repository'

export type LocalizationAuthorityMode='translations'|'sources'|'glossary'|'memory'|'reviews'|'seo'|'readiness'
type Row=Record<string,unknown>
const text=(value:unknown)=>typeof value==='string'?value.trim():''
const bool=(value:unknown)=>value===true||value==='true'
const rows=<T extends Row>(value:unknown):T[]=>Array.isArray(value)?value.filter((entry):entry is T=>Boolean(entry)&&typeof entry==='object'):[]
function missing(error:{code?:string}|null){return error?.code==='42P01'||error?.code==='PGRST205'}
function fail(action:string,error:unknown):never{throw new MarketplaceError('INTERNAL_ERROR',`Impossible de ${action}.`,{cause:error,retryable:true})}
async function listTable(table:string,order='updated_at',limit=250){const db=await createServiceClient();const{data,error}=await db.from(table).select('*').order(order,{ascending:false}).limit(limit);if(error){if(missing(error))throw new MarketplaceError('CONFIGURATION_ERROR',`La table ${table} requise par Localization OS est absente.`,{cause:error});fail(`charger ${table}`,error)}return rows(data)}

export async function loadLocalizationAuthority(mode:LocalizationAuthorityMode){
 if(mode==='translations')return(await listInventory({page:1,pageSize:1000})).rows
 if(mode==='sources')return listTable('angelcare_marketplace_localization_source_registries')
 if(mode==='glossary')return listTable('angelcare_marketplace_glossary_terms')
 if(mode==='memory')return listTable('angelcare_marketplace_translation_memory','created_at')
 if(mode==='reviews'){const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_translations').select('*, angelcare_marketplace_translation_candidates(translation_key,source_text_fr,source_hash,sensitivity,domain,route)').in('status',['in_review','reviewed','approved','rejected']).order('updated_at',{ascending:false}).limit(250);if(error)fail('charger les revues de traduction',error);return rows(data)}
 if(mode==='seo')return listTable('angelcare_marketplace_seo_metadata')
 return listTable('angelcare_marketplace_locale_readiness_snapshots','calculated_at')
}

async function audit(context:MarketplaceRequestContext,requestId:string,request:Request|undefined,action:string,objectType:string,objectId:string,afterValue:unknown,reason?:string|null){await writeMarketplaceAudit({context,requestId,request,action,objectType,objectId,afterValue,reason:reason||undefined,severity:'info',source:'ultra-mz2-localization'})}
async function glossaryValid(source:string,target:string,locale:'en'|'ar'){const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_glossary_terms').select('source_fr,approved_en,approved_ar,brand_locked,translation_allowed').eq('status','approved').limit(500);if(error)fail('charger le glossaire',error);for(const row of rows(data)){const sourceTerm=text(row.source_fr);if(!sourceTerm||!source.toLowerCase().includes(sourceTerm.toLowerCase()))continue;const expected=text(locale==='en'?row.approved_en:row.approved_ar);if(expected&&!target.toLowerCase().includes(expected.toLowerCase()))return false;if(bool(row.brand_locked)&&!expected&&target.toLowerCase().includes(sourceTerm.toLowerCase())===false)return false}return true}

export async function executeLocalizationCommand(input:Row,context:MarketplaceRequestContext,requestId:string,request?:Request){
 const command=text(input.command),db=await createServiceClient(),now=new Date().toISOString()
 if(command==='translation.save'){
  const candidateId=text(input.candidateId),targetLocale=text(input.targetLocale) as 'en'|'ar',translationText=text(input.translationText)
  if(!candidateId||!['en','ar'].includes(targetLocale)||!translationText)throw new MarketplaceError('VALIDATION_ERROR','Candidat, locale EN/AR et traduction sont requis.')
  const{data:candidate,error:candidateError}=await db.from('angelcare_marketplace_translation_candidates').select('*').eq('id',candidateId).maybeSingle();if(candidateError||!candidate)throw new MarketplaceError('NOT_FOUND','Candidat de traduction introuvable.',{cause:candidateError||undefined})
  const parity=validatePlaceholderParity(text(candidate.source_text_fr),translationText);if(!parity.valid)throw new MarketplaceError('VALIDATION_ERROR',`Variables incohérentes. Manquantes: ${parity.missing.join(', ')||'aucune'}; supplémentaires: ${parity.extra.join(', ')||'aucune'}.`)
  if(targetLocale==='ar'&&!validateArabic(translationText).valid)throw new MarketplaceError('VALIDATION_ERROR','La traduction arabe ne satisfait pas le contrôle de script RTL.')
  const payload={candidate_id:candidateId,target_locale:targetLocale,translation_text:translationText,status:'draft',freshness_state:'current',source_hash_at_translation:text(candidate.source_hash),translator_id:context.actor.id,updated_at:now}
  const{data,error}=await db.from('angelcare_marketplace_translations').upsert(payload,{onConflict:'candidate_id,target_locale'}).select('*').single();if(error||!data)fail('enregistrer la traduction',error)
  await audit(context,requestId,request,'localization.translation.saved','translation',String(data.id),data);return data
 }
 if(command==='translation.transition'||command==='review.decide'){
  const translationId=text(input.translationId),to=command==='review.decide'?(text(input.decision)==='approve'?'approved':'rejected'):text(input.to),reason=text(input.reason)||null
  if(!translationId||!['in_review','approved','rejected','published','archived'].includes(to))throw new MarketplaceError('VALIDATION_ERROR','Transition de traduction invalide.')
  const{data:translation,error:tError}=await db.from('angelcare_marketplace_translations').select('*, angelcare_marketplace_translation_candidates(*)').eq('id',translationId).maybeSingle();if(tError||!translation)throw new MarketplaceError('NOT_FOUND','Traduction introuvable.',{cause:tError||undefined})
  const candidate=(translation.angelcare_marketplace_translation_candidates||{}) as Row,targetLocale=text(translation.target_locale) as 'en'|'ar',target=text(translation.translation_text),source=text(candidate.source_text_fr)
  assertTransition(text(translation.status) as Parameters<typeof assertTransition>[0],to as Parameters<typeof assertTransition>[1])
  if(to==='published'){
    const parity=validatePlaceholderParity(source,target),rtl=targetLocale==='ar'?validateArabic(target).valid:true,glossary=await glossaryValid(source,target,targetLocale)
    let mandatoryLocalesPresent=true
    if(text(candidate.sensitivity)!=='ordinary'){const{data:siblings,error:sError}=await db.from('angelcare_marketplace_translations').select('target_locale,status').eq('candidate_id',String(candidate.id));if(sError)fail('vérifier les langues obligatoires',sError);const ok=new Set(rows(siblings).filter(row=>['approved','published'].includes(text(row.status))).map(row=>text(row.target_locale)));mandatoryLocalesPresent=ok.has('en')&&ok.has('ar')}
    const gate=canPublish({sourceCurrent:text(translation.source_hash_at_translation)===text(candidate.source_hash),targetLocale,sensitivity:text(candidate.sensitivity),approved:['approved','published'].includes(text(translation.status)),placeholderValid:parity.valid,glossaryValid:glossary,rtlValid:rtl,mandatoryLocalesPresent})
    if(!gate.allowed)throw new MarketplaceError('NOT_READY',`Publication bloquée: ${gate.blockers.join(' · ')}`)
  }
  const update:Row={status:to,updated_at:now};if(to==='in_review')update.reviewer_id=context.actor.id;if(to==='approved')update.approved_by=context.actor.id;if(to==='published'){update.published_by=context.actor.id;update.published_at=now;update.freshness_state='current'}
  const{data,error}=await db.from('angelcare_marketplace_translations').update(update).eq('id',translationId).select('*').single();if(error||!data)fail('transitionner la traduction',error)
  if(to==='published')await bridgePublishedEntityTranslation(candidate,targetLocale,target)
  if(['approved','rejected'].includes(to)){const{error:rError}=await db.from('angelcare_marketplace_translation_reviews').insert({translation_id:translationId,decision:to,reviewer_id:context.actor.id,comments:reason,quality_checks:{source_hash_current:text(translation.source_hash_at_translation)===text(candidate.source_hash)}});if(rError)fail('enregistrer la décision de revue',rError)}
  await audit(context,requestId,request,`localization.translation.${to}`,'translation',translationId,data,reason);return data
 }
 if(command==='glossary.upsert'){
  const termKey=text(input.termKey),sourceFr=text(input.sourceFr);if(!termKey||!sourceFr)throw new MarketplaceError('VALIDATION_ERROR','Clé et terme français sont requis.')
  const payload={term_key:termKey,source_fr:sourceFr,approved_en:text(input.approvedEn)||null,approved_ar:text(input.approvedAr)||null,brand_locked:bool(input.brandLocked),translation_allowed:input.translationAllowed!==false,usage_guidance:text(input.usageGuidance)||null,status:'approved',owner_id:context.actor.id,reviewer_id:context.actor.id,updated_at:now}
  const{data,error}=await db.from('angelcare_marketplace_glossary_terms').upsert(payload,{onConflict:'term_key'}).select('*').single();if(error||!data)fail('enregistrer le terme',error);await audit(context,requestId,request,'localization.glossary.saved','glossary_term',String(data.id),data);return data
 }
 if(command==='memory.curate'){
  const translationId=text(input.translationId);if(!translationId)throw new MarketplaceError('VALIDATION_ERROR','Traduction requise.')
  const{data:t,error}=await db.from('angelcare_marketplace_translations').select('*, angelcare_marketplace_translation_candidates(source_text_fr,source_hash,domain,context_description,territory_id)').eq('id',translationId).maybeSingle();if(error||!t)throw new MarketplaceError('NOT_FOUND','Traduction introuvable.',{cause:error||undefined});if(!['approved','published'].includes(text(t.status)))throw new MarketplaceError('NOT_READY','Seule une traduction approuvée peut alimenter la mémoire.')
  const c=(t.angelcare_marketplace_translation_candidates||{}) as Row,payload={source_text_fr:text(c.source_text_fr),source_hash:text(c.source_hash),target_locale:text(t.target_locale),target_text:text(t.translation_text),domain:text(c.domain)||null,context:text(c.context_description)||null,territory_id:c.territory_id||null,quality_score:100,approved:true,approved_by:context.actor.id,last_used_at:now}
  const{data,error:mError}=await db.from('angelcare_marketplace_translation_memory').upsert(payload,{onConflict:'source_hash,target_locale,target_text'}).select('*').single();if(mError||!data)fail('curer la mémoire de traduction',mError);await audit(context,requestId,request,'localization.memory.curated','translation_memory',String(data.id),data);return data
 }
 if(command==='source.set'){
  const sourceKey=text(input.sourceKey);if(!sourceKey)throw new MarketplaceError('VALIDATION_ERROR','Source requise.');const{data,error}=await db.from('angelcare_marketplace_localization_source_registries').update({enabled:input.enabled!==false,required:input.required!==false,owner_id:context.actor.id,updated_at:now}).eq('source_key',sourceKey).select('*').single();if(error||!data)fail('mettre à jour la source',error);await audit(context,requestId,request,'localization.source.updated','localization_source',String(data.id),data);return data
 }
 if(command==='seo.upsert'){
  const route=text(input.route),locale=text(input.locale);if(!route||!['fr','en','ar'].includes(locale))throw new MarketplaceError('VALIDATION_ERROR','Route et locale sont requis.');const payload={route,locale,title:text(input.title)||null,description:text(input.description)||null,canonical_url:text(input.canonicalUrl)||null,status:text(input.status)||'draft',indexing_status:text(input.indexingStatus)||'draft',owner_id:context.actor.id,reviewer_id:context.actor.id,updated_at:now};
  const existing=await db.from('angelcare_marketplace_seo_metadata').select('id').eq('route',route).eq('locale',locale).is('territory_id',null).limit(1).maybeSingle();if(existing.error)fail('rechercher le SEO localisé',existing.error)
  const mutation=existing.data?.id?db.from('angelcare_marketplace_seo_metadata').update(payload).eq('id',existing.data.id):db.from('angelcare_marketplace_seo_metadata').insert({...payload,territory_id:null});const{data,error}=await mutation.select('*').single();if(error||!data)fail('enregistrer le SEO localisé',error);await audit(context,requestId,request,'localization.seo.saved','seo_metadata',String(data.id),data);return data
 }
 if(command==='readiness.recalculate'){
  const{count:required,error:e0}=await db.from('angelcare_marketplace_translation_candidates').select('id',{count:'exact',head:true});if(e0)fail('compter les sources de traduction',e0)
  const counts:Record<string,number>={en:0,ar:0};for(const locale of ['en','ar']){const{count,error}=await db.from('angelcare_marketplace_translations').select('id',{count:'exact',head:true}).eq('target_locale',locale).eq('status','published').eq('freshness_state','current');if(error)fail(`calculer readiness ${locale}`,error);counts[locale]=count||0}
  const{count:blockers,error:e1}=await db.from('angelcare_marketplace_translation_inventory_v').select('candidate_id',{count:'exact',head:true}).neq('sensitivity','ordinary').in('freshness_state',['missing','translation_stale','blocked']);if(e1)fail('calculer les bloquants sensibles',e1)
  const total=required||0,score=total?Math.min(counts.en,counts.ar)/total*100:100
  const payload={territory_id:null,route:null,required_candidates:total,current_fr:total,current_en:counts.en,current_ar:counts.ar,sensitive_blockers:blockers||0,failed_sources:0,readiness_score:Number(score.toFixed(2)),is_truthful_complete:score===100&&(blockers||0)===0,calculated_at:now}
  const{data,error}=await db.from('angelcare_marketplace_locale_readiness_snapshots').insert(payload).select('*').single();if(error||!data)fail('enregistrer la readiness',error);await audit(context,requestId,request,'localization.readiness.recalculated','locale_readiness',String(data.id),data);return data
 }
 throw new MarketplaceError('VALIDATION_ERROR','Commande Localization MZ2 inconnue.')
}
