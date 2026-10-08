import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { blueprintForSchema } from '../../angelcare-marketplace/category-native/registry.ts'
import {
  CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_FIELDS,
  categoryNativeCsvFields,
  product360CatalogPatch,
  validateProduct360Enrichment,
} from '../../angelcare-marketplace/category-native/product360-enrichment.ts'

const schema = blueprintForSchema('home-childcare-one-time')
assert.ok(schema)
const root = new URL('../../', import.meta.url)
const source = (path: string) => readFile(new URL(path, root), 'utf8')

const baseRow: Record<string, unknown> = {
  template_version: 1,
  schema_key: 'home-childcare-one-time',
  service_key: 'hs-ac-001-08h',
  name_fr: 'Babysitting avancé - routine complète · 8h',
  short_description_fr: 'Garde professionnelle à domicile.',
  description_fr: 'Service de garde planifié avec brief familial et compte-rendu.',
  primary_image_reference: 'media-test-hs-ac-001',
  territory_codes: 'MA-MASTER',
  price_mode: 'fixed',
  price_amount: '400',
  category_keys: 'family-services|home-services',
  status: 'draft',
  age_min: '0',
  age_max: '12',
  children_min: '1',
  children_max: '1',
  minimum_duration_hours: '8',
  maximum_duration_hours: '8',
  required_parent_fields: 'children|address',
  cancellation_policy_key: 'home-childcare-standard-24h-v1',
}

const fullEnrichment: Record<string, unknown> = {
  seo_title_fr: 'Babysitting avancé à domicile 8h | AngelCare',
  seo_description_fr: 'Réservez une garde professionnelle AngelCare à domicile.',
  seo_social_title: 'Babysitting avancé AngelCare',
  seo_social_description: 'Une garde planifiée, sûre et rassurante.',
  fulfillment_mode: 'angelcare_internal',
  fulfillment_lead_time: 'Confirmation après validation du brief et de la capacité disponible.',
  fulfillment_delivery_method: 'Service réalisé au domicile du client.',
  fulfillment_capacity_model: 'provider_capacity',
  fulfillment_customer_handover: 'Brief, affectation, confirmation, réalisation et compte-rendu.',
  fulfillment_notes: 'Vérifier le territoire, les consignes et les contacts avant affectation.',
  trust_headline: 'Une garde encadrée par les standards AngelCare.',
  trust_certifications: 'Professionnel qualifié et dossier vérifié avant affectation.',
  trust_guarantees: 'Brief préalable, confirmation explicite et recours au support AngelCare.',
  trust_safety_information: 'Allergies, urgences, personnes autorisées et règles du domicile obligatoires.',
  trust_provider_requirements: 'Identité, qualifications, disponibilité et adéquation au brief vérifiées.',
}

test('Product 360 fields append once to category-native CSV fields', () => {
  const fields = categoryNativeCsvFields(schema.fields)
  const headers = fields.map((field) => field.field_key)
  const enrichmentKeys = CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_FIELDS.map((field) => field.field_key)
  assert.equal(new Set(headers).size, headers.length)
  for (const key of enrichmentKeys) {
    assert.ok(headers.includes(key), `missing template column ${key}`)
  }
})

test('legacy category-native rows remain valid without Product 360 enrichment', () => {
  assert.deepEqual(validateProduct360Enrichment(baseRow), [])
})

test('complete SEO, Fulfillment and Trust groups pass group validation', () => {
  assert.deepEqual(validateProduct360Enrichment({ ...baseRow, ...fullEnrichment }), [])
})

test('partial Product 360 groups are blocked before execution', () => {
  const errors = validateProduct360Enrichment({
    ...baseRow,
    fulfillment_mode: 'angelcare_internal',
  })
  assert.ok(errors.some((error) => error.includes('Fulfillment Product 360 incomplet')))
})

test('structured patches preserve unrelated existing Product 360 keys', () => {
  const patch = product360CatalogPatch(fullEnrichment, {
    seo_metadata: { title_fr: 'Ancien titre', custom_robot_policy: 'index' },
    fulfillment_config: { source_type: 'provider_pool' },
    trust_config: { legacy_proof_reference: 'TRUST-001' },
  })
  assert.deepEqual(patch.seo_metadata, {
    title_fr: fullEnrichment.seo_title_fr,
    custom_robot_policy: 'index',
    description_fr: fullEnrichment.seo_description_fr,
    social_title: fullEnrichment.seo_social_title,
    social_description: fullEnrichment.seo_social_description,
  })
  assert.equal(patch.fulfillment_config?.source_type, 'provider_pool')
  assert.equal(patch.fulfillment_config?.mode, 'angelcare_internal')
  assert.equal(patch.trust_config?.legacy_proof_reference, 'TRUST-001')
  assert.deepEqual(product360CatalogPatch(baseRow, null), {})
})

test('template validation and execution are wired to the canonical Product 360 patch', async () => {
  const validation = await source('angelcare-marketplace/category-native/validation.ts')
  const repository = await source('angelcare-marketplace/category-native/repository.ts')
  assert.match(validation, /categoryNativeCsvFields\(schema\.fields\)/)
  assert.match(validation, /validateProduct360Enrichment\(normalized\)/)
  assert.match(validation, /CATEGORY_NATIVE_PRODUCT360_ENRICHMENT_KEYS\.has\(field\.field_key\)/)
  assert.match(repository, /product360CatalogPatch\(normalized, existing\)/)
  assert.match(repository, /canonicalCatalogPayload\(schema, normalized, context\.actor\.id, job\.id, before\)/)
  assert.doesNotMatch(repository, /seo_metadata:\s*\{\}/)
})
