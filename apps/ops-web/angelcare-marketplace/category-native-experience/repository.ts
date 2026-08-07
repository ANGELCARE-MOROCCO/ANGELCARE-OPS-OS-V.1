import { createHash, randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceError } from '../server/errors'
import type { CatalogLocale, DiscoveryItem } from '../catalog-discovery/types'
import { getDiscoveryItem, searchDiscovery } from '../catalog-discovery/repository'
import { CATEGORY_NATIVE_SCHEMA_BLUEPRINTS } from '../category-native/registry'
import type { ExperienceFieldBlueprint, ExperienceSchemaBlueprint, ExperienceVariantGroupBlueprint } from '../category-native/types'
import {
  confirmPublicConversion,
  createPublicConversionSession,
  getPublicConversionSession,
  recordConversionConsent,
  revalidateConversionAvailability,
  revalidateConversionPrice,
  updatePublicConversionSession,
} from '../conversion-universe/repository'
import type { ConversionAvailabilityDecision, ConversionJourney } from '../conversion-universe/types'
import { categoryNativeExperienceDefinition } from './registry'
import { assertValidCategoryNativeConfiguration, formatCategoryNativeValue, validateCategoryNativeConfiguration } from './validation'
import type {
  AdaptiveExperienceData,
  CategoryNativeAvailability,
  CategoryNativeCommitResult,
  CategoryNativeCompareResult,
  CategoryNativeConfigurationValidation,
  CategoryNativeFieldValue,
  CategoryNativeFilterDefinition,
  CategoryNativeMedia,
  CategoryNativePrice,
  CategoryNativeSession,
  CategoryNativeSessionCreateInput,
  CategoryNativeTrustClaim,
  CategoryNativeVariant,
} from './types'

type Row = Record<string, unknown>
type DbError = { code?: string; message?: string; details?: string } | null

const text = (value: unknown): string => typeof value === 'string' ? value : ''
const nullableText = (value: unknown): string | null => text(value) || null
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter((entry): entry is Row => Boolean(entry) && typeof entry === 'object') : []
const strings = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : []
const numberOrNull = (value: unknown): number | null => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value)

function availabilityStatus(
  value: string,
): ConversionAvailabilityDecision['status'] | null {
  switch (value) {
    case 'available':
    case 'hold_required':
    case 'configuration_required':
    case 'unavailable':
      return value
    default:
      return null
  }
}

function availabilityAuthority(
  value: string,
): ConversionAvailabilityDecision['authority'] | null {
  switch (value) {
    case 'catalog':
    case 'academy':
    case 'inventory':
    case 'provider':
    case 'corporate_quota':
    case 'manual_review':
      return value
    default:
      return null
  }
}

function availabilityDecision(
  value: unknown,
): ConversionAvailabilityDecision | null {
  const row = object(value)
  const status = availabilityStatus(text(row.status))
  const authority = availabilityAuthority(text(row.authority))

  if (!status || !authority) return null

  return {
    status,
    authority,
    quantity: numberOrNull(row.quantity) ?? 0,
    availableQuantity: numberOrNull(
      row.availableQuantity ?? row.available_quantity,
    ),
    sourceId: nullableText(row.sourceId ?? row.source_id),
    startsAt: nullableText(row.startsAt ?? row.starts_at),
    endsAt: nullableText(row.endsAt ?? row.ends_at),
    reason: nullableText(row.reason),
    evidence: object(row.evidence),
  }
}

function fail(operation: string, error: DbError): MarketplaceError {
  const configuration = error?.code === '42P01' || String(error?.message || '').includes('category_native')
  return new MarketplaceError(
    configuration ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    configuration ? 'La migration Category-Native Mega ZIP 2 doit être appliquée.' : `Impossible de ${operation}.`,
    { cause: error || undefined },
  )
}

function local(row: Row, base: string, locale: CatalogLocale): string {
  return text(row[`${base}_${locale}`]) || text(row[`${base}_fr`]) || text(row[base])
}

function visitorHash(reference: string): string {
  return createHash('sha256').update(reference).digest('hex')
}

function schemaField(row: Row): ExperienceFieldBlueprint {
  return {
    field_key: text(row.field_key),
    section_key: text(row.section_key),
    label_fr: text(row.label_fr),
    label_en: text(row.label_en),
    label_ar: text(row.label_ar),
    help_fr: text(row.help_fr),
    field_type: text(row.field_type) as ExperienceFieldBlueprint['field_type'],
    required: Boolean(row.required),
    allowed_values: strings(row.allowed_values),
    validation: object(row.validation),
    default_value: row.default_value ?? null,
    admin_visible: row.admin_visible !== false,
    csv_enabled: row.csv_enabled !== false,
    public_visible: row.public_visible !== false,
    filter_enabled: Boolean(row.filter_enabled),
    comparison_enabled: Boolean(row.comparison_enabled),
    operations_visible: row.operations_visible !== false,
    sort_order: Number(row.sort_order || 100),
  }
}

function schemaVariant(row: Row): ExperienceVariantGroupBlueprint {
  return {
    group_key: text(row.group_key),
    label_fr: text(row.label_fr),
    label_en: text(row.label_en),
    label_ar: text(row.label_ar),
    selection_type: text(row.selection_type) || 'single',
    required: Boolean(row.required),
    values: strings(row.values),
    affects_media: Boolean(row.affects_media),
    affects_price: Boolean(row.affects_price),
    affects_availability: Boolean(row.affects_availability),
    sort_order: Number(row.sort_order || 100),
  }
}

function schemaBlueprint(row: Row): ExperienceSchemaBlueprint {
  return {
    schema_key: text(row.schema_key),
    version: Number(row.version || 1),
    segment_key: text(row.segment_key),
    vertical_key: text(row.vertical_key),
    category_key: text(row.category_key),
    subcategory_key: text(row.subcategory_key),
    archetype_key: text(row.archetype_key),
    parent_schema_key: nullableText(row.parent_schema_key),
    name_fr: text(row.name_fr),
    name_en: text(row.name_en),
    name_ar: text(row.name_ar),
    description_fr: text(row.description_fr),
    admin_studio_template: text(row.admin_studio_template),
    public_experience_template: text(row.public_experience_template),
    conversion_template: text(row.conversion_template),
    operations_handover_type: text(row.operations_handover_type),
    homepage_card_template: text(row.homepage_card_template),
    availability_authority: text(row.availability_authority),
    pricing_modes: strings(row.pricing_modes),
    media_requirements: object(row.media_requirements),
    search_filters: strings(row.search_filters),
    comparison_fields: strings(row.comparison_fields),
    analytics_dimensions: strings(row.analytics_dimensions),
    configuration: object(row.configuration),
    status: text(row.status) as ExperienceSchemaBlueprint['status'],
    fields: rows(row.fields).map(schemaField).sort((a, b) => a.sort_order - b.sort_order),
    variant_groups: rows(row.variant_groups).map(schemaVariant).sort((a, b) => a.sort_order - b.sort_order),
  }
}

function inferSchemaKey(item: DiscoveryItem): string {
  const configured = text(item.metadata.experience_schema_key) || text(item.metadata.schema_key)
  if (configured) return configured
  if (item.kind === 'training') return 'academy-course'
  if (item.kind === 'audit') return 'quality-check-assessment'
  if (item.kind === 'saas_module') return 'partner-os-plan'
  if (item.kind === 'kit') return 'montessori-development-kit'
  if (item.kind === 'product') return 'flashcards-learning-product'
  if (item.category_key === 'hospitality') return 'hospitality-kids-programme'
  if (item.category_key === 'corporates') return 'corporate-childcare-benefit'
  if (item.category_key === 'establishments') return 'school-managed-programme'
  if (item.category_key === 'health-partners') return 'health-adjacent-programme'
  return 'home-childcare-one-time'
}

async function publishedSchema(schemaKey: string): Promise<ExperienceSchemaBlueprint> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('angelcare_marketplace_experience_schemas')
    .select('*,fields:angelcare_marketplace_experience_schema_fields(*),variant_groups:angelcare_marketplace_experience_variant_groups(*)')
    .eq('schema_key', schemaKey)
    .eq('status', 'active')
    .maybeSingle()
  if (error && error.code !== 'PGRST116' && error.code !== '42P01') throw fail('charger le schéma d’expérience', error)
  if (data) return schemaBlueprint(data as Row)
  const fallback = CATEGORY_NATIVE_SCHEMA_BLUEPRINTS.find((schema) => schema.schema_key === schemaKey)
  if (!fallback) throw new MarketplaceError('CONFIGURATION_ERROR', `Aucun schéma publié ne correspond à ${schemaKey}.`)
  return fallback
}

async function catalogExperienceRow(itemId: string): Promise<Row> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('angelcare_marketplace_catalog_items')
    .select('*,media:angelcare_marketplace_catalog_item_media(*),variants:angelcare_marketplace_catalog_variants(*),availability:angelcare_marketplace_catalog_availability(*),categories:angelcare_marketplace_catalog_item_categories(*,category:angelcare_marketplace_catalog_categories(*))')
    .eq('id', itemId)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw fail('charger les données category-native', error)
  if (!data) throw new MarketplaceError('NOT_FOUND', 'Offre publiée introuvable.')
  return data as Row
}

function localizedItem(row: Row, discovery: DiscoveryItem, locale: CatalogLocale, schemaKey: string, schemaVersion: number): AdaptiveExperienceData['item'] {
  return {
    ...discovery,
    name: local(row, 'name', locale) || discovery.name,
    short_description: local(row, 'short_description', locale) || discovery.short_description,
    description: local(row, 'description', locale) || discovery.description,
    metadata: { ...discovery.metadata, ...object(row.commercial_metadata), ...object(row.attributes) },
    experience_schema_key: schemaKey,
    experience_schema_version: schemaVersion,
    experience_configuration: object(row.experience_configuration),
  }
}

function localizedAlt(row: Row, locale: CatalogLocale, fallback: string): string {
  return local(row, 'alt_text', locale) || fallback
}

function mediaFromRow(row: Row, item: DiscoveryItem, locale: CatalogLocale): CategoryNativeMedia[] {
  const media = rows(row.media)
    .filter((entry) => text(entry.status) === 'active')
    .map((entry): CategoryNativeMedia => ({
      id: text(entry.id), key: text(entry.media_key), type: text(entry.media_type) || 'image',
      url: text(entry.asset_url), alt: localizedAlt(entry, locale, item.name), sortOrder: Number(entry.sort_order || 100),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
  if (!media.length && item.media_url) return [{ id: 'primary', key: 'primary', type: 'image', url: item.media_url, alt: item.name, sortOrder: 0 }]
  return media
}

function variantsFromRow(row: Row, locale: CatalogLocale): CategoryNativeVariant[] {
  return rows(row.variants)
    .filter((entry) => text(entry.status) === 'active')
    .map((entry): CategoryNativeVariant => ({
      id: text(entry.id), key: text(entry.variant_key), name: local(entry, 'name', locale) || text(entry.variant_key),
      configuration: object(entry.configuration), priceDelta: numberOrNull(entry.price_delta), status: text(entry.status), sortOrder: Number(entry.sort_order || 0),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function priceForItem(item: DiscoveryItem, locale: CatalogLocale): CategoryNativePrice {
  const amount = item.price_amount
  if (item.price_mode === 'quote_only' || amount === null) {
    return { mode: item.price_mode, amount: null, currencyLabel: item.currency_label, label: locale === 'fr' ? 'Sur devis' : locale === 'ar' ? 'حسب عرض السعر' : 'Request quote', source: 'quote_required' }
  }
  const prefix = item.price_mode === 'starting_from' ? (locale === 'fr' ? 'Dès ' : locale === 'ar' ? 'ابتداءً من ' : 'From ') : ''
  return { mode: item.price_mode, amount, currencyLabel: item.currency_label, label: `${prefix}${new Intl.NumberFormat(locale).format(amount)} ${item.currency_label}`, source: 'catalog' }
}

function availabilityFromRow(row: Row, schema: ExperienceSchemaBlueprint, territoryId?: string | null): CategoryNativeAvailability {
  const candidates = rows(row.availability).filter((entry) => !territoryId || !entry.territory_id || text(entry.territory_id) === territoryId)
  const active = candidates.find((entry) => entry.available === true) || null
  return active
    ? { status: 'available', authority: schema.availability_authority, availableQuantity: numberOrNull(active.capacity_limit), startsAt: nullableText(active.starts_at), endsAt: nullableText(active.ends_at), reason: nullableText(active.reason) }
    : { status: schema.pricing_modes.includes('quote_only') ? 'configuration_required' : 'unavailable', authority: schema.availability_authority, availableQuantity: null, startsAt: null, endsAt: null, reason: null }
}

function valueSources(row: Row, item: AdaptiveExperienceData['item']): Record<string, unknown> {
  return {
    ...object(row.commercial_metadata),
    ...object(row.attributes),
    ...item.experience_configuration,
    item_key: item.item_key,
    name_fr: text(row.name_fr), name_en: text(row.name_en), name_ar: text(row.name_ar),
    short_description_fr: text(row.short_description_fr), short_description_en: text(row.short_description_en), short_description_ar: text(row.short_description_ar),
    full_description_fr: text(row.description_fr), full_description_en: text(row.description_en), full_description_ar: text(row.description_ar),
    description_fr: text(row.description_fr), description_en: text(row.description_en), description_ar: text(row.description_ar),
    price_mode: item.price_mode, price_amount: item.price_amount, price_dh: item.price_amount, territory_codes: item.metadata.territory_codes,
    status: text(row.status), featured: item.featured,
  }
}

function fieldValues(schema: ExperienceSchemaBlueprint, row: Row, item: AdaptiveExperienceData['item'], locale: CatalogLocale): CategoryNativeFieldValue[] {
  const source = valueSources(row, item)
  return schema.fields
    .filter((field) => field.public_visible)
    .map((field) => ({ field, value: source[field.field_key] ?? field.default_value ?? null, formatted: formatCategoryNativeValue(field, source[field.field_key] ?? field.default_value ?? null, locale) }))
}

function groupFields(values: CategoryNativeFieldValue[]): Record<string, CategoryNativeFieldValue[]> {
  return values.reduce<Record<string, CategoryNativeFieldValue[]>>((result, entry) => {
    const section = entry.field.section_key || 'details'
    result[section] = [...(result[section] || []), entry]
    return result
  }, {})
}

function trustClaims(item: DiscoveryItem, schema: ExperienceSchemaBlueprint, locale: CatalogLocale): CategoryNativeTrustClaim[] {
  const published = item.trust_labels.map((label, index) => ({ key: `published-${index}`, label, status: 'active', evidenceReference: null }))
  const structural: CategoryNativeTrustClaim[] = [
    { key: 'schema', label: locale === 'fr' ? `Expérience ${schema.name_fr}` : locale === 'ar' ? schema.name_ar : schema.name_en, status: 'published', evidenceReference: schema.schema_key },
    { key: 'availability', label: locale === 'fr' ? 'Disponibilité revérifiée avant confirmation' : locale === 'ar' ? 'إعادة التحقق من التوفر قبل التأكيد' : 'Availability revalidated before confirmation', status: 'governed', evidenceReference: schema.availability_authority },
  ]
  return [...published, ...structural]
}

export async function getAdaptiveExperience(input: { locale: CatalogLocale; slug?: string; itemKey?: string; territoryCode?: string | null }): Promise<AdaptiveExperienceData | null> {
  const db = await createServiceClient()
  let discovery: DiscoveryItem | null = null
  if (input.slug) discovery = await getDiscoveryItem({ locale: input.locale, slug: input.slug, territoryCode: input.territoryCode })
  if (!discovery && input.itemKey) {
    const { data, error } = await db.from('angelcare_marketplace_catalog_items').select('slug').eq('item_key', input.itemKey).eq('status', 'published').maybeSingle()
    if (error) throw fail('résoudre la référence commerciale', error)
    if (data?.slug) discovery = await getDiscoveryItem({ locale: input.locale, slug: String(data.slug), territoryCode: input.territoryCode })
  }
  if (!discovery) return null
  const row = await catalogExperienceRow(discovery.id)
  const configuredSchemaKey = text(row.experience_schema_key) || inferSchemaKey(discovery)
  const schema = await publishedSchema(configuredSchemaKey)
  const definition = categoryNativeExperienceDefinition(schema.schema_key)
  if (!definition) throw new MarketplaceError('CONFIGURATION_ERROR', `Le moteur public ne connaît pas le schéma ${schema.schema_key}.`)
  const item = localizedItem(row, discovery, input.locale, schema.schema_key, Number(row.experience_schema_version || schema.version))
  const values = fieldValues(schema, row, item, input.locale)
  const recommendationsSearch = await searchDiscovery({ locale: input.locale, territoryCode: input.territoryCode, category: item.category_key, limit: 12 }).catch(() => null)
  return {
    locale: input.locale,
    item,
    schema,
    definition,
    fieldValues: values,
    fieldsBySection: groupFields(values),
    variantGroups: schema.variant_groups,
    variants: variantsFromRow(row, input.locale),
    media: mediaFromRow(row, item, input.locale),
    price: priceForItem(item, input.locale),
    availability: availabilityFromRow(row, schema, item.territory_id),
    trust: trustClaims(item, schema, input.locale),
    recommendations: (recommendationsSearch?.items || []).filter((entry) => entry.id !== item.id).slice(0, 6),
  }
}

export async function categoryNativeFilters(input: { locale: CatalogLocale; schemaKeys?: string[]; categoryKey?: string | null }): Promise<CategoryNativeFilterDefinition[]> {
  const selected = CATEGORY_NATIVE_SCHEMA_BLUEPRINTS.filter((schema) =>
    schema.status === 'active' && (!input.schemaKeys?.length || input.schemaKeys.includes(schema.schema_key)) && (!input.categoryKey || schema.category_key === input.categoryKey),
  )
  const filters = new Map<string, CategoryNativeFilterDefinition>()
  for (const schema of selected) {
    for (const field of schema.fields.filter((entry) => entry.filter_enabled)) {
      const existing = filters.get(field.field_key)
      if (existing) {
        existing.schemaKeys.push(schema.schema_key)
        existing.allowedValues = [...new Set([...existing.allowedValues, ...field.allowed_values])]
      } else {
        filters.set(field.field_key, { key: field.field_key, label: input.locale === 'fr' ? field.label_fr : input.locale === 'ar' ? field.label_ar : field.label_en, type: field.field_type, allowedValues: field.allowed_values, schemaKeys: [schema.schema_key] })
      }
    }
  }
  return [...filters.values()]
}

export async function compareCategoryNativeItems(input: { locale: CatalogLocale; slugs: string[] }): Promise<CategoryNativeCompareResult> {
  const items = (await Promise.all(input.slugs.slice(0, 4).map((slug) => getAdaptiveExperience({ locale: input.locale, slug })))).filter((entry): entry is AdaptiveExperienceData => Boolean(entry))
  if (!items.length) throw new MarketplaceError('NOT_FOUND', 'Aucune offre comparable n’a été trouvée.')
  const schemaKey = items[0].schema.schema_key
  if (items.some((entry) => entry.schema.schema_key !== schemaKey)) throw new MarketplaceError('VALIDATION_ERROR', 'La comparaison category-native requiert le même archétype.')
  const fields = items[0].schema.fields.filter((field) => field.comparison_enabled)
  return { locale: input.locale, schemaKey, fields, items }
}

function journeyForSchema(schema: ExperienceSchemaBlueprint): ConversionJourney {
  const template = schema.conversion_template
  if (['product_checkout', 'digital_checkout', 'subscription_checkout'].includes(template)) return 'product_checkout'
  if (['course_enrollment', 'cohort_enrollment', 'pathway_enrollment', 'event_enrollment'].includes(template)) return 'academy_enrollment'
  if (template === 'subscription_request') return 'partner_subscription'
  if (template === 'assessment_request') return 'quality_assessment'
  if (['b2b_quote', 'guided_diagnostic', 'admission_application', 'suitability_request'].includes(template)) return 'b2b_quotation'
  return 'service_booking'
}

async function categoryNativeSessionRow(sessionKey: string, reference: string): Promise<Row | null> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('angelcare_marketplace_experience_sessions')
    .select('*')
    .eq('session_key', sessionKey)
    .eq('visitor_reference_hash', visitorHash(reference))
    .maybeSingle()
  if (error) throw fail('charger la session category-native', error)
  return data as Row | null
}

function sessionRecord(row: Row, conversionSession: Awaited<ReturnType<typeof getPublicConversionSession>>): CategoryNativeSession {
  const validation = object(row.validation_result) as unknown as CategoryNativeConfigurationValidation
  return {
    id: text(row.id), sessionKey: text(row.session_key), visitorReferenceHash: text(row.visitor_reference_hash),
    schemaKey: text(row.schema_key), schemaVersion: Number(row.schema_version || 1), catalogItemId: text(row.catalog_item_id),
    locale: text(row.locale) as CatalogLocale, status: text(row.status), configuration: object(row.configuration),
    validation: { valid: Boolean(validation.valid), normalized: object(validation.normalized), errors: object(validation.errors) as Record<string, string>, warnings: Array.isArray(validation.warnings) ? validation.warnings.map(String) : [] },
    conversionSession: conversionSession || null,
    priceSnapshot: conversionSession?.priceSnapshot || null,
    availability: availabilityDecision(conversionSession?.availability_result),
    outcome: conversionSession?.outcome || null,
    createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  }
}

export async function createCategoryNativeSession(input: CategoryNativeSessionCreateInput): Promise<CategoryNativeSession> {
  const experience = await getAdaptiveExperience({ locale: input.locale, slug: input.itemSlug, territoryCode: input.territoryCode })
  if (!experience) throw new MarketplaceError('NOT_FOUND', 'Offre category-native introuvable.')
  const validation = validateCategoryNativeConfiguration(experience.schema, input.initialConfiguration || {})
  const conversion = await createPublicConversionSession({
    itemSlug: input.itemSlug, locale: input.locale, journey: journeyForSchema(experience.schema), visitorReference: input.visitorReference,
    sourceRoute: input.sourceRoute, territoryCode: input.territoryCode, idempotencyKey: input.idempotencyKey,
    initialConfiguration: { ...validation.normalized, experienceSchemaKey: experience.schema.schema_key, experienceSchemaVersion: experience.schema.version, operationsHandoverType: experience.schema.operations_handover_type },
  })
  const db = await createServiceClient()
  const sessionKey = randomUUID()
  const { data, error } = await db.from('angelcare_marketplace_experience_sessions').insert({
    session_key: sessionKey, visitor_reference_hash: visitorHash(input.visitorReference), schema_key: experience.schema.schema_key,
    schema_version: experience.schema.version, catalog_item_id: experience.item.id, conversion_session_id: conversion.id, conversion_session_key: conversion.session_key,
    locale: input.locale, territory_id: experience.item.territory_id, status: validation.valid ? 'configuring' : 'configuration_invalid',
    configuration: validation.normalized, validation_result: validation, source_route: input.sourceRoute || null,
    idempotency_key: input.idempotencyKey, expires_at: conversion.expires_at,
  }).select('*').single()
  if (error || !data) throw fail('créer la session category-native', error)
  return sessionRecord(data as Row, conversion)
}

export async function getCategoryNativeSession(sessionKey: string, visitorReference: string): Promise<CategoryNativeSession | null> {
  const row = await categoryNativeSessionRow(sessionKey, visitorReference)
  if (!row) return null
  const conversionSession = await getPublicConversionSession(text(row.conversion_session_key), visitorReference).catch(() => null)
  return sessionRecord(row, conversionSession)
}

export async function updateCategoryNativeConfiguration(input: { sessionKey: string; visitorReference: string; configuration: Record<string, unknown>; identity?: Record<string, unknown> }): Promise<CategoryNativeSession> {
  const row = await categoryNativeSessionRow(input.sessionKey, input.visitorReference)
  if (!row) throw new MarketplaceError('NOT_FOUND', 'Session category-native introuvable.')
  const schema = await publishedSchema(text(row.schema_key))
  const validation = validateCategoryNativeConfiguration(schema, { ...object(row.configuration), ...input.configuration })
  const conversionSessionKey = text(row.conversion_session_key)
  const db = await createServiceClient()
  let conversion = null
  if (conversionSessionKey) {
    const contactName = text(input.identity?.contactName).trim()
    const email = text(input.identity?.email).trim()
    const phone = text(input.identity?.phone).trim()
    if (contactName.length < 2 || (!email.includes('@') && phone.length < 8)) throw new MarketplaceError('VALIDATION_ERROR', 'Un nom et au moins un email ou téléphone valide sont requis.')
    conversion = await updatePublicConversionSession({ sessionKey: conversionSessionKey, visitorReference: input.visitorReference, identity: { contactName, email: email || null, phone: phone || null }, configuration: { ...validation.normalized, experienceSchemaKey: schema.schema_key, experienceSchemaVersion: schema.version, operationsHandoverType: schema.operations_handover_type }, status: validation.valid ? 'availability_pending' : 'configuring' })
  }
  const { data, error } = await db.from('angelcare_marketplace_experience_sessions').update({
    configuration: validation.normalized, validation_result: validation, status: validation.valid ? 'configuration_valid' : 'configuration_invalid', updated_at: new Date().toISOString(),
  }).eq('id', text(row.id)).select('*').single()
  if (error || !data) throw fail('enregistrer la configuration category-native', error)
  return sessionRecord(data as Row, conversion)
}

export async function revalidateCategoryNativeSession(input: { sessionKey: string; visitorReference: string; quantity?: number }): Promise<CategoryNativeSession> {
  const row = await categoryNativeSessionRow(input.sessionKey, input.visitorReference)
  if (!row) throw new MarketplaceError('NOT_FOUND', 'Session category-native introuvable.')
  const schema = await publishedSchema(text(row.schema_key))
  assertValidCategoryNativeConfiguration(schema, object(row.configuration))
  const conversionSessionKey = text(row.conversion_session_key)
  if (!conversionSessionKey) throw new MarketplaceError('CONFIGURATION_ERROR', 'La session de conversion liée est absente.')
  const [price, availability] = await Promise.all([
    revalidateConversionPrice({ sessionKey: conversionSessionKey, visitorReference: input.visitorReference, quantity: input.quantity }),
    revalidateConversionAvailability({ sessionKey: conversionSessionKey, visitorReference: input.visitorReference, quantity: input.quantity, configuration: object(row.configuration) }),
  ])
  const db = await createServiceClient()
  await Promise.all([
    db.from('angelcare_marketplace_experience_price_results').insert({ experience_session_id: row.id, conversion_price_snapshot_id: price.id, status: price.status, amount: price.grand_total, currency_label: price.currency_label, source: price.pricing_source, evidence: price.evidence }),
    db.from('angelcare_marketplace_experience_availability_results').insert({ experience_session_id: row.id, status: availability.status, authority: availability.authority, available_quantity: availability.availableQuantity, source_id: availability.sourceId, starts_at: availability.startsAt, ends_at: availability.endsAt, reason: availability.reason, evidence: availability.evidence }),
    db.from('angelcare_marketplace_experience_sessions').update({ status: availability.status === 'unavailable' ? 'unavailable' : 'ready_for_review', updated_at: new Date().toISOString() }).eq('id', row.id),
  ])
  const current = await categoryNativeSessionRow(input.sessionKey, input.visitorReference)
  const conversion = await getPublicConversionSession(conversionSessionKey, input.visitorReference)
  return sessionRecord(current || row, conversion)
}

export async function commitCategoryNativeSession(input: { sessionKey: string; visitorReference: string; idempotencyKey: string; consents: { terms: boolean; privacy: boolean; nonMedical?: boolean } }): Promise<CategoryNativeCommitResult> {
  const row = await categoryNativeSessionRow(input.sessionKey, input.visitorReference)
  if (!row) throw new MarketplaceError('NOT_FOUND', 'Session category-native introuvable.')
  const schema = await publishedSchema(text(row.schema_key))
  assertValidCategoryNativeConfiguration(schema, object(row.configuration))
  if (!input.consents.terms || !input.consents.privacy) throw new MarketplaceError('VALIDATION_ERROR', 'Les consentements obligatoires doivent être acceptés explicitement.')
  if ((schema.schema_key === 'non-medical-support-service' || schema.schema_key === 'health-adjacent-programme') && !input.consents.nonMedical) throw new MarketplaceError('VALIDATION_ERROR', 'La limite strictement non médicale doit être reconnue explicitement.')
  const conversionSessionKey = text(row.conversion_session_key)
  if (!conversionSessionKey) throw new MarketplaceError('CONFIGURATION_ERROR', 'La session de conversion liée est absente.')
  await recordConversionConsent({ sessionKey: conversionSessionKey, visitorReference: input.visitorReference, consentKey: 'marketplace_terms', consentVersion: 'category-native-mz2-v1', locale: text(row.locale) as CatalogLocale, accepted: true, evidence: { schemaKey: schema.schema_key, schemaVersion: schema.version } })
  await recordConversionConsent({ sessionKey: conversionSessionKey, visitorReference: input.visitorReference, consentKey: 'privacy_notice', consentVersion: 'category-native-mz2-v1', locale: text(row.locale) as CatalogLocale, accepted: true, evidence: { schemaKey: schema.schema_key } })
  if (schema.schema_key === 'non-medical-support-service' || schema.schema_key === 'health-adjacent-programme') {
    await recordConversionConsent({ sessionKey: conversionSessionKey, visitorReference: input.visitorReference, consentKey: 'non_medical_boundary', consentVersion: 'category-native-mz2-v1', locale: text(row.locale) as CatalogLocale, accepted: true, evidence: { explicitlyAcknowledged: true } })
  }
  const outcome = await confirmPublicConversion({ sessionKey: conversionSessionKey, visitorReference: input.visitorReference, idempotencyKey: input.idempotencyKey })
  const db = await createServiceClient()
  const handoverPayload = { schemaKey: schema.schema_key, schemaVersion: schema.version, operationsHandoverType: schema.operations_handover_type, configuration: object(row.configuration), outcome }
  await Promise.all([
    db.from('angelcare_marketplace_experience_handover_events').insert({ experience_session_id: row.id, conversion_outcome_id: outcome.id, handover_type: schema.operations_handover_type, canonical_object_type: outcome.canonical_object_type, canonical_object_id: outcome.canonical_object_id, status: outcome.status, payload: handoverPayload }),
    db.from('angelcare_marketplace_experience_configuration_snapshots').insert({ experience_session_id: row.id, schema_key: schema.schema_key, schema_version: schema.version, configuration: object(row.configuration), validation_result: object(row.validation_result), snapshot_hash: createHash('sha256').update(JSON.stringify(object(row.configuration))).digest('hex') }),
    db.from('angelcare_marketplace_experience_sessions').update({ status: 'committed', committed_at: new Date().toISOString(), outcome_id: outcome.id, updated_at: new Date().toISOString() }).eq('id', row.id),
  ])
  const current = await categoryNativeSessionRow(input.sessionKey, input.visitorReference)
  const conversion = await getPublicConversionSession(conversionSessionKey, input.visitorReference)
  return { session: sessionRecord(current || row, conversion), outcome, handoverType: schema.operations_handover_type, journeyReference: outcome.public_reference || null }
}

export async function categoryNativeJourneyContinuity(input: { journeyId: string; locale: CatalogLocale }) {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('angelcare_marketplace_experience_handover_events')
    .select('*,session:angelcare_marketplace_experience_sessions(*),snapshots:angelcare_marketplace_experience_configuration_snapshots(*)')
    .or(`canonical_object_id.eq.${input.journeyId},conversion_outcome_id.eq.${input.journeyId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw fail('charger la continuité category-native', error)
  return data || null
}
