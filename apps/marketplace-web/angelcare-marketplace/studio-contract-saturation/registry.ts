import { ANGELCARE_STUDIO_BLOCK_CONTRACTS } from '@/angelcare-marketplace/studio-universal/block-contracts'
import { ANGELCARE_STUDIO_MANIFEST } from '@/angelcare-marketplace/studio-universal/manifest'
import { ANGELCARE_STUDIO_VISUAL_CATEGORIES,ANGELCARE_STUDIO_VISUAL_EXPERIENCES } from '@/angelcare-marketplace/studio-universal/visual-catalogue'
import { buildStudioSourceRegistryDeveloperContract } from '@/angelcare-marketplace/studio-source-registry/developer-contract'
import { studioPickerDeveloperContractJson } from '@/angelcare-marketplace/studio-picker/developer-contract'
import { studioActionDeveloperContractJson } from '@/angelcare-marketplace/studio-action-registry/developer-contract'
import { studioTemplateAssignmentDeveloperContractJson } from '@/angelcare-marketplace/studio-template-assignment/developer-contract'
import { studioLiveBindingDeveloperContractJson } from '@/angelcare-marketplace/studio-live-binding/developer-contract'
import { studioDynamicSourceDeveloperContractJson } from '@/angelcare-marketplace/studio-dynamic-source/developer-contract'
import { studioWorkflowDeveloperContractJson } from '@/angelcare-marketplace/studio-workflows/developer-contract'
import { studioPublicRuntimeDeveloperContractJson } from '@/angelcare-marketplace/studio-public-runtime/developer-contract'
import { studioAttributionDeveloperContract } from '@/angelcare-marketplace/studio-attribution/developer-contract'
import { studioTrustInspectorDeveloperContractJson } from '@/angelcare-marketplace/studio-trust-inspector/developer-contract'
import { studioGovernanceDeveloperContractJson } from '@/angelcare-marketplace/studio-governance-engine/developer-contract'
import { studioDependencyInvalidationDeveloperContractJson } from '@/angelcare-marketplace/studio-dependency-invalidation/developer-contract'
import type { StudioContractCrossLink,StudioContractScope } from './types'
import { createHash } from 'node:crypto'

const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
const source=buildStudioSourceRegistryDeveloperContract()
const picker=studioPickerDeveloperContractJson()
const actions=studioActionDeveloperContractJson()
const templates=studioTemplateAssignmentDeveloperContractJson()
const bindings=studioLiveBindingDeveloperContractJson()
const dynamic=studioDynamicSourceDeveloperContractJson()
const workflows=studioWorkflowDeveloperContractJson()
const runtime=studioPublicRuntimeDeveloperContractJson()
const attribution=studioAttributionDeveloperContract()
const trust=studioTrustInspectorDeveloperContractJson()
const governance=studioGovernanceDeveloperContractJson()
const dependency=studioDependencyInvalidationDeveloperContractJson()
const p00={schemaVersion:'2026-09-19.P00',capabilities:46,sourceCandidates:20,actionCandidates:14,apiRoutes:569,permissions:536}
const foundation={schemaVersion:'2026-09-20.P13.foundation',workspace:ANGELCARE_STUDIO_MANIFEST.workspaceName,engine:ANGELCARE_STUDIO_MANIFEST.engine,blocks:ANGELCARE_STUDIO_BLOCK_CONTRACTS.length,visualCategories:ANGELCARE_STUDIO_VISUAL_CATEGORIES.length,visualExperiences:ANGELCARE_STUDIO_VISUAL_EXPERIENCES.length}

export const STUDIO_CONTRACT_SCOPES:readonly StudioContractScope[]=[
 {scope:'capability-census',phase:'P00',label:'Marketplace Capability Census',schemaVersion:p00.schemaVersion,hash:digest(p00),authority:'P00 certified Marketplace census',exportScope:'p00-docs',stableIds:p00.capabilities+p00.sourceCandidates+p00.actionCandidates,dependsOn:[]},
 {scope:'studio-foundation',phase:'FOUNDATION',label:'Studio Foundation',schemaVersion:foundation.schemaVersion,hash:digest(foundation),authority:'AngelCare Studio / Experience Core',exportScope:'studio',stableIds:ANGELCARE_STUDIO_BLOCK_CONTRACTS.length+ANGELCARE_STUDIO_VISUAL_EXPERIENCES.length,dependsOn:[]},
 {scope:'source-registry',phase:'P01',label:'Universal Source Registry',schemaVersion:source.schemaVersion,hash:source.hash,authority:'P01 registered Marketplace authorities',exportScope:'source-registry',stableIds:source.counts.sources,dependsOn:['P00']},
 {scope:'picker',phase:'P02',label:'Universal Picker Framework',schemaVersion:picker.schemaVersion,hash:picker.hash,authority:'P01 Source Registry',exportScope:'picker',stableIds:picker.sources.length,dependsOn:['P01']},
 {scope:'actions',phase:'P03',label:'Universal Action Registry',schemaVersion:actions.schemaVersion,hash:actions.hash,authority:'Existing Marketplace action engines',exportScope:'actions',stableIds:actions.actionCount,dependsOn:['P01','P02']},
 {scope:'template-assignment',phase:'P04',label:'Template Assignment & Inheritance',schemaVersion:templates.schemaVersion,hash:templates.hash,authority:'Existing Marketplace configuration + Experience Core',exportScope:'template-assignment',stableIds:templates.scopeCount,dependsOn:['P01','P02']},
 {scope:'live-bindings',phase:'P05',label:'Live Data Binding',schemaVersion:bindings.schemaVersion,hash:bindings.hash,authority:'Category-Native canonical context',exportScope:'live-bindings',stableIds:bindings.bindingCount+bindings.targetCount,dependsOn:['P04']},
 {scope:'dynamic-sources',phase:'P06',label:'Dynamic Content Sources',schemaVersion:dynamic.schemaVersion,hash:dynamic.hash,authority:'P01 sources + canonical commerce discovery',exportScope:'dynamic-sources',stableIds:dynamic.sourceCount+dynamic.strategies.length,dependsOn:['P01','P02','P03','P05']},
 {scope:'workflows',phase:'P07',label:'Native Forms & Conversion Wiring',schemaVersion:workflows.schemaVersion,hash:workflows.hash,authority:'Existing Inquiry / Conversion / Family / B2B engines',exportScope:'workflows',stableIds:workflows.workflowCount,dependsOn:['P02','P03']},
 {scope:'public-runtime',phase:'P08',label:'Public Runtime Orchestrator',schemaVersion:runtime.schemaVersion,hash:runtime.hash,authority:'P04→P07 governed public pipeline',exportScope:'public-runtime',stableIds:runtime.fallbackReasons.length,dependsOn:['P03','P04','P05','P06','P07','P11']},
 {scope:'attribution',phase:'P09',label:'Origin / Attribution',schemaVersion:attribution.schemaVersion,hash:attribution.hash,authority:'Existing business metadata + audit/event surfaces',exportScope:'attribution',stableIds:attribution.dimensionCount,dependsOn:['P03','P07','P08']},
 {scope:'trust-inspector',phase:'P10',label:'Studio Trust Inspector',schemaVersion:trust.schemaVersion,hash:trust.hash,authority:'Read-only composition of P01→P09',exportScope:'trust-inspector',stableIds:trust.layers.length+trust.sections.length,dependsOn:['P01','P03','P04','P05','P06','P07','P08','P09']},
 {scope:'governance-policy',phase:'P11',label:'Permissions / Governance / Fail-Closed',schemaVersion:governance.schemaVersion,hash:governance.hash,authority:'Existing RBAC + Experience Core + audit ledger',exportScope:'governance-policy',stableIds:governance.ruleCount,dependsOn:['P08','P10']},
 {scope:'dependency-invalidation',phase:'P12',label:'Dependency + Cache + Invalidation',schemaVersion:dependency.schemaVersion,hash:dependency.hash,authority:'Experience Core dependency graph + Next cache tags',exportScope:'dependency-invalidation',stableIds:dependency.taggedReads.length,dependsOn:['P04','P05','P06','P08','P11']},
] as const

export const STUDIO_CONTRACT_CROSS_LINKS:readonly StudioContractCrossLink[]=[
 {from:'P01',to:'P00',relation:'implements certified source candidates from capability census',required:true},
 {from:'P02',to:'P01',relation:'discovers/selects canonical sources',required:true},
 {from:'P03',to:'P01',relation:'action targets are canonical source references',required:true},
 {from:'P03',to:'P02',relation:'admin action targets use Universal Picker',required:true},
 {from:'P04',to:'P02',relation:'template assignment targets use Universal Picker',required:true},
 {from:'P05',to:'P04',relation:'bindings materialize exact published assigned template revision',required:true},
 {from:'P06',to:'P01',relation:'dynamic recipes resolve registered sources',required:true},
 {from:'P06',to:'P03',relation:'dynamic cards reuse structured actions',required:true},
 {from:'P06',to:'P05',relation:'dynamic content materializes runtime clones only',required:true},
 {from:'P07',to:'P03',relation:'workflow semantics reuse structured actions',required:true},
 {from:'P07',to:'P02',relation:'workflow targets use canonical pickers',required:true},
 {from:'P08',to:'P04',relation:'resolves assigned template',required:true},
 {from:'P08',to:'P05',relation:'binds canonical live data',required:true},
 {from:'P08',to:'P06',relation:'materializes dynamic recipes',required:true},
 {from:'P08',to:'P03',relation:'preflights structured actions',required:true},
 {from:'P08',to:'P07',relation:'preflights native workflows',required:true},
 {from:'P09',to:'P08',relation:'propagates public runtime origin',required:true},
 {from:'P10',to:'P08',relation:'simulates exact public orchestrator',required:true},
 {from:'P10',to:'P09',relation:'explains attribution/privacy',required:true},
 {from:'P11',to:'P10',relation:'turns trust signals into enforceable policy',required:true},
 {from:'P11',to:'P08',relation:'blocks or Category-Native fallbacks unsafe runtime',required:true},
 {from:'P12',to:'P04',relation:'invalidates assignment changes',required:true},
 {from:'P12',to:'P06',relation:'invalidates dynamic-source dependencies',required:true},
 {from:'P12',to:'P11',relation:'preserves governed freshness',required:true},
] as const

export const STUDIO_CONTRACT_STABLE_ID_CLASSES=[
 {classId:'source_ids',owner:'P01',policy:'BREAKING_FORBIDDEN',examples:['catalog.items','media.assets']},
 {classId:'picker_modes',owner:'P02',policy:'MIGRATION_REQUIRED',examples:['single','multiple','hierarchical','media']},
 {classId:'action_ids',owner:'P03',policy:'BREAKING_FORBIDDEN',examples:['navigation.open','booking.start']},
 {classId:'template_scopes',owner:'P04',policy:'BREAKING_FORBIDDEN',examples:['exact_item','experience_schema','category']},
 {classId:'binding_keys',owner:'P05',policy:'BREAKING_FORBIDDEN',examples:['item.name','price.current','availability.status']},
 {classId:'dynamic_strategies',owner:'P06',policy:'MIGRATION_REQUIRED',examples:['featured','category_items','collection_items']},
 {classId:'workflow_ids',owner:'P07',policy:'BREAKING_FORBIDDEN',examples:['general_inquiry','service_booking']},
 {classId:'runtime_fallback_reasons',owner:'P08',policy:'PATCH_SAFE',examples:['POLICY_BLOCKER','BINDING_BLOCKER']},
 {classId:'attribution_dimensions',owner:'P09',policy:'MIGRATION_REQUIRED',examples:['pageId','actionId','workflowId']},
 {classId:'trust_states',owner:'P10',policy:'MIGRATION_REQUIRED',examples:['READY','ATTENTION','BLOCKED']},
 {classId:'governance_rule_ids',owner:'P11',policy:'BREAKING_FORBIDDEN',examples:['permission','publication_state','route_safety']},
 {classId:'cache_tag_namespace',owner:'P12',policy:'MIGRATION_REQUIRED',examples:['acm:studio:p12']},
] as const

export const STUDIO_CONTRACT_IMMUTABLE_INVARIANTS=[
 'Existing Marketplace authorities remain business truth',
 'No shadow commerce, booking, inquiry, media, customer, order, workflow, policy or dependency stores',
 'Studio persists references/recipes/configuration, never duplicated live business facts',
 'Unknown source/action/workflow/binding/policy metadata fails closed',
 'Admin normal UX selects canonical objects instead of typing raw IDs',
 'Published Studio runtime uses governed published revisions and Category-Native fallback',
 'Existing RBAC, publication lifecycle and audit ledger remain sovereign',
 'No foreign-code execution / eval / arbitrary SQL or repository access',
 'No browser storage as business authority',
 'No local production build and no repository-wide blind TypeScript gate',
 'Marketplace release authority remains Build Marketplace GHCR One-Off → exact SHA GHCR → Coolify Deploy Without Cache',
] as const
