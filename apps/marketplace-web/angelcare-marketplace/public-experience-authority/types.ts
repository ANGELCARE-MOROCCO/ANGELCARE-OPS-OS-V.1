import type { Data } from '@puckeditor/core'
import type { StorefrontKey } from '@/angelcare-marketplace/catalog-discovery/types'

export const PUBLIC_EXPERIENCE_AUTHORITY_VERSION = 1 as const

export type PublicExperienceMasterDomain =
  | 'b2c_service_family'
  | 'b2c_product_digital'
  | 'academy_admission'
  | 'b2b_institutional'

export type PublicExperienceDetailScope = 'business_family' | 'doctrine' | 'master_domain'
export type PublicExperienceThemeKind = 'detail' | 'storefront'
export type PublicExperienceAssignmentMode = 'immediate' | 'scheduled' | 'canary'
export interface PublicExperienceAssignmentLifecycle {mode:PublicExperienceAssignmentMode;startsAt:string|null;endsAt:string|null;rolloutPercent:number;autoFallback:boolean}

export interface PublicExperienceDoctrineProfile {
  key: string
  label: string
  masterDomain: PublicExperienceMasterDomain
  family: string
  conversionTemplate: string
  operationsHandoverType: string
  availabilityAuthority: string
  requiredActions: readonly string[]
  requiredWorkflows: readonly string[]
}

export interface PublicExperienceMasterDomainProfile {
  key: PublicExperienceMasterDomain
  label: string
  shortLabel: string
  description: string
  doctrineKeys: readonly string[]
  canonicalThemeKey: string
  requiredActions: readonly string[]
  requiredWorkflows: readonly string[]
  accent: 'pink' | 'blue' | 'violet' | 'cyan'
}

export interface PublicExperienceStorefrontProfile {
  key: StorefrontKey
  label: string
  route: string
  description: string
  sourceAuthorities: readonly string[]
  accent: 'pink' | 'blue' | 'violet' | 'cyan' | 'amber' | 'emerald'
}

export interface PublicExperienceThemeSlot {
  blockId: string
  slot:
    | 'hero'
    | 'featured_items'
    | 'inventory_items'
    | 'collection_0'
    | 'collection_1'
    | 'collection_2'
    | 'trust'
    | 'facets'
    | 'final_cta'
  confidence: number
  reason: string
}

export interface PublicExperienceThemeManifest {
  version: typeof PUBLIC_EXPERIENCE_AUTHORITY_VERSION
  themeKind: PublicExperienceThemeKind
  themeName: string
  themeVersion: string
  acceptedMasterDomains: PublicExperienceMasterDomain[]
  acceptedDoctrineKeys: string[]
  acceptedBusinessFamilyKeys: string[]
  acceptedStorefrontKeys: StorefrontKey[]
  requiredBindings: string[]
  optionalBindings: string[]
  requiredActions: string[]
  optionalActions: string[]
  requiredWorkflows: string[]
  requiredCapabilities: string[]
  slots: PublicExperienceThemeSlot[]
  responsiveContract: 'desktop-mobile-native'
  commerceContract: 'canonical-only'
  fallbackContract: 'native-fallback'
  seoContract: 'canonical-route-owned'
  accessibilityContract: 'wcag-operational'
  performanceContract: 'bounded-runtime'
  compatibilityVersion: 1
  structuralFingerprint: string
  visualFingerprint: string
  sourceLabel: string
  importedAt: string
  importedBy: string | null
}

export interface PublicExperienceThemeSummary {
  templateId: string
  templateKey: string
  templateName: string
  templateStatus: string
  publishedRevisionId: string | null
  currentRevisionId: string | null
  updatedAt: string | null
  manifest: PublicExperienceThemeManifest | null
}

export interface PublicExperienceDetailAssignment {
  version: typeof PUBLIC_EXPERIENCE_AUTHORITY_VERSION
  scope: PublicExperienceDetailScope
  key: string
  masterDomain: PublicExperienceMasterDomain | null
  templateId: string
  enabled: boolean
  reason: string
  updatedAt: string
  updatedBy: string | null
  lifecycle?: PublicExperienceAssignmentLifecycle
}

export interface PublicExperienceStorefrontAssignment {
  version: typeof PUBLIC_EXPERIENCE_AUTHORITY_VERSION
  storefrontKey: StorefrontKey
  templateId: string
  enabled: boolean
  reason: string
  updatedAt: string
  updatedBy: string | null
  lifecycle?: PublicExperienceAssignmentLifecycle
  density?: PublicExperienceDensityMode
}

export interface PublicExperienceBusinessFamily {
  key: string
  label: string
  categoryId: string
  categoryKey: string
  publishedItemCount: number
  masterDomains: PublicExperienceMasterDomain[]
  assignment: PublicExperienceDetailAssignment | null
}

export interface PublicExperienceDoctrineStatus extends PublicExperienceDoctrineProfile {
  publishedItemCount: number
  assignment: PublicExperienceDetailAssignment | null
}

export interface PublicExperienceMasterDomainStatus extends PublicExperienceMasterDomainProfile {
  publishedItemCount: number
  assignedDoctrineCount: number
  totalDoctrineCount: number
  assignment: PublicExperienceDetailAssignment | null
}

export interface PublicExperienceStorefrontStatus extends PublicExperienceStorefrontProfile {
  assignment: PublicExperienceStorefrontAssignment | null
  template: PublicExperienceThemeSummary | null
}

export interface PublicExperienceAuthoritySnapshot {
  generatedAt: string
  counts: {
    publishedItems: number
    publishedTemplates: number
    registeredThemes: number
    detailAssignments: number
    storefrontAssignments: number
    doctrines: number
    storefronts: number
    businessFamilies: number
  }
  masterDomains: PublicExperienceMasterDomainStatus[]
  doctrines: PublicExperienceDoctrineStatus[]
  storefronts: PublicExperienceStorefrontStatus[]
  businessFamilies: PublicExperienceBusinessFamily[]
  themes: PublicExperienceThemeSummary[]
  health: {
    ready: boolean
    blockers: string[]
    warnings: string[]
  }
}

export interface PublicExperienceThemeImportInput {
  name: string
  description?: string | null
  publish: boolean
  data?: Data | null
  templateId?: string | null
  manifest: Omit<PublicExperienceThemeManifest, 'version' | 'importedAt' | 'importedBy'>
}

export interface PublicExperienceResolvedContext {
  doctrineKey: string
  masterDomain: PublicExperienceMasterDomain | null
  businessFamilyKey: string | null
  businessFamilyLabel: string | null
}

// POWER MAX SATURATION — additive contracts. Existing v1 persisted records remain valid.
export type PublicExperienceClass='offer_detail'|'storefront'|'transaction'|'content'|'portal'
export type PublicExperienceReadinessLevel='READY'|'WATCH'|'BLOCKED'
export type PublicExperienceTruthState='PROVEN'|'ABSENT'|'BLOCKED'|'NOT_APPLICABLE'
export type PublicExperienceDensityMode='premium'|'commerce'|'hyper_commerce'|'festival'

export interface PublicExperienceClassification {
  experienceClass:PublicExperienceClass
  masterDomain:PublicExperienceMasterDomain|null
  catalogKind:string
  doctrineKey:string
  businessFamilyKey:string|null
  schemaKey:string
  categoryKey:string|null
  entityKey:string
  locale:string
  territoryId:string|null
  audienceId:string|null
}

export interface PublicExperience360Relation {kind:string;entityId:string|null;slug:string|null;label:string;metadata:Record<string,unknown>}
export interface PublicExperience360Action {actionId:string;label:string;workflowId:string|null;available:boolean;reason:string|null;adminDestination:string|null}
export interface PublicExperience360 {
  version:1
  generatedAt:string
  classification:PublicExperienceClassification
  identity:{id:string;publicReference:string;itemKey:string;slug:string;name:string;shortDescription:string|null;description:string|null}
  content:{schemaName:string;schemaDescription:string;fields:Array<{key:string;section:string;label:string;value:unknown;formatted:string}>}
  media:Array<{id:string;key:string;type:string;url:string;alt:string;sortOrder:number}>
  pricing:{mode:string;amount:number|null;currency:string;label:string;source:string}
  availability:{status:string;authority:string;availableQuantity:number|null;startsAt:string|null;endsAt:string|null;reason:string|null}
  variants:{groups:Array<Record<string,unknown>>;items:Array<Record<string,unknown>>;count:number}
  trust:{claims:Array<{key:string;label:string;status:string;evidenceReference:string|null}>;provenCount:number}
  reviews:{rating:number|null;count:number|null;source:string|null}
  relations:PublicExperience360Relation[]
  recommendations:Array<{id:string;slug:string;kind:string;name:string;priceAmount:number|null;currency:string;availability:string;mediaUrl:string|null}>
  actions:PublicExperience360Action[]
  domainExtension:Record<string,unknown>
  sourceAuthorities:string[]
}

export interface PublicExperienceBindingDescriptor {key:string;label:string;domain:PublicExperienceMasterDomain|'shared';valueType:'text'|'number'|'boolean'|'url'|'items'|'object';authority:string;requiredFor:string[];publicSafe:boolean}
export interface PublicExperienceDoctrineRecipe {doctrineKey:string;masterDomain:PublicExperienceMasterDomain;requiredBindings:string[];optionalBindings:string[];requiredActions:string[];requiredWorkflows:string[];modules:string[];conversionSubtype:string;availabilityAuthority:string;truthRequirements:string[]}
export interface PublicExperienceCompileResult {compatible:boolean;score:number;level:PublicExperienceReadinessLevel;blockers:string[];warnings:string[];resolvedBindings:string[];missingBindings:string[];actions:{required:string[];resolved:string[];missing:string[]};workflows:{required:string[];resolved:string[];missing:string[]};doctrines:string[];structuralFingerprint:string;manifestFingerprint:string}
export interface PublicExperienceTruthDecision {key:string;state:PublicExperienceTruthState;label:string;reason:string;authority:string|null}
export interface PublicExperienceTruthReport {level:PublicExperienceReadinessLevel;decisions:PublicExperienceTruthDecision[];blockedClaims:number;provenClaims:number;warnings:string[]}
export interface PublicExperienceResolutionStep {scope:string;status:'WINNER'|'VALID'|'MISS'|'BLOCKED'|'FALLBACK';authority:string;detail:string;templateId:string|null}
export interface PublicExperienceResolutionTrace {traceId:string;generatedAt:string;slug:string;locale:string;context:PublicExperienceResolvedContext;source:string;templateId:string|null;templateKey:string|null;templateRevisionId:string|null;steps:PublicExperienceResolutionStep[];compile:PublicExperienceCompileResult|null;truth:PublicExperienceTruthReport;experience360:PublicExperience360}
export interface PublicExperienceImpactNode {id:string;kind:'scope'|'entity'|'storefront'|'collection'|'campaign'|'route'|'cache';label:string;count:number;parentId:string|null;severity:'info'|'watch'|'high'}
export interface PublicExperienceImpactPreview {scope:PublicExperienceDetailScope|'storefront';key:string;generatedAt:string;publishedEntities:number;preservedOverrides:number;storefronts:number;collections:number;campaigns:number;placements?:number;dependencyEdges?:number;affectedPages?:number;routes:number;cacheTags?:string[];nodes:PublicExperienceImpactNode[];warnings:string[]}
export interface PublicExperienceStateProbe {key:string;label:string;state:'PASS'|'WATCH'|'BLOCKED';description:string;expectedFallback:string|null}
export interface PublicExperienceStateMatrix {generatedAt:string;entitySlug:string;probes:PublicExperienceStateProbe[];pass:number;watch:number;blocked:number}
export interface PublicExperienceActionSimulation {actionId:string;workflowId:string|null;status:'READY'|'BLOCKED'|'UNKNOWN';target:string|null;validations:string[];creates:string|null;canonicalEngine:string|null;adminDestination:string|null;reason:string|null;mutationPerformed:false}


// FINAL CLOSURE MAX — runtime enforcement, canonical worlds, release gates.
export interface PublicExperienceTruthEnforcementReport {blocked:boolean;removedProps:string[];blockedStaticClaims:string[];decisionKeys:string[];sanitizedComponentCount:number;reason:string|null}
export interface PublicExperienceRelationGraph {accessories:PublicExperience360Relation[];bundles:PublicExperience360Relation[];upsells:PublicExperience360Relation[];alternatives:PublicExperience360Relation[];recommendations:PublicExperience360Relation[];collections:PublicExperience360Relation[];placements:PublicExperience360Relation[]}
export interface PublicExperienceReleaseGate {key:string;label:string;state:'PASS'|'WATCH'|'BLOCKED';detail:string}
export interface PublicExperienceReleaseCertification {generatedAt:string;level:PublicExperienceReadinessLevel;entitySlug:string;templateId:string|null;templateKey:string|null;source:string;gates:PublicExperienceReleaseGate[];pass:number;watch:number;blocked:number;productionEligible:boolean;transactionActions:PublicExperienceActionSimulation[]}
