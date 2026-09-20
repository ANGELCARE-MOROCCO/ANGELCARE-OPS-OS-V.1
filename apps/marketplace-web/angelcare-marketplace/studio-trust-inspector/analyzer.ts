import 'server-only'
import type { ComponentData,Data } from '@puckeditor/core'
import { hasMarketplacePermission } from '@/angelcare-marketplace/auth/context'
import type { MarketplacePermission,MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { STUDIO_SOURCE_DESCRIPTORS,getStudioSourceDescriptor } from '@/angelcare-marketplace/studio-source-registry/registry'
import { validateStudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/resolver'
import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import { isStudioSourceReference } from '@/angelcare-marketplace/studio-picker/reference'
import { studioSourceAdminHref } from '@/angelcare-marketplace/studio-picker/admin-destinations'
import { isStudioActionReference } from '@/angelcare-marketplace/studio-action-registry/reference'
import { getStudioActionDescriptor } from '@/angelcare-marketplace/studio-action-registry/registry'
import { resolveStudioPublicAction } from '@/angelcare-marketplace/studio-action-registry/public-resolver'
import { isStudioWorkflowReference } from '@/angelcare-marketplace/studio-workflows/reference'
import { getStudioWorkflowDescriptor } from '@/angelcare-marketplace/studio-workflows/registry'
import { studioBindingTarget,studioLiveBinding,isStudioLiveBindingReference } from '@/angelcare-marketplace/studio-live-binding/registry'
import { isStudioDynamicSourceReference } from '@/angelcare-marketplace/studio-dynamic-source/registry'
import { applyStudioDynamicSources } from '@/angelcare-marketplace/studio-dynamic-source/engine'
import { preflightStudioRuntime } from '@/angelcare-marketplace/studio-public-runtime/preflight'
import { resolveStudioTemplateForCatalogItem } from '@/angelcare-marketplace/studio-template-assignment/resolver'
import { getAdaptiveExperience } from '@/angelcare-marketplace/category-native-experience/repository'
import { prepareStudioPublicRuntime } from '@/angelcare-marketplace/studio-public-runtime/orchestrator'
import { STUDIO_ATTRIBUTION_DEVELOPER_CONTRACT } from '@/angelcare-marketplace/studio-attribution/developer-contract'
import { studioPageAttribution } from '@/angelcare-marketplace/studio-attribution/context'
import type { StudioTrustActionEntry,StudioTrustBindingEntry,StudioTrustDestinationEntry,StudioTrustPermissionEntry,StudioTrustReport,StudioTrustRuntimeSummary,StudioTrustSeverity,StudioTrustSourceEntry,StudioTrustWorkflowEntry } from './types'
import { studioTrustRuntimeSeverity,studioTrustSeverityForSource,studioTrustStatus } from './classification'

const MAX_SOURCE_REFERENCES=120
const obj=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
const text=(value:unknown)=>value==null?'':String(value)
const blockId=(component:ComponentData)=>text(obj(component.props).id)||text(component.type)||'block'
const children=(component:ComponentData)=>Array.isArray(obj(component.props).content)?obj(component.props).content as ComponentData[]:[]
const severityForStatus=(status:string):StudioTrustSeverity=>['READY','WORKFLOW_READY','VALID','RESOLVED','BOUND','STUDIO_READY'].includes(status)?'info':['CONTEXT_REQUIRED','NOT_PUBLISHED','EMPTY_PRESERVED','EMPTY_EMPTIED','BLOCK_HIDDEN','MISSING_PRESERVED','MISSING_EMPTIED','MISSING_OMITTED'].includes(status)?'warning':'blocker'
const actionCandidates=(props:Record<string,unknown>):[string,unknown][]=>{const out:[string,unknown][]=[['primaryAction',props.primaryAction],['secondaryAction',props.secondaryAction]];if(Array.isArray(props.items))for(const [index,row] of props.items.entries())if(row&&typeof row==='object'&&!Array.isArray(row))out.push([`items.${index}.action`,(row as Record<string,unknown>).action]);return out.filter(([,value])=>value!==undefined&&value!==null)}

type SourceOccurrence={blockId:string;path:string;reference:StudioSourceReference}
type ActionOccurrence={blockId:string;slot:string;raw:unknown}
type WorkflowOccurrence={blockId:string;raw:unknown}
type BindingOccurrence={blockId:string;target:string;raw:unknown}

function scanDocument(data:Data){
  const sources:SourceOccurrence[]=[],actions:ActionOccurrence[]=[],workflows:WorkflowOccurrence[]=[],bindings:BindingOccurrence[]=[]
  let blocks=0
  const scanRefs=(value:unknown,path:string,id:string)=>{
    if(sources.length>=MAX_SOURCE_REFERENCES)return
    if(isStudioSourceReference(value)){sources.push({blockId:id,path,reference:value});return}
    if(Array.isArray(value)){value.forEach((row,index)=>scanRefs(row,`${path}[${index}]`,id));return}
    if(!value||typeof value!=='object')return
    for(const [key,row] of Object.entries(value as Record<string,unknown>))scanRefs(row,`${path}.${key}`,id)
  }
  const walk=(component:ComponentData)=>{
    blocks++;const props=obj(component.props),id=blockId(component)
    const rawBindings=obj(props.__studioBindings);for(const [target,raw] of Object.entries(rawBindings))bindings.push({blockId:id,target,raw})
    if(props.__studioWorkflow!==undefined)workflows.push({blockId:id,raw:props.__studioWorkflow})
    for(const [slot,raw] of actionCandidates(props))actions.push({blockId:id,slot,raw})
    scanRefs(props,'props',id)
    for(const child of children(component))walk(child)
  }
  for(const component of Array.isArray(data.content)?data.content:[])walk(component)
  return{blocks,sources,actions,workflows,bindings}
}

async function inspectSources(rows:SourceOccurrence[],context:MarketplaceRequestContext,locale:'fr'|'en'|'ar'):Promise<StudioTrustSourceEntry[]>{
  return Promise.all(rows.slice(0,MAX_SOURCE_REFERENCES).map(async row=>{
    const descriptor=getStudioSourceDescriptor(row.reference.sourceId)
    const validation=await validateStudioSourceReference(row.reference,{limit:1,context:{locale,territoryId:context.territoryId,audienceId:null}},context)
    const severity=studioTrustSeverityForSource(validation.status)
    return{blockId:row.blockId,path:row.path,reference:row.reference,status:validation.status,severity,title:validation.entity?.title||null,authority:descriptor?.authority.reference||null,permission:descriptor?.governance.permission||null,publicationAware:Boolean(descriptor?.governance.publicationAware),adminHref:validation.status==='NOT_AUTHORIZED'?null:studioSourceAdminHref(row.reference),note:validation.reason||validation.entity?.subtitle||'Référence canonique valide.'}
  }))
}

function inspectBindings(rows:BindingOccurrence[]):StudioTrustBindingEntry[]{return rows.map(row=>{
  const target=studioBindingTarget(row.target)
  if(!target)return{blockId:row.blockId,target:row.target,bindingKey:'unknown',status:'INCOMPATIBLE_TARGET',severity:'blocker',authority:null,missingPolicy:null,note:'Cible de binding non enregistrée.'}
  if(!isStudioLiveBindingReference(row.raw)){const bindingKey=text(obj(row.raw).bindingKey)||'unknown';return{blockId:row.blockId,target:row.target,bindingKey,status:'UNKNOWN_BINDING',severity:'blocker',authority:null,missingPolicy:text(obj(row.raw).missingPolicy)||null,note:'Binding inconnue ou invalide.'}}
  const descriptor=studioLiveBinding(row.raw.bindingKey)
  if(!descriptor)return{blockId:row.blockId,target:row.target,bindingKey:row.raw.bindingKey,status:'UNKNOWN_BINDING',severity:'blocker',authority:null,missingPolicy:row.raw.missingPolicy,note:'Binding non enregistrée.'}
  if(!target.accepts.includes(descriptor.valueType))return{blockId:row.blockId,target:row.target,bindingKey:row.raw.bindingKey,status:'INCOMPATIBLE_TARGET',severity:'blocker',authority:descriptor.authority,missingPolicy:row.raw.missingPolicy,note:`Le type ${descriptor.valueType} n'est pas accepté par ${target.label}.`}
  return{blockId:row.blockId,target:row.target,bindingKey:row.raw.bindingKey,status:'DECLARED',severity:'info',authority:descriptor.authority,missingPolicy:row.raw.missingPolicy,note:`${descriptor.label} → ${target.label}`}
})}

async function inspectActions(rows:ActionOccurrence[],locale:'fr'|'en'|'ar'):Promise<StudioTrustActionEntry[]>{return Promise.all(rows.map(async row=>{
  if(!isStudioActionReference(row.raw))return{blockId:row.blockId,slot:row.slot,actionId:'unknown',status:'INVALID',severity:'blocker',label:'Action invalide',canonicalEngine:null,creates:null,adminDestination:null,validations:[],target:null,note:'Action Studio non enregistrée.'}
  const descriptor=getStudioActionDescriptor(row.raw.actionId),resolved=await resolveStudioPublicAction(row.raw,locale)
  const status=resolved?.status||'INVALID',severity=severityForStatus(status)
  return{blockId:row.blockId,slot:row.slot,actionId:row.raw.actionId,status,severity,label:descriptor?.label||row.raw.actionId,canonicalEngine:descriptor?.canonicalEngine||resolved?.canonicalEngine||null,creates:descriptor?.creates||resolved?.creates||null,adminDestination:descriptor?.adminDestination||resolved?.adminDestination||null,validations:[...(descriptor?.validations||[])],target:row.raw.target||null,note:resolved?.reason||resolved?.canonicalEngine||descriptor?.description||'Action résolue.'}
}))}

async function inspectWorkflows(rows:WorkflowOccurrence[],context:MarketplaceRequestContext,locale:'fr'|'en'|'ar'):Promise<StudioTrustWorkflowEntry[]>{return Promise.all(rows.map(async row=>{
  if(!isStudioWorkflowReference(row.raw))return{blockId:row.blockId,workflowId:'unknown',status:'INVALID',severity:'blocker',label:'Workflow invalide',execution:null,canonicalEngine:null,creates:null,adminDestination:null,consentKeys:[],target:null,note:'Workflow Studio non enregistré.'}
  const descriptor=getStudioWorkflowDescriptor(row.raw.workflowId)
  if(!descriptor)return{blockId:row.blockId,workflowId:row.raw.workflowId,status:'INVALID',severity:'blocker',label:row.raw.workflowId,execution:null,canonicalEngine:null,creates:null,adminDestination:null,consentKeys:[],target:row.raw.target||null,note:'Workflow non enregistré.'}
  let status='READY',note=descriptor.description
  if(descriptor.targetRequired&&!row.raw.target){status='TARGET_REQUIRED';note='Cible canonique obligatoire absente.'}
  else if(row.raw.target&&descriptor.targetSources.length&&!descriptor.targetSources.includes(row.raw.target.sourceId)){status='TARGET_UNSUPPORTED';note='La source de cible ne correspond pas au workflow.'}
  else if(row.raw.target){const validation=await validateStudioSourceReference(row.raw.target,{limit:1,context:{locale,territoryId:context.territoryId,audienceId:null}},context);if(validation.status!=='VALID'){status=validation.status;note=validation.reason||'Cible non valide.'}}
  return{blockId:row.blockId,workflowId:descriptor.id,status,severity:severityForStatus(status),label:descriptor.label,execution:descriptor.execution,canonicalEngine:descriptor.canonicalEngine,creates:descriptor.creates,adminDestination:descriptor.adminDestination,consentKeys:[...descriptor.consentKeys],target:row.raw.target||null,note}
}))}

function permissionsFor(sources:StudioTrustSourceEntry[],context:MarketplaceRequestContext):StudioTrustPermissionEntry[]{
  const map=new Map<string,Set<string>>();map.set('marketplace.cms.view',new Set(['Studio Trust Inspector']))
  for(const row of sources)if(row.permission){const set=map.get(row.permission)||new Set<string>();set.add(`${row.reference.sourceId} · ${row.blockId}`);map.set(row.permission,set)}
  return[...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([permission,usedBy])=>({permission,granted:hasMarketplacePermission(context,permission as MarketplacePermission),usedBy:[...usedBy]}))
}

function destinationsFor(sources:StudioTrustSourceEntry[],actions:StudioTrustActionEntry[],workflows:StudioTrustWorkflowEntry[]):StudioTrustDestinationEntry[]{
  const rows:StudioTrustDestinationEntry[]=[]
  for(const row of sources)if(row.adminHref)rows.push({kind:'source',label:row.title||row.reference.sourceId,href:row.adminHref})
  for(const row of actions)if(row.adminDestination)rows.push({kind:'action',label:row.label,href:row.adminDestination})
  for(const row of workflows)if(row.adminDestination)rows.push({kind:'workflow',label:row.label,href:row.adminDestination})
  const seen=new Set<string>();return rows.filter(row=>{const key=`${row.kind}|${row.href}|${row.label}`;if(seen.has(key))return false;seen.add(key);return true})
}

async function inspectRuntime(input:{itemId?:string|null;collectionId?:string|null;placementId?:string|null;audienceId?:string|null;campaignId?:string|null;locale:'fr'|'en'|'ar'}):Promise<{summary:StudioTrustRuntimeSummary;attribution:ReturnType<typeof studioPageAttribution>|null}>{
  if(!input.itemId)return{summary:{requested:false,status:'NOT_RUN',severity:'info',fallbackReason:null,templateKey:null,templateRevisionId:null,matchedScope:null,bindingCount:0,bindingBlockers:0,dynamicSourceCount:0,dynamicBlockers:0,actionCount:0,workflowCount:0,preflightBlockers:0,note:'Aucun produit/service de test sélectionné. Le document courant reste inspecté statiquement.',provenance:[]},attribution:null}
  try{
    const resolution=await resolveStudioTemplateForCatalogItem({itemId:input.itemId,locale:input.locale,collectionId:input.collectionId||null,placementId:input.placementId||null})
    if(!resolution)return{summary:{requested:true,status:'ERROR',severity:'blocker',fallbackReason:'ITEM_NOT_FOUND',templateKey:null,templateRevisionId:null,matchedScope:null,bindingCount:0,bindingBlockers:0,dynamicSourceCount:0,dynamicBlockers:0,actionCount:0,workflowCount:0,preflightBlockers:0,note:'Produit/service publié introuvable pour le test runtime.',provenance:[]},attribution:null}
    const experience=await getAdaptiveExperience({locale:input.locale,slug:resolution.item.slug})
    if(!experience)return{summary:{requested:true,status:'ERROR',severity:'blocker',fallbackReason:'EXPERIENCE_NOT_FOUND',templateKey:resolution.templateKey,templateRevisionId:resolution.templateRevisionId,matchedScope:resolution.matchedScope,bindingCount:0,bindingBlockers:0,dynamicSourceCount:0,dynamicBlockers:0,actionCount:0,workflowCount:0,preflightBlockers:0,note:'Expérience Category-Native publiée introuvable.',provenance:resolution.provenance},attribution:null}
    const runtime=await prepareStudioPublicRuntime({experience,resolution,collectionId:input.collectionId||null,placementId:input.placementId||null,audienceId:input.audienceId||null,campaignId:input.campaignId||null,visibility:'admin_preview'})
    return{summary:{requested:true,status:runtime.status,severity:studioTrustRuntimeSeverity(runtime.status,runtime.fallbackReason),fallbackReason:runtime.fallbackReason,templateKey:runtime.resolution?.templateKey||null,templateRevisionId:runtime.resolution?.templateRevisionId||null,matchedScope:runtime.resolution?.matchedScope||null,bindingCount:runtime.bindingReport?.bindingCount||0,bindingBlockers:runtime.bindingReport?.blockerCount||0,dynamicSourceCount:runtime.dynamicReport?.sourceCount||0,dynamicBlockers:runtime.dynamicReport?.blockerCount||0,actionCount:runtime.preflight.actionCount,workflowCount:runtime.preflight.workflowCount,preflightBlockers:runtime.preflight.blockerCount,note:runtime.status==='STUDIO_READY'?'Le même orchestrateur P08 que le runtime public accepte cette expérience.':`Fallback Category-Native: ${runtime.fallbackReason||'raison non spécifiée'}.`,provenance:runtime.resolution?.provenance||[]},attribution:runtime.attribution}
  }catch(error){return{summary:{requested:true,status:'ERROR',severity:'blocker',fallbackReason:'RUNTIME_ERROR',templateKey:null,templateRevisionId:null,matchedScope:null,bindingCount:0,bindingBlockers:0,dynamicSourceCount:0,dynamicBlockers:0,actionCount:0,workflowCount:0,preflightBlockers:0,note:error instanceof Error?error.message:'Inspection runtime impossible.',provenance:[]},attribution:null}}
}

export async function inspectStudioTrust(input:{data:Data;locale:'fr'|'en'|'ar';pageId?:string|null;pageRoute?:string|null;itemId?:string|null;collectionId?:string|null;placementId?:string|null;audienceId?:string|null;campaignId?:string|null},context:MarketplaceRequestContext):Promise<StudioTrustReport>{
  const scan=scanDocument(input.data)
  const [sources,actions,workflows,dynamic,preflight,runtimeResult]=await Promise.all([
    inspectSources(scan.sources,context,input.locale),
    inspectActions(scan.actions,input.locale),
    inspectWorkflows(scan.workflows,context,input.locale),
    applyStudioDynamicSources(input.data,{locale:input.locale,territoryId:context.territoryId,audienceId:input.audienceId||null,visibility:'admin_preview'},context),
    preflightStudioRuntime(input.data,input.locale),
    inspectRuntime({itemId:input.itemId,collectionId:input.collectionId,placementId:input.placementId,audienceId:input.audienceId,campaignId:input.campaignId,locale:input.locale}),
  ])
  const bindings=inspectBindings(scan.bindings)
  const dynamicSources=dynamic.report.entries.map(row=>({blockId:row.blockId,sourceId:row.sourceId,strategy:String(row.strategy),status:row.status,severity:severityForStatus(row.status),authority:row.authority,count:row.count,note:row.note}))
  const permissions=permissionsFor(sources,context),destinations=destinationsFor(sources,actions,workflows)
  let blockers=[...sources,...bindings,...dynamicSources,...actions,...workflows].filter(row=>row.severity==='blocker').length
  let warnings=[...sources,...bindings,...dynamicSources,...actions,...workflows].filter(row=>row.severity==='warning').length
  if(preflight.blockerCount>0)blockers+=preflight.blockerCount
  if(runtimeResult.summary.severity==='blocker')blockers++
  else if(runtimeResult.summary.severity==='warning')warnings++
  const pageAttribution=studioPageAttribution({locale:input.locale,pageId:input.pageId||'unsaved',pageRoute:input.pageRoute||'/',territoryId:context.territoryId,audienceId:input.audienceId||null,campaignId:input.campaignId||null})
  const runtimeAttribution=runtimeResult.attribution
  const attribution={dimensionCount:STUDIO_ATTRIBUTION_DEVELOPER_CONTRACT.dimensionCount,dimensions:STUDIO_ATTRIBUTION_DEVELOPER_CONTRACT.dimensions.map(String),surface:runtimeAttribution?.surface||pageAttribution.surface,pageId:runtimeAttribution?.pageId||pageAttribution.pageId,pageRoute:runtimeAttribution?.pageRoute||pageAttribution.pageRoute,templateId:runtimeAttribution?.templateId||null,templateRevisionId:runtimeAttribution?.templateRevisionId||null,itemId:runtimeAttribution?.itemId||input.itemId||null,collectionId:runtimeAttribution?.collectionId||input.collectionId||null,placementId:runtimeAttribution?.placementId||input.placementId||null,campaignId:runtimeAttribution?.campaignId||input.campaignId||null,audienceId:runtimeAttribution?.audienceId||input.audienceId||null,territoryId:runtimeAttribution?.territoryId||context.territoryId||null,privacy:{piiInUrl:false as const,rawVisitorReferencePersisted:false as const,rawReferrerQueryPersisted:false as const,externalUrlDecoration:false as const,serverVisitorHash:true as const}}
  return{schemaVersion:'2026-09-19.P10',generatedAt:new Date().toISOString(),status:studioTrustStatus(blockers,warnings),advisoryOnly:true,summary:{blocks:scan.blocks,sources:sources.length,bindings:bindings.length,dynamicSources:dynamic.report.sourceCount,actions:actions.length,workflows:workflows.length,permissions:permissions.length,adminDestinations:destinations.length,warnings,blockers},document:{pageId:input.pageId||null,pageRoute:input.pageRoute||null,locale:input.locale},sources,bindings,dynamicSources,actions,workflows,permissions,destinations,runtime:runtimeResult.summary,attribution,invariants:{readOnly:true,noMutation:true,noPublishGateChange:true,noShadowBusinessAuthority:true,usesP01:true,usesP03:true,usesP04:true,usesP05:true,usesP06:true,usesP07:true,usesP08:true,usesP09:true,p11GovernanceEngine:true}}
}

export const STUDIO_TRUST_SOURCE_REGISTRY_COUNT=STUDIO_SOURCE_DESCRIPTORS.length
