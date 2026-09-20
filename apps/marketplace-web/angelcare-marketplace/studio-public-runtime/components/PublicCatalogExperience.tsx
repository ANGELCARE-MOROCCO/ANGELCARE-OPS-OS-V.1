import type { AdaptiveExperienceData } from '@/angelcare-marketplace/category-native-experience/types'
import type { StudioResolvedTemplate } from '@/angelcare-marketplace/studio-template-assignment/types'
import { CategoryNativeExperience } from '@/angelcare-marketplace/category-native-experience/components/AdaptiveExperience'
import { StudioPublishedDataRenderer } from '@/angelcare-marketplace/studio-universal/StudioPublishedRenderer'
import { prepareStudioPublicRuntime } from '../orchestrator'

export async function PublicCatalogExperience({data,templateResolution,collectionId=null,placementId=null,audienceId=null,campaignId=null}:{data:AdaptiveExperienceData;templateResolution:StudioResolvedTemplate|null;collectionId?:string|null;placementId?:string|null;audienceId?:string|null;campaignId?:string|null}){
  const runtime=await prepareStudioPublicRuntime({experience:data,resolution:templateResolution,collectionId,placementId,audienceId,campaignId,visibility:'public_runtime'})
  if(runtime.status==='STUDIO_READY'&&runtime.data)return <div data-ac-public-experience="studio" data-ac-template-scope={runtime.resolution?.matchedScope||undefined} data-ac-template-key={runtime.resolution?.templateKey||undefined} data-ac-binding-count={runtime.bindingReport?.bindingCount||0} data-ac-dynamic-source-count={runtime.dynamicReport?.sourceCount||0} data-ac-action-count={runtime.preflight.actionCount} data-ac-workflow-count={runtime.preflight.workflowCount}><StudioPublishedDataRenderer data={runtime.data} locale={data.locale} territoryId={runtime.context.territoryId} audienceId={runtime.context.audienceId} attribution={runtime.attribution} dynamicAlreadyApplied dynamicReport={runtime.dynamicReport}/></div>
  return <div data-ac-public-experience="category-native" data-ac-studio-fallback={runtime.fallbackReason||'NO_RESOLVED_TEMPLATE'}><CategoryNativeExperience data={data} templateResolution={templateResolution}/></div>
}
