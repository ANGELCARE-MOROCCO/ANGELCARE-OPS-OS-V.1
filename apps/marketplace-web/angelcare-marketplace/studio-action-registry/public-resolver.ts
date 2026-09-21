import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { getStudioActionDescriptor } from './registry'
import { safeExternalStudioUrl } from './reference'
import type { StudioActionReference, StudioResolvedAction } from './types'

const localeOf=(value:string):'fr'|'en'|'ar'=>value==='en'||value==='ar'?value:'fr'
const text=(v:unknown)=>v==null?'':String(v)
const live=(s:string)=>!['archived','disabled','deleted','draft','review','in_review'].includes(s.toLowerCase())

async function targetRecord(action:StudioActionReference){
  if(!action.target)return null
  const db=await createServiceClient();const {sourceId,entityId}=action.target
  const table=sourceId==='catalog.items'?'angelcare_marketplace_catalog_items':sourceId==='catalog.categories'?'angelcare_marketplace_catalog_categories':sourceId==='homepage.collections'?'angelcare_marketplace_homepage_collections':sourceId==='content.pages'?'angelcare_marketplace_cms_pages':sourceId==='academy.programmes'?'angelcare_marketplace_academy_programs':sourceId==='academy.cohorts'?'angelcare_marketplace_academy_cohorts':sourceId==='partners.plans'?'angelcare_marketplace_partner_plans':sourceId==='b2b.programmes'?'angelcare_marketplace_b2b_programs':null
  if(!table)return null
  const {data}=await db.from(table).select('*').eq('id',entityId).maybeSingle();return data as Record<string,unknown>|null
}

async function navigationHref(entityId:string,locale:'fr'|'en'|'ar'){
  const db=await createServiceClient()
  if(entityId.startsWith('page:')){const id=entityId.slice(5);const {data}=await db.from('angelcare_marketplace_cms_pages').select('slug,locale,status,publication_state').eq('id',id).maybeSingle();if(!data||!live(text(data.status))||['draft','review','in_review'].includes(text(data.publication_state).toLowerCase()))return null;return `/angelcare-marketplace/${text(data.locale)||locale}/${text(data.slug)}`}
  if(entityId.startsWith('catalog:')){const id=entityId.slice(8);const {data}=await db.from('angelcare_marketplace_catalog_items').select('slug,status').eq('id',id).maybeSingle();if(!data||!live(text(data.status)))return null;return `/angelcare-marketplace/${locale}/marketplace/item/${text(data.slug)}`}
  if(entityId.startsWith('nav:')){const id=entityId.slice(4);const {data}=await db.from('angelcare_marketplace_public_navigation_v').select('href,status').eq('id',id).maybeSingle();if(!data||!live(text(data.status)))return null;const href=text(data.href);return href.startsWith('/')?href:null}
  return null
}

export async function resolveStudioPublicAction(action:StudioActionReference|null|undefined,localeInput:string,context?:{itemId?:string|null;itemSlug?:string|null}):Promise<StudioResolvedAction|null>{
  if(!action)return null
  if(action.targetMode==='current_item'&&!action.target&&context?.itemId)action={...action,target:{sourceId:'catalog.items',entityId:context.itemId}}
  const descriptor=getStudioActionDescriptor(action.actionId);if(!descriptor)return{status:'INVALID',actionId:action.actionId,label:'Action inconnue',href:null,external:false,newWindow:false,canonicalEngine:'unknown',creates:null,adminDestination:null,target:action.target,reason:'Action Studio non enregistrée.',validations:[]}
  const base={actionId:descriptor.id,label:descriptor.label,canonicalEngine:descriptor.canonicalEngine,creates:descriptor.creates,adminDestination:descriptor.adminDestination,target:action.target,validations:descriptor.validations,newWindow:action.newWindow??Boolean(descriptor.defaultNewWindow)}
  if(descriptor.executionMode==='external'){const href=safeExternalStudioUrl(action.externalUrl);return href?{...base,status:'READY',href,external:true}:{...base,status:'UNSAFE_EXTERNAL_URL',href:null,external:true,reason:'URL externe refusée par la politique Studio.'}}
  if(descriptor.executionMode==='workflow'&&descriptor.p07WorkflowRequired)return{...base,status:'WORKFLOW_REQUIRED',href:null,external:false,reason:'Workflow reconnu; rendu/formulaire natif finalisé en P07.'}
  if(descriptor.targetRequired&&!action.target&&action.targetMode==='current_item')return{...base,status:'CONTEXT_REQUIRED' as const,href:null,external:false,reason:'Le World attend l’offre canonique courante comme cible.'}
  if(descriptor.targetRequired&&!action.target)return{...base,status:'TARGET_REQUIRED',href:null,external:false,reason:'Sélection canonique requise.'}
  if(action.target&&descriptor.targetSources.length&&!descriptor.targetSources.includes(action.target.sourceId))return{...base,status:'TARGET_UNSUPPORTED',href:null,external:false,reason:'Type de cible non autorisé pour cette action.'}
  const locale=localeOf(localeInput)
  if(descriptor.id==='navigation.open'&&action.target){let href:string|null=null;if(action.target.sourceId==='navigation.destinations')href=await navigationHref(action.target.entityId,locale);else if(action.target.sourceId==='content.pages'){const row=await targetRecord(action);if(row&&live(text(row.status))&&!['draft','review','in_review'].includes(text(row.publication_state).toLowerCase()))href=`/angelcare-marketplace/${text(row.locale)||locale}/${text(row.slug)}`}return href?{...base,status:'READY',href,external:false}:{...base,status:'TARGET_NOT_FOUND',href:null,external:false,reason:'Destination indisponible ou non publiée.'}}
  if(descriptor.id==='checkout.start'&&!action.target)return{...base,status:'CONTEXT_REQUIRED',href:`/angelcare-marketplace/${locale}/basket`,external:false,reason:'Le checkout exige un panier; redirection sûre vers le panier.'}
  if(descriptor.id==='family_request.start'&&!action.target)return{...base,status:'READY',href:`/angelcare-marketplace/${locale}/family/request`,external:false}
  const row=await targetRecord(action)
  if(action.target&&!row)return{...base,status:'TARGET_NOT_FOUND',href:null,external:false,reason:'Cible introuvable.'}
  if(row&&!live(text(row.status||row.operational_status)))return{...base,status:'TARGET_NOT_PUBLISHED',href:null,external:false,reason:'Cible non publiée ou indisponible.'}
  const slug=text(row?.slug||row?.item_slug||row?.public_slug)
  let href:string|null=null
  if(descriptor.id==='catalog.open_item'&&slug)href=`/angelcare-marketplace/${locale}/marketplace/item/${slug}`
  if(descriptor.id==='catalog.open_category'){const categorySlug=text(row?.slug||row?.category_key);if(categorySlug)href=`/angelcare-marketplace/${locale}/marketplace/category/${categorySlug}`}
  if(descriptor.id==='catalog.open_collection'){const key=text(row?.collection_key);if(key)href=`/angelcare-marketplace/${locale}?collection=${encodeURIComponent(key)}`}
  if(descriptor.id==='booking.start'&&slug)href=`/angelcare-marketplace/${locale}/booking/${slug}`
  if(descriptor.id==='quotation.start'&&slug)href=`/angelcare-marketplace/${locale}/quotation/${slug}`
  if(descriptor.id==='basket.add'&&slug)href=`/angelcare-marketplace/${locale}/basket?item=${encodeURIComponent(slug)}`
  if(descriptor.id==='checkout.start'&&slug)href=`/angelcare-marketplace/${locale}/basket?item=${encodeURIComponent(slug)}`
  if(descriptor.id==='academy.enroll')href=slug?`/angelcare-marketplace/${locale}/enrollment/${slug}`:`/angelcare-marketplace/${locale}/academy/request`
  if(descriptor.id==='subscription.start')href=slug?`/angelcare-marketplace/${locale}/subscription/${slug}`:`/angelcare-marketplace/${locale}/partner-os/contact${action.target?`?plan=${encodeURIComponent(action.target.entityId)}`:''}`
  if(descriptor.id==='family_request.start')href=`/angelcare-marketplace/${locale}/family/request${action.target?`?item=${encodeURIComponent(action.target.entityId)}`:''}`
  if(descriptor.id==='b2b.request'){const vertical=text(row?.vertical||row?.program_type).toLowerCase();const baseRoute=vertical.includes('hotel')||vertical.includes('hospitality')?'hospitality':vertical.includes('health')||vertical.includes('clinic')?'health-partners':'corporates';href=`/angelcare-marketplace/${locale}/${baseRoute}/request?program=${encodeURIComponent(action.target?.entityId||'')}`}
  return href?{...base,status:'READY',href,external:false}:{...base,status:'TARGET_UNSUPPORTED',href:null,external:false,reason:'Aucune route publique canonique résolue pour cette cible.'}
}
