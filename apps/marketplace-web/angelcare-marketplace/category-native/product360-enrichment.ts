import type { ExperienceFieldBlueprint } from './types'

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
): ExperienceFieldBlueprint => ({
  field_key: fieldKey,
  section_key: 'product_360',
  label_fr: labelFr,
  label_en: labelFr,
  label_ar: labelFr,
  help_fr: helpFr,
  field_type: allowedValues.length ? 'select' : 'text',
  required: false,
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

export const CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_FIELDS: ExperienceFieldBlueprint[] = [
  field('seo_title_fr', 'Meta title FR', 'Titre SEO français du produit.'),
  field('seo_description_fr', 'Meta description FR', 'Description SEO française du produit.'),
  field('seo_title_en', 'Meta title EN', 'Titre SEO anglais facultatif.'),
  field('seo_description_en', 'Meta description EN', 'Description SEO anglaise facultative.'),
  field('seo_title_ar', 'Meta title AR', 'Titre SEO arabe facultatif.'),
  field('seo_description_ar', 'Meta description AR', 'Description SEO arabe facultative.'),
  field('seo_canonical_url', 'URL canonique SEO', 'URL canonique facultative.'),
  field('seo_social_title', 'Titre social', 'Titre utilisé lors du partage social.'),
  field('seo_social_description', 'Description sociale', 'Description utilisée lors du partage social.'),
  field('fulfillment_mode', 'Modèle de fulfillment', 'Autorité qui délivre le service.', [
    'angelcare_internal', 'provider', 'vendor', 'academy', 'digital', 'shipment', 'hybrid',
  ]),
  field('fulfillment_lead_time', 'Délai de fulfillment', 'Délai opérationnel communiqué au client.'),
  field('fulfillment_delivery_method', 'Méthode de délivrance', 'Lieu et mode de réalisation du service.'),
  field('fulfillment_capacity_model', 'Modèle de capacité', 'Autorité de capacité applicable.', [
    'unlimited', 'stock', 'slots', 'provider_capacity', 'cohort_capacity',
  ]),
  field('fulfillment_customer_handover', 'Déroulé client', 'Étapes entre la commande et la réalisation.'),
  field('fulfillment_notes', 'Instructions opérations', 'Consignes internes de fulfillment.'),
  field('trust_headline', 'Promesse de confiance', 'Promesse de confiance vérifiable par le client.'),
  field('trust_certifications', 'Certifications et preuves', 'Qualifications et preuves applicables.'),
  field('trust_guarantees', 'Garanties', 'Garanties et recours proposés au client.'),
  field('trust_safety_information', 'Sécurité et limites', 'Mesures de sécurité, limites et exclusions.'),
  field('trust_provider_requirements', 'Exigences prestataire', 'Exigences imposées au professionnel affecté.'),
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
      'fulfillment_capacity_model', 'fulfillment_customer_handover', 'fulfillment_notes',
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

export function categoryNativeCsvFields(fields: ExperienceFieldBlueprint[]): ExperienceFieldBlueprint[] {
  const seen = new Set<string>()
  return [...fields.filter((entry) => entry.csv_enabled), ...CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_FIELDS]
    .filter((entry) => {
      if (seen.has(entry.field_key)) return false
      seen.add(entry.field_key)
      return true
    })
}

export function validateProduct360Enrichment(normalized: Record<string, unknown>): string[] {
  const errors: string[] = []
  for (const group of REQUIRED_GROUP_FIELDS) {
    const groupMappings = PRODUCT360_MAPPINGS.filter((mapping) => group.keys.includes(mapping.csvKey))
    const groupStarted = PRODUCT360_MAPPINGS
      .filter((mapping) => mapping.column === groupMappings[0]?.column)
      .some((mapping) => isPresent(normalized[mapping.csvKey]))
    if (!groupStarted) continue
    const missing = group.keys.filter((key) => !isPresent(normalized[key]))
    if (missing.length) {
      errors.push(`${group.label} Product 360 incomplet : ${missing.join(', ')}.`)
    }
  }
  return errors
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
