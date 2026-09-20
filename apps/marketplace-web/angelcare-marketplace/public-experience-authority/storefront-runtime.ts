import 'server-only'
import type {ComponentData,Data} from '@puckeditor/core'
import type {StorefrontExperience,StorefrontKey} from '@/angelcare-marketplace/catalog-discovery/types'
import {createServiceClient} from '@/lib/supabase/server'
import {applyStudioDynamicSources} from '@/angelcare-marketplace/studio-dynamic-source/engine'
import {preflightStudioRuntime} from '@/angelcare-marketplace/studio-public-runtime/preflight'
import {cmsBlocksToPuckData} from '@/angelcare-marketplace/studio-universal/puck-bridge'
import type {CmsBlock} from '@/angelcare-marketplace/experience-builder/types'
import type {StudioAttributionContext} from '@/angelcare-marketplace/studio-attribution/types'
import {getPublicExperienceStorefrontAssignment,getPublicExperienceThemeManifest} from './repository'
import {evaluateStorefrontThemeCompatibility} from './compatibility'
import {compilePublicExperienceTheme} from './theme-compiler'
import type {PublicExperienceThemeManifest,PublicExperienceThemeSlot} from './types'
import {storefrontMerchandisingPlan} from './storefront-intelligence'
import {canonicalStorefrontWorldById,isCanonicalBuiltinWorld,PEA_BUILTIN_REVISION} from './canonical-worlds'
import {evaluateAssignmentLifecycle} from './assignment-lifecycle'
import {headers} from 'next/headers'
import {enforceStorefrontStaticTruth,type StorefrontTruthEnforcementReport} from './storefront-truth-enforcement'

const object=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{ }
const blocks=(value:unknown):CmsBlock[]=>Array.isArray(value)?value.filter((row):row is CmsBlock=>Boolean(row)&&typeof row==='object'&&!Array.isArray(row)):[]
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T
const idOf=(component:ComponentData,index:number)=>String((component.props as Record<string,unknown>)?.id||`${component.type}-${index+1}`)
const materialized=(item:StorefrontExperience['items'][number])=>({title:item.name,label:item.category_title||'',body:item.short_description||'',description:item.short_description||'',mediaUrl:item.media_url||'',mediaAlt:item.name,value:item.id,__studioSourceReference:{sourceId:'catalog.items',entityId:item.id},action:{version:1,actionId:'catalog.open_item',target:{sourceId:'catalog.items',entityId:item.id}},actionLabel:'Découvrir'})

function templateData(document:unknown):Data{const doc=object(document);if(Array.isArray(doc.content))return doc as unknown as Data;return cmsBlocksToPuckData(blocks(doc.blocks),{locale:'fr'})}
function slotMap(manifest:PublicExperienceThemeManifest){const map=new Map<string,PublicExperienceThemeSlot>();for(const slot of manifest.slots)if(slot.blockId)map.set(slot.blockId,slot);return map}
function applySlots(data:Data,experience:StorefrontExperience,manifest:PublicExperienceThemeManifest,density:'premium'|'commerce'|'hyper_commerce'|'festival'):Data{
 const copy=clone(data),slots=slotMap(manifest),collections=experience.collections,plan=storefrontMerchandisingPlan(experience,density)
 const walk=(component:ComponentData,index:number)=>{const props=(component.props||{}) as Record<string,unknown>,slot=slots.get(idOf(component,index));if(slot){if(slot.slot==='hero'){props.eyebrow=experience.hero.eyebrow;props.title=experience.hero.title;props.lead=experience.hero.lead}else if(slot.slot==='featured_items')props.items=experience.featured.slice(0,plan.featuredLimit).map(materialized);else if(slot.slot==='inventory_items')props.items=experience.items.filter(item=>item.availability_status!=='unavailable').slice(0,plan.inventoryLimit).map(materialized);else if(slot.slot.startsWith('collection_')){const idx=Number(slot.slot.split('_')[1]||0),collection=collections[idx];if(collection){props.title=collection.title;props.lead=collection.subtitle||'';props.items=collection.items.map(materialized)}}else if(slot.slot==='facets'){props.items=Object.entries(experience.facets).slice(0,10).map(([key,values])=>({title:key,label:`${values.length} options`,body:values.slice(0,5).map(v=>`${v.value} (${v.count})`).join(' · ')}))}else if(slot.slot==='trust'){props.items=[{title:'Catalogue canonique',body:`${experience.items.length} offres publiées`},{title:'Données live',body:'Prix, disponibilité et preuves restent gouvernés par leurs autorités natives.'}]}}const nested=Array.isArray(props.content)?props.content as ComponentData[]:[];nested.forEach(walk)}
 ;(copy.content||[]).forEach(walk);return copy
}

export interface PublicStorefrontWorldRuntime {status:'READY'|'BUILTIN_READY'|'FALLBACK_NATIVE';data:Data|null;builtinWorldId:string|null;templateId:string|null;templateKey:string|null;revisionId:string|null;manifest:PublicExperienceThemeManifest|null;reason:string|null;dynamicReport:any|null;preflight:any|null;truthEnforcement:StorefrontTruthEnforcementReport|null;attribution:StudioAttributionContext|null;density:'premium'|'commerce'|'hyper_commerce'|'festival'|null}
const fallback=(input:Partial<PublicStorefrontWorldRuntime>&{reason:string}):PublicStorefrontWorldRuntime=>({status:'FALLBACK_NATIVE',data:null,builtinWorldId:null,templateId:null,templateKey:null,revisionId:null,manifest:null,dynamicReport:null,preflight:null,truthEnforcement:null,attribution:null,density:null,...input})

export async function preparePublicStorefrontWorld(experience:StorefrontExperience):Promise<PublicStorefrontWorldRuntime>{
 const persisted=await getPublicExperienceStorefrontAssignment(experience.key),builtinDefault=canonicalStorefrontWorldById(`builtin:pea:storefront:${experience.key}:v1`);const assignment=persisted&&persisted.enabled?persisted:(builtinDefault?{version:1 as const,storefrontKey:experience.key,templateId:builtinDefault.id,enabled:true,reason:'Canonical storefront default world',updatedAt:'2026-09-20T00:00:00.000Z',updatedBy:null,lifecycle:undefined,density:builtinDefault.density}:null);if(!assignment)return fallback({reason:'NO_STOREFRONT_WORLD_AVAILABLE'})
 const requestHeaders=await headers(),cohortSeed=`storefront:${experience.key}:${experience.locale}:${requestHeaders.get('x-forwarded-for')||''}:${requestHeaders.get('user-agent')||''}`;const lifecycle=evaluateAssignmentLifecycle(assignment.lifecycle,cohortSeed);if(!lifecycle.active)return fallback({reason:`ASSIGNMENT_${lifecycle.state}`,templateId:assignment.templateId})
 const manifest=await getPublicExperienceThemeManifest(assignment.templateId);if(!manifest)return fallback({reason:'MANIFEST_MISSING',templateId:assignment.templateId})
 const compatibility=evaluateStorefrontThemeCompatibility({manifest,storefrontKey:experience.key});if(!compatibility.compatible)return fallback({reason:'THEME_INCOMPATIBLE',templateId:assignment.templateId,manifest})
 const compile=compilePublicExperienceTheme({manifest,storefrontKey:experience.key});if(!compile.compatible)return fallback({reason:'THEME_COMPILE_BLOCKED',templateId:assignment.templateId,manifest})
 if(isCanonicalBuiltinWorld(assignment.templateId)){
  const builtin=canonicalStorefrontWorldById(assignment.templateId);if(!builtin||builtin.storefrontKey!==experience.key)return fallback({reason:'BUILTIN_STOREFRONT_MISMATCH',templateId:assignment.templateId,manifest})
  return{status:'BUILTIN_READY',data:null,builtinWorldId:builtin.id,templateId:builtin.id,templateKey:builtin.templateKey,revisionId:PEA_BUILTIN_REVISION,manifest,reason:null,dynamicReport:null,preflight:null,truthEnforcement:{blocked:false,blockedStaticClaims:[],sanitizedCount:0,reason:null},attribution:null,density:assignment.density||builtin.density}
 }
 const db=await createServiceClient(),template=await db.from('angelcare_marketplace_cms_templates').select('id,template_key,status,published_revision_id').eq('id',assignment.templateId).maybeSingle();if(template.error||!template.data||String(template.data.status)!=='published'||!template.data.published_revision_id)return fallback({reason:'TEMPLATE_UNPUBLISHED',templateId:assignment.templateId,manifest})
 const revision=await db.from('angelcare_marketplace_cms_template_revisions').select('id,document').eq('id',String(template.data.published_revision_id)).eq('template_id',assignment.templateId).maybeSingle();if(revision.error||!revision.data)return fallback({reason:'REVISION_MISSING',templateId:assignment.templateId,templateKey:String(template.data.template_key||''),manifest})
 try{
  const slotted=applySlots(templateData(revision.data.document),experience,manifest,assignment.density||'hyper_commerce'),truth=enforceStorefrontStaticTruth(slotted),truthEnforcement=truth.report;if(truthEnforcement.blocked)return fallback({reason:'TRUTH_FIREWALL_BLOCKED',templateId:assignment.templateId,templateKey:String(template.data.template_key||''),revisionId:String(revision.data.id),manifest,truthEnforcement})
  const dynamic=await applyStudioDynamicSources(truth.data,{locale:experience.locale,territoryId:null,audienceId:null,visibility:'public_runtime'});if(dynamic.report.blockerCount>0)return fallback({reason:'DYNAMIC_SOURCE_BLOCKER',templateId:assignment.templateId,templateKey:String(template.data.template_key||''),revisionId:String(revision.data.id),manifest,dynamicReport:dynamic.report,truthEnforcement})
  const preflight=await preflightStudioRuntime(dynamic.data,experience.locale);if(preflight.blockerCount>0)return fallback({reason:'ACTION_WORKFLOW_BLOCKER',templateId:assignment.templateId,templateKey:String(template.data.template_key||''),revisionId:String(revision.data.id),manifest,dynamicReport:dynamic.report,preflight,truthEnforcement})
  const attribution:StudioAttributionContext={version:1,surface:'assigned_template',pageId:null,pageRoute:`/angelcare-marketplace/${experience.locale}/${experience.key}`,pageRevisionId:null,templateId:assignment.templateId,templateKey:String(template.data.template_key||''),templateRevisionId:String(revision.data.id),templateScope:`storefront:${experience.key}`,blockId:null,interactionId:null,actionId:null,workflowId:null,itemId:null,itemSlug:null,collectionId:null,placementId:null,campaignId:null,audienceId:null,territoryId:null,locale:experience.locale,traceId:null,referrerHost:null,referrerPath:null,visitorHash:null,utmSource:null,utmMedium:null,utmCampaign:null,utmContent:null}
  return{status:'READY',data:dynamic.data,builtinWorldId:null,templateId:assignment.templateId,templateKey:String(template.data.template_key||''),revisionId:String(revision.data.id),manifest,reason:null,dynamicReport:dynamic.report,preflight,truthEnforcement,attribution,density:assignment.density||'hyper_commerce'}
 }catch{return fallback({reason:'RUNTIME_ERROR',templateId:assignment.templateId,templateKey:String(template.data.template_key||''),revisionId:String(revision.data.id),manifest})}
}

export function isStorefrontKey(value:string):value is StorefrontKey{return ['families','home-services','development','kits','academy','establishments','hospitality','health-partners','corporates','partner-os','quality-check','professionals'].includes(value)}
