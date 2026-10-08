import 'server-only'
import type { AdaptiveExperienceData } from '@/angelcare-marketplace/category-native-experience/types'
import type { StudioResolvedTemplate } from '@/angelcare-marketplace/studio-template-assignment/types'
import { loadBoundStudioTemplate } from '@/angelcare-marketplace/studio-live-binding/template-loader'
import { applyStudioDynamicSources } from '@/angelcare-marketplace/studio-dynamic-source/engine'
import { preflightStudioRuntime } from './preflight'
import type { StudioPublicRuntimeFallbackReason,StudioPublicRuntimeResult } from './types'
import { assignedTemplateAttribution } from '@/angelcare-marketplace/studio-attribution/context'
import { evaluateStudioRuntimePolicy } from '@/angelcare-marketplace/studio-governance-engine/runtime-policy'

const emptyPreflight=()=>({actionCount:0,workflowCount:0,blockerCount:0,entries:[]})
const fallback=(reason:StudioPublicRuntimeFallbackReason,input:{resolution:StudioResolvedTemplate|null;locale:'fr'|'en'|'ar';territoryId?:string|null;audienceId?:string|null;collectionId?:string|null;placementId?:string|null;campaignId?:string|null;itemId:string;itemSlug:string},extra:Partial<StudioPublicRuntimeResult>={}):StudioPublicRuntimeResult=>{const attribution=assignedTemplateAttribution({locale:input.locale,territoryId:input.territoryId,audienceId:input.audienceId,collectionId:input.collectionId,placementId:input.placementId,campaignId:input.campaignId,itemId:input.itemId,itemSlug:input.itemSlug,templateId:input.resolution?.templateId,templateKey:input.resolution?.templateKey,templateRevisionId:input.resolution?.templateRevisionId,templateScope:input.resolution?.matchedScope});return{status:'FALLBACK_NATIVE',fallbackReason:reason,data:null,resolution:input.resolution,bound:null,bindingReport:null,dynamicReport:null,preflight:emptyPreflight(),context:{locale:input.locale,territoryId:input.territoryId||null,audienceId:input.audienceId||null,collectionId:input.collectionId||null,placementId:input.placementId||null,campaignId:input.campaignId||null},attribution,...extra}}

export async function prepareStudioPublicRuntime(input:{experience:AdaptiveExperienceData;resolution:StudioResolvedTemplate|null;collectionId?:string|null;placementId?:string|null;audienceId?:string|null;campaignId?:string|null;visibility?:'admin_preview'|'public_runtime'}):Promise<StudioPublicRuntimeResult>{
  const locale=input.experience.locale,territoryId=input.experience.item.territory_id||null,base={resolution:input.resolution,locale,territoryId,audienceId:input.audienceId||null,collectionId:input.collectionId||null,placementId:input.placementId||null,campaignId:input.campaignId||null,itemId:input.experience.item.id,itemSlug:input.experience.item.slug}
  if(!input.resolution||input.resolution.status!=='RESOLVED')return fallback('NO_RESOLVED_TEMPLATE',base)
  try{
    const bound=await loadBoundStudioTemplate({resolution:input.resolution,experience:input.experience,visibility:input.visibility||'public_runtime'})
    if(bound.status!=='BOUND'||!bound.data)return fallback('BOUND_TEMPLATE_UNAVAILABLE',base,{bound,bindingReport:bound.report})
    if(bound.report.blockerCount>0)return fallback('BINDING_BLOCKER',base,{bound,bindingReport:bound.report})
    if(!Array.isArray(bound.data.content)||bound.data.content.length===0)return fallback('EMPTY_TEMPLATE',base,{bound,bindingReport:bound.report})
    const dynamic=await applyStudioDynamicSources(bound.data,{locale,territoryId,audienceId:input.audienceId||null,itemId:input.experience.item.id,itemSlug:input.experience.item.slug,visibility:input.visibility||'public_runtime'})
    if(dynamic.report.blockerCount>0)return fallback('DYNAMIC_SOURCE_BLOCKER',base,{bound,bindingReport:bound.report,dynamicReport:dynamic.report})
    const preflight=await preflightStudioRuntime(dynamic.data,locale,{itemId:input.experience.item.id,itemSlug:input.experience.item.slug})
    if(preflight.blockerCount>0){const workflowBlock=preflight.entries.some(row=>row.kind==='workflow'&&!['READY'].includes(row.status));return fallback(workflowBlock?'WORKFLOW_BLOCKER':'ACTION_BLOCKER',base,{bound,bindingReport:bound.report,dynamicReport:dynamic.report,preflight})}
    const attribution=assignedTemplateAttribution({locale,territoryId,audienceId:input.audienceId||null,collectionId:input.collectionId||null,placementId:input.placementId||null,campaignId:input.campaignId||null,itemId:input.experience.item.id,itemSlug:input.experience.item.slug,templateId:input.resolution.templateId,templateKey:input.resolution.templateKey,templateRevisionId:input.resolution.templateRevisionId,templateScope:input.resolution.matchedScope})
    const policy=evaluateStudioRuntimePolicy({mode:'public_runtime',data:dynamic.data,templateRevisionId:input.resolution.templateRevisionId,matchedScope:input.resolution.matchedScope,bindingBlockers:bound.report.blockerCount,dynamicBlockers:dynamic.report.blockerCount,preflightBlockers:preflight.blockerCount,territoryId,attributionSafe:true})
    if(policy.decision!=='ALLOW')return fallback('POLICY_BLOCKER',base,{bound,bindingReport:bound.report,dynamicReport:dynamic.report,preflight})
    return{status:'STUDIO_READY',fallbackReason:null,data:dynamic.data,resolution:input.resolution,bound,bindingReport:bound.report,dynamicReport:dynamic.report,preflight,context:{locale,territoryId,audienceId:input.audienceId||null,collectionId:input.collectionId||null,placementId:input.placementId||null,campaignId:input.campaignId||null},attribution}
  }catch{return fallback('RUNTIME_ERROR',base)}
}
