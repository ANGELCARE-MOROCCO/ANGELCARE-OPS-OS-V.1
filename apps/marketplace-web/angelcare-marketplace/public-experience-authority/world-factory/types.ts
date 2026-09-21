import type {Data} from '@puckeditor/core'
import type {PublicExperienceMasterDomain,PublicExperienceReadinessLevel,PublicExperienceThemeKind} from '../types'

export const PUBLIC_EXPERIENCE_WORLD_FACTORY_ENGINE_VERSION=2 as const
export const PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION=2 as const
export const PUBLIC_EXPERIENCE_WORLD_FACTORY_PACKAGE_VERSION=1 as const
export const PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE='pea-world-factory-2026.09-sovereign-v2' as const
export const PUBLIC_EXPERIENCE_WORLD_FACTORY_RUNTIME='pea-v1' as const

export type WorldFactoryGateState='PASS'|'WATCH'|'BLOCKED'
export type WorldFactorySourceKind='url'|'html'|'file'|'existing'|'package'
export type WorldFactoryLifecycleState='ANALYZED'|'REVIEW_REQUIRED'|'CERTIFIED'|'REGISTERED'|'SUPERSEDED'|'REJECTED'
export type WorldFactoryVisualReferenceKind='desktop'|'mobile'
export type WorldFactoryTargetMode='explicit'|'current_item'|'none'
export type WorldFactorySemanticRole=
 |'hero'|'identity'|'media'|'pricing'|'availability'|'variants'|'specifications'|'reviews'|'trust'|'faq'
 |'primary_conversion'|'secondary_conversion'|'bundle'|'accessories'|'recommendations'|'related'
 |'service_plans'|'service_schedule'|'service_coverage'|'service_providers'
 |'academy_curriculum'|'academy_cohort'|'academy_trainers'|'academy_certification'|'academy_admission'
 |'b2b_fit'|'b2b_programme'|'b2b_deployment'|'b2b_proof'
 |'storefront_hero'|'storefront_categories'|'storefront_inventory'|'storefront_collection'|'storefront_facets'|'storefront_campaigns'
 |'editorial'|'navigation'|'footer'|'unknown'

export interface WorldFactorySourceEvidence{
 kind:WorldFactorySourceKind
 label:string
 sourceFingerprint:string
 compilerFingerprint:string
 importedAt:string
 safeToApply:boolean
 upstreamBlockingCodes:string[]
 upstreamReviewCodes:string[]
}
export interface WorldFactoryVisualComparison{
 status:'PENDING'|'APPROVED'|'REJECTED'
 score:number|null
 structuralScore:number|null
 responsiveScore:number|null
 note:string|null
 reviewedAt:string|null
}
export interface WorldFactoryVisualReference{
 kind:WorldFactoryVisualReferenceKind
 filename:string
 sha256:string
 width:number
 height:number
 reviewed:boolean
 reviewNote:string|null
 comparison?:WorldFactoryVisualComparison
}
export interface WorldFactorySemanticSlot{
 blockId:string
 blockType:string
 path:string
 role:WorldFactorySemanticRole
 supplementalRoles:WorldFactorySemanticRole[]
 confidence:number
 evidence:string[]
 required:boolean
}
export interface WorldFactoryBindingPlan{
 blockId:string
 role:WorldFactorySemanticRole
 bindingKey:string
 targetKey:string
 authority:string
 confidence:number
 required:boolean
 status:'RESOLVED'|'REVIEW'|'UNRESOLVED'
 reason:string
 manualOverride:boolean
 missingPolicy:'preserve_static'|'empty'|'omit'|'hide_block'
}
export interface WorldFactoryActionPlan{
 blockId:string
 role:WorldFactorySemanticRole
 intent:'primary'|'secondary'|'item'
 actionId:string|null
 workflowId:string|null
 confidence:number
 required:boolean
 status:'RESOLVED'|'REVIEW'|'UNRESOLVED'
 canonicalEngine:string|null
 targetMode:WorldFactoryTargetMode
 targetSourceId:string|null
 reason:string
 manualOverride:boolean
}
export interface WorldFactoryRelationPlan{
 blockId:string
 role:'bundle'|'accessories'|'recommendations'|'related'
 strategy:'bundle_members'|'compatible_accessories'|'frequently_bought_together'|'similar_items'
 sourceId:'catalog.items'
 anchorMode:'current_item'
 limit:number
 emptyPolicy:'preserve_static'|'empty'|'hide_block'
 status:'RESOLVED'|'REVIEW'
}
export interface WorldFactoryTruthRequirement{
 key:'pricing'|'promotion'|'scarcity'|'rating'|'certification'|'availability'|'trust'
 blockId:string
 required:boolean
 status:'GOVERNED'|'NOT_SHOWN'|'REVIEW'
 authority:string|null
 evidence:string
}
export interface WorldFactoryResponsiveEvidence{
 nativeDesktop:boolean
 nativeMobile:boolean
 responsiveHints:number
 breakpointHints:number
 horizontalOverflowRisk:boolean
 fixedWidthEvidence:string[]
 notes:string[]
}
export interface WorldFactoryCapabilityDecision{
 capability:string
 requested:boolean
 status:'SUPPORTED'|'ADAPTED'|'BLOCKED'|'NOT_REQUESTED'
 authority:string|null
 detail:string
}
export interface WorldFactoryCoverage{semantic:number;binding:number;action:number;truth:number;responsive:number;visual:number;overall:number}
export interface WorldFactoryGate{id:string;label:string;state:WorldFactoryGateState;critical:boolean;detail:string}
export interface WorldFactoryCertification{
 level:PublicExperienceReadinessLevel
 lifecycle:WorldFactoryLifecycleState
 productionEligible:boolean
 coverage:WorldFactoryCoverage
 gates:WorldFactoryGate[]
 blockers:string[]
 warnings:string[]
 certifiedAt:string|null
}
export interface WorldFactoryOverrideSet{
 roleOverrides:Record<string,WorldFactorySemanticRole>
 supplementalRoleOverrides:Record<string,WorldFactorySemanticRole[]>
 bindingOverrides:Array<{blockId:string;targetKey:string;bindingKey:string}>
 actionOverrides:Array<{blockId:string;intent:'primary'|'secondary'|'item';actionId:string;targetMode?:WorldFactoryTargetMode}>
 note:string|null
}
export interface WorldFactoryCompatibility{
 minimumRuntime:'pea-v1'
 maximumRuntime:null
 forwardPolicy:'capability-negotiation'
 unknownFields:'preserve'
 nativeFallback:true
 schemaVersion:number
 compilerProfile:string
}
export interface WorldFactoryRevisionIdentity{
 worldKey:string|null
 revision:number
 supersedes:string|null
 immutableAfterCertification:true
}
export interface PublicExperienceWorldFactoryRecord{
 engineVersion:typeof PUBLIC_EXPERIENCE_WORLD_FACTORY_ENGINE_VERSION
 schemaVersion:typeof PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION
 compilerProfile:typeof PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE
 candidateFingerprint:string
 documentFingerprint:string
 compiledFingerprint:string
 themeKind:PublicExperienceThemeKind
 masterDomain:PublicExperienceMasterDomain|null
 doctrineKeys:string[]
 storefrontKeys:string[]
 strictVisualFidelity:boolean
 source:WorldFactorySourceEvidence
 visualReferences:WorldFactoryVisualReference[]
 semanticSlots:WorldFactorySemanticSlot[]
 bindingPlan:WorldFactoryBindingPlan[]
 actionPlan:WorldFactoryActionPlan[]
 relationPlan:WorldFactoryRelationPlan[]
 truthRequirements:WorldFactoryTruthRequirement[]
 responsive:WorldFactoryResponsiveEvidence
 capabilities:WorldFactoryCapabilityDecision[]
 certification:WorldFactoryCertification
 compatibility:WorldFactoryCompatibility
 revision:WorldFactoryRevisionIdentity
 overrides:WorldFactoryOverrideSet
 provenance:{createdBy:'WORLD_FACTORY';manualOverrides:number;notes:string[]}
}
export interface BuildWorldFactoryInput{
 themeKind:PublicExperienceThemeKind
 masterDomain:PublicExperienceMasterDomain|null
 doctrineKeys:string[]
 storefrontKeys:string[]
 source:Omit<WorldFactorySourceEvidence,'compilerFingerprint'|'importedAt'>
 visualReferences?:WorldFactoryVisualReference[]
 strictVisualFidelity?:boolean
 overrides?:Partial<WorldFactoryOverrideSet>
 worldKey?:string|null
 revision?:number
 supersedes?:string|null
}
export interface WorldFactoryCompileOutput{
 record:PublicExperienceWorldFactoryRecord
 data:Data
}
export interface WorldFactoryPackage{
 format:'angelcare-world-package-v1'
 packageVersion:typeof PUBLIC_EXPERIENCE_WORLD_FACTORY_PACKAGE_VERSION
 exportedAt:string
 world:{name:string;description:string|null;themeVersion:string;manifest:Record<string,unknown>;factory:PublicExperienceWorldFactoryRecord}
 data:Data
 fingerprints:{document:string;factory:string;package:string}
}
