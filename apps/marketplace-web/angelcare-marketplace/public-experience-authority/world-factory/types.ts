import type {Data} from '@puckeditor/core'
import type {PublicExperienceMasterDomain,PublicExperienceReadinessLevel,PublicExperienceThemeKind} from '../types'

export const PUBLIC_EXPERIENCE_WORLD_FACTORY_ENGINE_VERSION=3 as const
export const PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION=3 as const
export const PUBLIC_EXPERIENCE_WORLD_FACTORY_PACKAGE_VERSION=1 as const
export const PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE='pea-world-factory-2030-operability-v3' as const
export const PUBLIC_EXPERIENCE_WORLD_FACTORY_RUNTIME='pea-v1' as const

export type WorldFactoryGateState='PASS'|'WATCH'|'BLOCKED'
export type WorldFactorySourceKind='url'|'html'|'file'|'existing'|'package'
export type WorldFactoryLifecycleState='ANALYZED'|'REVIEW_REQUIRED'|'CERTIFIED'|'REGISTERED'|'SUPERSEDED'|'REJECTED'
export type WorldFactoryVisualReferenceKind='desktop'|'mobile'
export type WorldFactoryTargetMode='explicit'|'current_item'|'none'

export type WorldFactoryDensityMode='premium'|'commerce'|'hyper_commerce'|'festival'
export type WorldFactoryEmptyPolicy='preserve_static'|'empty'|'omit'|'hide_block'|'block_publish'
export type WorldFactoryConditionOperator='exists'|'not_empty'|'equals'|'not_equals'|'includes'|'gt'|'gte'|'lt'|'lte'
export type WorldFactoryConditionSource='prop'|'context'|'binding'
export type WorldFactoryConditionEffect='show'|'hide'|'block_publish'
export interface WorldFactoryConditionRule{
 id:string
 blockId:string
 source:WorldFactoryConditionSource
 key:string
 operator:WorldFactoryConditionOperator
 value?:unknown
 effect:WorldFactoryConditionEffect
 reason:string
}
export interface WorldFactoryRepeaterContract{
 blockId:string
 targetKey:string
 source:'binding'|'dynamic_source'|'static'
 bindingKey?:string|null
 sourceId?:string|null
 strategy?:string|null
 query?:string|null
 filters?:Record<string,string|number|boolean|null>
 context?:{territoryMode?:'inherit'|'global'|'specific';audienceMode?:'inherit'|'none'|'specific'}
 merchandising?:{mode?:'automatic'|'curated'|'manual';pinnedEntityIds?:string[];excludedEntityIds?:string[];orderedEntityIds?:string[];manualEntityIds?:string[]}
 limit:number
 sort:string
 emptyPolicy:WorldFactoryEmptyPolicy
 itemVariant:string|null
}
export interface WorldFactoryResponsiveMediaVariant{assetKey?:string|null;bindingKey?:string|null;url?:string|null}
export interface WorldFactoryMediaContract{
 blockId:string
 targetKey:string
 kind:'primary'|'gallery'|'item'
 source:'binding'|'media_vault'|'package_asset'|'static'
 bindingKey:string|null
 assetRole:string|null
 required:boolean
 presentation:{fit:'cover'|'contain'|'fill'|'none'|'scale-down';position:string;aspectRatio:string|null;overlay:string|null;focalPoint:{x:number;y:number}|null}
 responsive:{desktop:WorldFactoryResponsiveMediaVariant|null;tablet:WorldFactoryResponsiveMediaVariant|null;mobile:WorldFactoryResponsiveMediaVariant|null}
}
export interface WorldFactoryInteractionContract{
 blockId:string
 kind:'accordion'|'tabs'|'dialog'|'carousel'|'menu'|'sticky_conversion'|'gallery_zoom'|'variant_selector'|'quantity_selector'|'schedule_selector'|'progressive_disclosure'
 status:'SUPPORTED'|'REVIEW'
 configuration:Record<string,unknown>
}
export interface WorldFactoryAssetManifestEntry{
 key:string
 path:string
 kind:'image'|'video'|'icon'|'document'|'reference'|'other'
 sha256:string|null
 required:boolean
 mimeType:string|null
 license:string|null
 provenance:string|null
}
export interface WorldFactoryTokenContract{
 colors:Record<string,string>
 typography:Record<string,string|number>
 spacing:Record<string,string|number>
 radii:Record<string,string|number>
 shadows:Record<string,string>
 layout:Record<string,string|number>
 motion:Record<string,string|number|boolean>
}
export interface WorldFactoryBlockCapability{
 blockId:string
 blockType:string
 role:WorldFactorySemanticRole
 acceptsBindings:boolean
 acceptsDynamicSource:boolean
 acceptsMedia:boolean
 acceptsActions:boolean
 acceptsChildren:boolean
 acceptsRepeaters:boolean
 acceptsConditions:boolean
 acceptsDesign:boolean
 acceptsResponsive:boolean
 editableFields:string[]
 inspectorSections:Array<'content'|'data'|'media'|'actions'|'display'|'design'|'responsive'|'conditions'|'seo'|'accessibility'>
}
export interface WorldFactoryLocalizationContract{
 defaultLocale:'fr'|'en'|'ar'
 locales:Array<'fr'|'en'|'ar'>
 rtlLocales:Array<'ar'>
 themeStrings:'localized-map'
 fallback:'default-locale'
 missingTranslation:'warn'|'block_publish'
}
export interface WorldFactoryPerformanceBudget{
 maxRootBlocks:number
 maxTotalBlocks:number
 maxDynamicSources:number
 maxAboveFoldMedia:number
 maxMediaAssets:number
 maxDocumentBytes:number
 maxInteractions:number
}
export interface WorldFactoryShellContract{
 mode:'marketplace_global'|'page_local'|'promoted'
 allowGlobalHeaderOverride:boolean
 allowGlobalFooterOverride:boolean
 allowGlobalNavigationOverride:boolean
}
export interface WorldFactoryEditingContract{
 uiLed:true
 rawJsonRequired:false
 allowBlockMove:boolean
 allowBlockDuplicate:boolean
 allowBlockHide:boolean
 allowBindingChange:boolean
 allowActionChange:boolean
 allowMediaReplace:boolean
 allowDesignChange:boolean
 allowResponsiveChange:boolean
 allowConditionChange:boolean
 immutableBusinessTruth:true
}
export interface WorldFactoryOperabilityContract{
 version:1
 density:WorldFactoryDensityMode|null
 blockCapabilities:WorldFactoryBlockCapability[]
 conditions:WorldFactoryConditionRule[]
 repeaters:WorldFactoryRepeaterContract[]
 media:WorldFactoryMediaContract[]
 interactions:WorldFactoryInteractionContract[]
 localization:WorldFactoryLocalizationContract
 tokens:WorldFactoryTokenContract
 assets:WorldFactoryAssetManifestEntry[]
 performance:WorldFactoryPerformanceBudget
 shell:WorldFactoryShellContract
 editing:WorldFactoryEditingContract
 inspector:{generatedFromCapabilities:true;hideUnsupportedFields:true;showAuthorityOwnership:true;showInheritance:true}
}
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
 operability:WorldFactoryOperabilityContract
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
 operability?:Partial<WorldFactoryOperabilityContract>
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
 assets?:WorldFactoryAssetManifestEntry[]
 fingerprints:{document:string;factory:string;package:string}
}
