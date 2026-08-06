import type { CatalogLocale, DiscoveryItem } from '../catalog-discovery/types'
import type {
  ExperienceFieldBlueprint,
  ExperienceSchemaBlueprint,
  ExperienceVariantGroupBlueprint,
} from '../category-native/types'
import type {
  ConversionAvailabilityDecision,
  ConversionOutcome,
  ConversionPriceSnapshot,
  ConversionSession,
} from '../conversion-universe/types'

export type CategoryNativeExperienceFamily =
  | 'home_childcare'
  | 'recurring_care'
  | 'school_pickup'
  | 'overnight_care'
  | 'emergency_care'
  | 'hotel_childcare'
  | 'event_care'
  | 'holiday_programme'
  | 'development_service'
  | 'learning_support'
  | 'non_medical_support'
  | 'flashcards'
  | 'montessori_kit'
  | 'development_game'
  | 'activity_box'
  | 'digital_resource'
  | 'preschool_admission'
  | 'academy_course'
  | 'academy_cohort'
  | 'certification_pathway'
  | 'parent_workshop'
  | 'institutional_training'
  | 'school_programme'
  | 'staff_reinforcement'
  | 'hospitality_programme'
  | 'corporate_benefit'
  | 'health_adjacent'
  | 'venue_programme'
  | 'partner_os'
  | 'quality_check'
  | 'managed_solution'

export interface CategoryNativeMedia {
  id: string
  key: string
  type: string
  url: string
  alt: string
  sortOrder: number
}

export interface CategoryNativeVariant {
  id: string
  key: string
  name: string
  configuration: Record<string, unknown>
  priceDelta: number | null
  status: string
  sortOrder: number
}

export interface CategoryNativeFieldValue {
  field: ExperienceFieldBlueprint
  value: unknown
  formatted: string
}

export interface CategoryNativeTrustClaim {
  key: string
  label: string
  status: string
  evidenceReference: string | null
}

export interface CategoryNativePrice {
  mode: string
  amount: number | null
  currencyLabel: string
  label: string
  source: 'catalog' | 'finance' | 'quote_required'
}

export interface CategoryNativeAvailability {
  status: string
  authority: string
  availableQuantity: number | null
  startsAt: string | null
  endsAt: string | null
  reason: string | null
}

export interface CategoryNativeExperienceDefinition {
  schemaKey: string
  family: CategoryNativeExperienceFamily
  publicExperienceTemplate: string
  conversionTemplate: string
  operationsHandoverType: string
  homepageCardTemplate: string
  availabilityAuthority: string
  publicFields: string[]
  configuratorFields: string[]
  searchFilters: string[]
  comparisonFields: string[]
}

export interface AdaptiveExperienceData {
  locale: CatalogLocale
  item: DiscoveryItem & {
    experience_schema_key: string
    experience_schema_version: number
    experience_configuration: Record<string, unknown>
  }
  schema: ExperienceSchemaBlueprint
  definition: CategoryNativeExperienceDefinition
  fieldValues: CategoryNativeFieldValue[]
  fieldsBySection: Record<string, CategoryNativeFieldValue[]>
  variantGroups: ExperienceVariantGroupBlueprint[]
  variants: CategoryNativeVariant[]
  media: CategoryNativeMedia[]
  price: CategoryNativePrice
  availability: CategoryNativeAvailability
  trust: CategoryNativeTrustClaim[]
  recommendations: DiscoveryItem[]
}

export interface CategoryNativeFilterDefinition {
  key: string
  label: string
  type: ExperienceFieldBlueprint['field_type']
  allowedValues: string[]
  schemaKeys: string[]
}

export interface CategoryNativeCompareResult {
  locale: CatalogLocale
  schemaKey: string
  fields: ExperienceFieldBlueprint[]
  items: AdaptiveExperienceData[]
}

export interface CategoryNativeConfigurationValidation {
  valid: boolean
  normalized: Record<string, unknown>
  errors: Record<string, string>
  warnings: string[]
}

export interface CategoryNativeSession {
  id: string
  sessionKey: string
  visitorReferenceHash: string
  schemaKey: string
  schemaVersion: number
  catalogItemId: string
  locale: CatalogLocale
  status: string
  configuration: Record<string, unknown>
  validation: CategoryNativeConfigurationValidation
  conversionSession: ConversionSession | null
  priceSnapshot: ConversionPriceSnapshot | null
  availability: ConversionAvailabilityDecision | null
  outcome: ConversionOutcome | null
  createdAt: string
  updatedAt: string
}

export interface CategoryNativeSessionCreateInput {
  itemSlug: string
  locale: CatalogLocale
  visitorReference: string
  idempotencyKey: string
  sourceRoute?: string
  territoryCode?: string | null
  initialConfiguration?: Record<string, unknown>
}

export interface CategoryNativeCommitResult {
  session: CategoryNativeSession
  outcome: ConversionOutcome
  handoverType: string
  journeyReference: string | null
}
