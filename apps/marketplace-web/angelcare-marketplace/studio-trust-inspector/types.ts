import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import type { StudioTemplateResolutionCandidate } from '@/angelcare-marketplace/studio-template-assignment/types'

export type StudioTrustStatus='READY'|'ATTENTION'|'BLOCKED'
export type StudioTrustSeverity='info'|'warning'|'blocker'

export interface StudioTrustSourceEntry{
  blockId:string
  path:string
  reference:StudioSourceReference
  status:string
  severity:StudioTrustSeverity
  title:string|null
  authority:string|null
  permission:string|null
  publicationAware:boolean
  adminHref:string|null
  note:string
}
export interface StudioTrustBindingEntry{
  blockId:string
  target:string
  bindingKey:string
  status:string
  severity:StudioTrustSeverity
  authority:string|null
  missingPolicy:string|null
  note:string
}
export interface StudioTrustActionEntry{
  blockId:string
  slot:string
  actionId:string
  status:string
  severity:StudioTrustSeverity
  label:string
  canonicalEngine:string|null
  creates:string|null
  adminDestination:string|null
  validations:string[]
  target:StudioSourceReference|null
  note:string
}
export interface StudioTrustWorkflowEntry{
  blockId:string
  workflowId:string
  status:string
  severity:StudioTrustSeverity
  label:string
  execution:string|null
  canonicalEngine:string|null
  creates:string|null
  adminDestination:string|null
  consentKeys:string[]
  target:StudioSourceReference|null
  note:string
}
export interface StudioTrustPermissionEntry{permission:string;granted:boolean;usedBy:string[]}
export interface StudioTrustDestinationEntry{kind:'source'|'action'|'workflow';label:string;href:string}
export interface StudioTrustRuntimeSummary{
  requested:boolean
  status:'NOT_RUN'|'STUDIO_READY'|'FALLBACK_NATIVE'|'ERROR'
  severity:StudioTrustSeverity
  fallbackReason:string|null
  templateKey:string|null
  templateRevisionId:string|null
  matchedScope:string|null
  bindingCount:number
  bindingBlockers:number
  dynamicSourceCount:number
  dynamicBlockers:number
  actionCount:number
  workflowCount:number
  preflightBlockers:number
  note:string
  provenance:StudioTemplateResolutionCandidate[]
}
export interface StudioTrustAttributionSummary{
  dimensionCount:number
  dimensions:string[]
  surface:'studio_page'|'assigned_template'
  pageId:string|null
  pageRoute:string|null
  templateId:string|null
  templateRevisionId:string|null
  itemId:string|null
  collectionId:string|null
  placementId:string|null
  campaignId:string|null
  audienceId:string|null
  territoryId:string|null
  privacy:{piiInUrl:false;rawVisitorReferencePersisted:false;rawReferrerQueryPersisted:false;externalUrlDecoration:false;serverVisitorHash:true}
}
export interface StudioTrustReport{
  schemaVersion:'2026-09-19.P10'
  generatedAt:string
  status:StudioTrustStatus
  advisoryOnly:true
  summary:{blocks:number;sources:number;bindings:number;dynamicSources:number;actions:number;workflows:number;permissions:number;adminDestinations:number;warnings:number;blockers:number}
  document:{pageId:string|null;pageRoute:string|null;locale:'fr'|'en'|'ar'}
  sources:StudioTrustSourceEntry[]
  bindings:StudioTrustBindingEntry[]
  dynamicSources:{blockId:string;sourceId:string;strategy:string;status:string;severity:StudioTrustSeverity;authority:string|null;count:number;note:string}[]
  actions:StudioTrustActionEntry[]
  workflows:StudioTrustWorkflowEntry[]
  permissions:StudioTrustPermissionEntry[]
  destinations:StudioTrustDestinationEntry[]
  runtime:StudioTrustRuntimeSummary
  attribution:StudioTrustAttributionSummary
  invariants:{readOnly:true;noMutation:true;noPublishGateChange:true;noShadowBusinessAuthority:true;usesP01:true;usesP03:true;usesP04:true;usesP05:true;usesP06:true;usesP07:true;usesP08:true;usesP09:true;p11GovernanceEngine:true}
}
