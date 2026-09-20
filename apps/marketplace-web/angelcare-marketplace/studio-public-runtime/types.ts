import type { Data } from '@puckeditor/core'
import type { StudioBindingReport,StudioBoundTemplateResult } from '@/angelcare-marketplace/studio-live-binding/types'
import type { StudioDynamicSourceReport } from '@/angelcare-marketplace/studio-dynamic-source/types'
import type { StudioResolvedTemplate } from '@/angelcare-marketplace/studio-template-assignment/types'
import type { StudioAttributionContext } from '@/angelcare-marketplace/studio-attribution/types'

export type StudioPublicRuntimeStatus='STUDIO_READY'|'FALLBACK_NATIVE'
export type StudioPublicRuntimeFallbackReason='NO_RESOLVED_TEMPLATE'|'BOUND_TEMPLATE_UNAVAILABLE'|'BINDING_BLOCKER'|'DYNAMIC_SOURCE_BLOCKER'|'ACTION_BLOCKER'|'WORKFLOW_BLOCKER'|'EMPTY_TEMPLATE'|'RUNTIME_ERROR'|'POLICY_BLOCKER'
export interface StudioRuntimePreflightEntry{kind:'action'|'workflow';blockId:string;identifier:string;status:string;note:string}
export interface StudioRuntimePreflightReport{actionCount:number;workflowCount:number;blockerCount:number;entries:StudioRuntimePreflightEntry[]}
export interface StudioPublicRuntimeResult{
  status:StudioPublicRuntimeStatus
  fallbackReason:StudioPublicRuntimeFallbackReason|null
  data:Data|null
  resolution:StudioResolvedTemplate|null
  bound:StudioBoundTemplateResult|null
  bindingReport:StudioBindingReport|null
  dynamicReport:StudioDynamicSourceReport|null
  preflight:StudioRuntimePreflightReport
  context:{locale:'fr'|'en'|'ar';territoryId:string|null;audienceId:string|null;collectionId:string|null;placementId:string|null;campaignId:string|null}
  attribution:StudioAttributionContext
}
