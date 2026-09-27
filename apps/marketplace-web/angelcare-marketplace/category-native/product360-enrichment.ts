import { findProductDoctrine } from '../enterprise-command/product-doctrine'
import type { ExperienceFieldBlueprint, ExperienceSchemaBlueprint } from './types'

type Product360Column = 'seo_metadata' | 'fulfillment_config' | 'trust_config'

interface Product360CsvMapping {
  csvKey: string
  column: Product360Column
  configKey: string
}

const field = (
  fieldKey: string,
  labelFr: string,
  helpFr: string,
  allowedValues: string[] = [],
  required = false,
): ExperienceFieldBlueprint => ({
  field_key: fieldKey,
  section_key: 'product_360',
  label_fr: labelFr,
  label_en: labelFr,
  label_ar: labelFr,
  help_fr: helpFr,
  field_type: allowedValues.length ? 'select' : 'text',
  required,
  allowed_values: allowedValues,
  validation: {},
  default_value: null,
  admin_visible: false,
  csv_enabled: true,
  public_visible: false,
  filter_enabled: false,
  comparison_enabled: false,
  operations_visible: false,
  sort_order: 10_000,
})

export const CATEGORY_NATIVE_DEFERRED_MEDIA_KEYS = new Set([
  'primary_image_reference',
  'gallery_references',
])

export const CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_FIELDS: ExperienceFieldBlueprint[] = [
  field('seo_title_fr', 'Meta title FR', 'Titre SEO français du produit.', [], true),
  field('seo_description_fr', 'Meta description FR', 'Description SEO française du produit.', [], true),
  field('seo_title_en', 'Meta title EN', 'Titre SEO anglais facultatif.'),
  field('seo_description_en', 'Meta description EN', 'Description SEO anglaise facultative.'),
  field('seo_title_ar', 'Meta title AR', 'Titre SEO arabe facultatif.'),
  field('seo_description_ar', 'Meta description AR', 'Description SEO arabe facultative.'),
  field('seo_canonical_url', 'URL canonique SEO', 'URL canonique facultative.'),
  field('seo_social_title', 'Titre social', 'Titre utilisé lors du partage social.'),
  field('seo_social_description', 'Description sociale', 'Description utilisée lors du partage social.'),
  field('fulfillment_mode', 'Modèle de fulfillment', 'Autorité qui délivre le service.', [
    'angelcare_internal', 'provider', 'vendor', 'academy', 'digital', 'shipment', 'hybrid',
  ], true),
  field('fulfillment_lead_time', 'Délai de fulfillment', 'Délai opérationnel communiqué au client.', [], true),
  field('fulfillment_delivery_method', 'Méthode de délivrance', 'Lieu et mode de réalisation du service.', [], true),
  field('fulfillment_capacity_model', 'Modèle de capacité', 'Autorité de capacité applicable.', [
    'unlimited', 'stock', 'slots', 'provider_capacity', 'cohort_capacity',
  ], true),
  field('fulfillment_customer_handover', 'Déroulé client', 'Étapes entre la commande et la réalisation.', [], true),
  field('fulfillment_notes', 'Instructions opérations', 'Consignes internes de fulfillment.'),
  field('trust_headline', 'Promesse de confiance', 'Promesse de confiance vérifiable par le client.', [], true),
  field('trust_certifications', 'Certifications et preuves', 'Qualifications et preuves applicables.', [], true),
  field('trust_guarantees', 'Garanties', 'Garanties et recours proposés au client.', [], true),
  field('trust_safety_information', 'Sécurité et limites', 'Mesures de sécurité, limites et exclusions.', [], true),
  field('trust_provider_requirements', 'Exigences prestataire', 'Exigences imposées au professionnel affecté.', [], true),
  field('trust_proof_urls', 'Liens de preuve', 'Liens de preuve facultatifs, séparés par une barre verticale.'),
]

export const CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_KEYS = new Set(
  CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_FIELDS.map((entry) => entry.field_key),
)

const PRODUCT360_MAPPINGS: Product360CsvMapping[] = [
  { csvKey: 'seo_title_fr', column: 'seo_metadata', configKey: 'title_fr' },
  { csvKey: 'seo_description_fr', column: 'seo_metadata', configKey: 'description_fr' },
  { csvKey: 'seo_title_en', column: 'seo_metadata', configKey: 'title_en' },
  { csvKey: 'seo_description_en', column: 'seo_metadata', configKey: 'description_en' },
  { csvKey: 'seo_title_ar', column: 'seo_metadata', configKey: 'title_ar' },
  { csvKey: 'seo_description_ar', column: 'seo_metadata', configKey: 'description_ar' },
  { csvKey: 'seo_canonical_url', column: 'seo_metadata', configKey: 'canonical' },
  { csvKey: 'seo_social_title', column: 'seo_metadata', configKey: 'social_title' },
  { csvKey: 'seo_social_description', column: 'seo_metadata', configKey: 'social_description' },
  { csvKey: 'fulfillment_mode', column: 'fulfillment_config', configKey: 'mode' },
  { csvKey: 'fulfillment_lead_time', column: 'fulfillment_config', configKey: 'lead_time' },
  { csvKey: 'fulfillment_delivery_method', column: 'fulfillment_config', configKey: 'delivery_method' },
  { csvKey: 'fulfillment_capacity_model', column: 'fulfillment_config', configKey: 'capacity_model' },
  { csvKey: 'fulfillment_customer_handover', column: 'fulfillment_config', configKey: 'customer_handover' },
  { csvKey: 'fulfillment_notes', column: 'fulfillment_config', configKey: 'fulfillment_notes' },
  { csvKey: 'trust_headline', column: 'trust_config', configKey: 'trust_headline' },
  { csvKey: 'trust_certifications', column: 'trust_config', configKey: 'certifications' },
  { csvKey: 'trust_guarantees', column: 'trust_config', configKey: 'guarantees' },
  { csvKey: 'trust_safety_information', column: 'trust_config', configKey: 'safety_information' },
  { csvKey: 'trust_provider_requirements', column: 'trust_config', configKey: 'provider_requirements' },
  { csvKey: 'trust_proof_urls', column: 'trust_config', configKey: 'proof_urls' },
]

const REQUIRED_GROUP_FIELDS: Array<{ label: string; keys: string[] }> = [
  { label: 'SEO', keys: ['seo_title_fr', 'seo_description_fr'] },
  {
    label: 'Fulfillment',
    keys: [
      'fulfillment_mode', 'fulfillment_lead_time', 'fulfillment_delivery_method',
      'fulfillment_capacity_model', 'fulfillment_customer_handover',
    ],
  },
  {
    label: 'Trust',
    keys: [
      'trust_headline', 'trust_certifications', 'trust_guarantees',
      'trust_safety_information', 'trust_provider_requirements',
    ],
  },
]

const isPresent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  return String(value).trim().length > 0
}

const asObject = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
)

const asText = (value: unknown): string => String(value ?? '').trim()
const asNumber = (value: unknown): number | null => {
  if (!isPresent(value)) return null
  const parsed = Number(typeof value === 'string' ? value.replace(/\s/g, '').replace(',', '.') : value)
  return Number.isFinite(parsed) ? parsed : null
}
const asList = (value: unknown): string[] => Array.isArray(value)
  ? value.map(asText).filter(Boolean)
  : asText(value).split(/[|;,]+/).map((entry) => entry.trim()).filter(Boolean)
const firstPresent = (...values: unknown[]): unknown => values.find(isPresent)
const joined = (value: unknown): string => asList(value).join(' | ')
const hoursToMinutes = (value: unknown): number | null => {
  const parsed = asNumber(value)
  return parsed === null ? null : Math.round(parsed * 60)
}

function doctrineFieldBlueprint(
  key: string,
  label: string,
  type: string,
  options: string[] | undefined,
): ExperienceFieldBlueprint {
  const fieldType = type === 'json' ? 'json'
    : type === 'number' ? 'number'
      : type === 'boolean' ? 'boolean'
        : type === 'date' ? 'date'
          : options?.length ? 'select'
            : 'text'
  return {
    field_key: key,
    section_key: 'product_360_doctrine',
    label_fr: label,
    label_en: label,
    label_ar: label,
    help_fr: 'Champ canonique Product 360. Il est auto-dérivé du schéma natif lorsque possible ; sinon il doit être fourni dans le CSV.',
    field_type: fieldType as ExperienceFieldBlueprint['field_type'],
    required: false,
    allowed_values: options || [],
    validation: {},
    default_value: null,
    admin_visible: false,
    csv_enabled: true,
    public_visible: false,
    filter_enabled: false,
    comparison_enabled: false,
    operations_visible: false,
    sort_order: 10_500,
  }
}

function schemaSellableType(schema: ExperienceSchemaBlueprint): string {
  return asText(schema.configuration.sellable_type || schema.archetype_key)
}

export function categoryNativeDoctrineFields(schema: ExperienceSchemaBlueprint): ExperienceFieldBlueprint[] {
  const definition = findProductDoctrine(schemaSellableType(schema))
  if (!definition) return []
  const native = new Set([
    ...schema.fields.map((entry) => entry.field_key),
    ...CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_FIELDS.map((entry) => entry.field_key),
  ])
  return definition.fields
    .filter((entry) => entry.required && !native.has(entry.key))
    .map((entry) => doctrineFieldBlueprint(entry.key, entry.label, entry.type, entry.options))
}

export function categoryNativeCsvFields(schema: ExperienceSchemaBlueprint): ExperienceFieldBlueprint[] {
  const seen = new Set<string>()
  const nativeFields = schema.fields
    .filter((entry) => entry.csv_enabled)
    .map((entry) => CATEGORY_NATIVE_DEFERRED_MEDIA_KEYS.has(entry.field_key)
      ? { ...entry, required: false, help_fr: `${entry.help_fr || entry.label_fr} · Média différé : assignable manuellement après import.` }
      : entry)
  return [
    ...nativeFields,
    ...CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_FIELDS,
    ...categoryNativeDoctrineFields(schema),
  ].filter((entry) => {
    if (seen.has(entry.field_key)) return false
    seen.add(entry.field_key)
    return true
  })
}

export function validateProduct360Enrichment(normalized: Record<string, unknown>): string[] {
  const errors: string[] = []
  for (const group of REQUIRED_GROUP_FIELDS) {
    const missing = group.keys.filter((key) => !isPresent(normalized[key]))
    if (missing.length) errors.push(`${group.label} Product 360 incomplet : ${missing.join(', ')}.`)
  }
  return errors
}

export function categoryNativeDoctrineAttributes(
  schema: ExperienceSchemaBlueprint,
  normalized: Record<string, unknown>,
): Record<string, unknown> {
  const sellable = schemaSellableType(schema)
  const definition = findProductDoctrine(sellable)
  if (!definition) return {}
  const out: Record<string, unknown> = {}

  for (const entry of definition.fields.filter((candidate) => candidate.required)) {
    if (isPresent(normalized[entry.key])) out[entry.key] = normalized[entry.key]
  }

  const territoryScope = joined(normalized.territory_codes)
  const capability = asText(firstPresent(
    normalized.provider_capability,
    normalized.provider_certification,
    normalized.tutor_qualification,
    normalized.provider_training_requirements,
  )) || schema.schema_key

  if (sellable === 'one_time_service') {
    out.duration_minutes ??= firstPresent(
      normalized.session_duration_minutes,
      hoursToMinutes(normalized.minimum_duration_hours),
    )
    out.booking_lead_hours ??= normalized.minimum_lead_time_hours
    out.provider_capability ??= capability
    out.service_area ??= territoryScope
    out.cancellation_policy ??= normalized.cancellation_policy_key
  } else if (sellable === 'recurring_service') {
    out.frequency ??= firstPresent(normalized.frequency, normalized.recurrence_types)
    out.provider_capability ??= capability
    out.service_area ??= territoryScope
    out.cancellation_policy ??= normalized.cancellation_policy_key
  } else if (sellable === 'family_service') {
    const ageMin = asNumber(normalized.age_min)
    const ageMax = asNumber(normalized.age_max)
    if (!isPresent(out.age_range) && ageMin !== null && ageMax !== null) out.age_range = `${ageMin}-${ageMax}`
    out.duration_minutes ??= firstPresent(normalized.session_duration_minutes, hoursToMinutes(normalized.minimum_duration_hours))
    out.provider_capability ??= capability
    out.safety_protocol ??= [
      asText(normalized.authorized_pickup_protocol),
      asText(normalized.handover_proof_type),
      asText(normalized.lateness_policy),
    ].filter(Boolean).join(' · ')
    out.service_area ??= territoryScope
  } else if (sellable === 'academy_programme') {
    const ageMin = asNumber(normalized.age_min)
    const ageMax = asNumber(normalized.age_max)
    out.audience ??= firstPresent(
      normalized.intended_audience,
      normalized.audience_types,
      ageMin !== null && ageMax !== null ? `ages ${ageMin}-${ageMax}` : null,
      schema.schema_key === 'parent-workshop' ? 'parents' : null,
    )
    out.format ??= firstPresent(normalized.delivery_modality, normalized.event_format, normalized.onsite_online_modes)
  } else if (sellable === 'physical_product') {
    if (!isPresent(out.inventory_mode) && normalized.stock_quantity !== undefined) out.inventory_mode = 'stocked'
  } else if (sellable === 'kit') {
    out.kit_contents ??= normalized.components
  } else if (sellable === 'course') {
    out.audience ??= normalized.intended_audience
    out.format ??= normalized.delivery_modality
  } else if (sellable === 'cohort') {
    out.starts_at ??= normalized.start_date
    out.ends_at ??= normalized.end_date
    out.capacity ??= normalized.seat_capacity
    out.format ??= normalized.delivery_modality
  } else if (sellable === 'b2b_solution') {
    out.buyer_type ??= normalized.organization_type
    out.scope ??= firstPresent(
      normalized.solution_scope,
      normalized.programme_modules,
      normalized.required_roles,
      normalized.benefit_models,
      normalized.partner_types,
      normalized.venue_types,
      normalized.objectives,
    )
    out.deliverables ??= firstPresent(
      normalized.required_components,
      normalized.programme_modules,
      normalized.staffing_requirements,
      normalized.qualification_requirements,
      normalized.covered_service_keys,
      normalized.objectives,
    )
    out.deployment_model ??= firstPresent(normalized.programme_mode, normalized.onboarding_type, normalized.guest_booking_integration)
  } else if (sellable === 'partner_os_plan') {
    out.plan_key ??= normalized.solution_key
    out.feature_bundle ??= normalized.included_modules
    out.activation_flow ??= normalized.onboarding_type
  } else if (sellable === 'quality_assessment') {
    out.site_type ??= normalized.organization_type
    out.report_template ??= normalized.report_type
  }

  return Object.fromEntries(Object.entries(out).filter(([, value]) => isPresent(value)))
}

export function validateCategoryNativeDoctrineBridge(
  schema: ExperienceSchemaBlueprint,
  normalized: Record<string, unknown>,
): string[] {
  const definition = findProductDoctrine(schemaSellableType(schema))
  if (!definition) return [`Doctrine Product 360 inconnue pour ${schema.schema_key}.`]
  const bridged = categoryNativeDoctrineAttributes(schema, normalized)
  const missing = definition.fields
    .filter((entry) => entry.required && !isPresent(bridged[entry.key]))
    .map((entry) => entry.key)
  return missing.length
    ? [`Doctrine Product 360 incomplète (${definition.key}) : ${missing.join(', ')}.`]
    : []
}

export function product360CatalogPatch(
  normalized: Record<string, unknown>,
  existing: Record<string, unknown> | null,
): Partial<Record<Product360Column, Record<string, unknown>>> {
  const patch: Partial<Record<Product360Column, Record<string, unknown>>> = {}
  for (const mapping of PRODUCT360_MAPPINGS) {
    const value = normalized[mapping.csvKey]
    if (!isPresent(value)) continue
    const target = patch[mapping.column] || { ...asObject(existing?.[mapping.column]) }
    target[mapping.configKey] = value
    patch[mapping.column] = target
  }
  return patch
}
