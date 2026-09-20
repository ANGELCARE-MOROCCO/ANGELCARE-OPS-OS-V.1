import type { Data } from '@puckeditor/core'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import type { StudioTemplateAssignmentScope, StudioTemplateAssignmentWriteInput } from '@/angelcare-marketplace/studio-template-assignment/types'

export const STUDIO_POLICY_SCHEMA_VERSION='2026-09-20.P11' as const
export const STUDIO_POLICY_MODES=['draft','preview','publish','template_assignment','public_runtime'] as const
export const STUDIO_POLICY_RULE_IDS=[
  'RBAC_PERMISSION','MUTATION_AUTHORITY','DOCUMENT_INTEGRITY','SOURCE_REFERENCE_VALIDITY','PAGE_LIFECYCLE','TEMPLATE_INTEGRITY',
  'BINDING_INTEGRITY','DYNAMIC_SOURCE_INTEGRITY','ACTION_INTEGRITY','WORKFLOW_INTEGRITY','ROUTE_SAFETY','TERRITORY_SCOPE',
] as const
export type StudioPolicyMode=typeof STUDIO_POLICY_MODES[number]
export type StudioPolicyRuleId=typeof STUDIO_POLICY_RULE_IDS[number]
export type StudioPolicyDecision='ALLOW'|'BLOCK'|'FALLBACK'
export type StudioPolicyFindingState='PASS'|'WARN'|'BLOCK'
export interface StudioPolicyFinding{ruleId:StudioPolicyRuleId;state:StudioPolicyFindingState;message:string;remediation:string;source:string}
export interface StudioPolicyPageContext{pageId:string;status:string;territoryId:string|null;locale:'fr'|'en'|'ar';slug:string;title:string}
export interface StudioPolicyReport{
  schemaVersion:typeof STUDIO_POLICY_SCHEMA_VERSION
  mode:StudioPolicyMode
  decision:StudioPolicyDecision
  generatedAt:string
  requestId:string|null
  page:StudioPolicyPageContext|null
  findings:StudioPolicyFinding[]
  blockers:StudioPolicyFinding[]
  warnings:StudioPolicyFinding[]
  fallbackEligible:boolean
  fallbackReason:'POLICY_BLOCKER'|null
  summary:{rules:number;passed:number;warnings:number;blockers:number}
  invariants:{existingRbacAuthority:true;existingPublicationAuthority:true;existingAuditLedger:true;noShadowPolicyStore:true;noNewAdminWorkspace:true;draftAllowsIncompleteWork:true;publishFailsClosed:true;publicRuntimeFallsBack:true}
}
export interface StudioDocumentPolicyInput{mode:Extract<StudioPolicyMode,'draft'|'preview'|'publish'>;data:Data;context:MarketplaceRequestContext;page:StudioPolicyPageContext;requestId?:string|null;pageRoute?:string|null}
export interface StudioAssignmentPolicyInput{mode:'template_assignment';input:StudioTemplateAssignmentWriteInput;context:MarketplaceRequestContext;requestId?:string|null}
export interface StudioRuntimePolicyInput{mode:'public_runtime';data:Data;templateRevisionId:string|null;matchedScope:StudioTemplateAssignmentScope|null;bindingBlockers:number;dynamicBlockers:number;preflightBlockers:number;territoryId:string|null;attributionSafe:boolean}
