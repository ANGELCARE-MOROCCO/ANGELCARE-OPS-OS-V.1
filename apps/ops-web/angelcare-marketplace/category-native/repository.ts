import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { refreshCommerceSurfaces } from '../commerce-studio/publication'
import { slugify } from '../commerce-studio/validation'
import {
  CATEGORY_NATIVE_HOMEPAGE_BLOCKS,
  CATEGORY_NATIVE_SCHEMA_BLUEPRINTS,
  blueprintForSchema,
} from './registry'
import type {
  CategoryNativeImportJob,
  CategoryNativeImportRow,
  CategoryNativeStudioData,
  CategoryNativeSummary,
  ExperienceFieldBlueprint,
  ExperienceSchemaBlueprint,
  ExperienceSchemaFieldRecord,
  ExperienceSchemaRecord,
  HomepageBlockRecord,
  RowValidationResult,
} from './types'
import {
  assertCategoryNativeSchemaKey,
  categoryNativeBoolean,
  categoryNativeList,
  categoryNativeNumber,
  categoryNativeObject,
  categoryNativeOptionalText,
  categoryNativeText,
  parseCategoryNativeCsv,
  validateCategoryNativeRow,
} from './validation'

type Row = Record<string, unknown>
type DbError = { code?: string; message?: string; details?: string } | null

const SCHEMA_TABLE = 'angelcare_marketplace_experience_schemas'
const FIELD_TABLE = 'angelcare_marketplace_experience_schema_fields'
const VARIANT_TABLE = 'angelcare_marketplace_experience_variant_groups'
const ATTRIBUTE_TABLE = 'angelcare_marketplace_experience_attribute_groups'
const TEMPLATE_TABLE = 'angelcare_marketplace_schema_csv_templates'
const IMPORT_JOB_TABLE = 'angelcare_marketplace_category_native_import_jobs'
const IMPORT_ROW_TABLE = 'angelcare_marketplace_category_native_import_rows'
const BLOCK_TABLE = 'angelcare_marketplace_homepage_block_definitions'
const VERSION_TABLE = 'angelcare_marketplace_experience_schema_versions'

const rows = (value: unknown): Row[] => Array.isArray(value)
  ? value.filter((entry): entry is Row => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
  : []
const text = (value: unknown): string => typeof value === 'string' ? value : String(value ?? '')
const nullableText = (value: unknown): string | null => {
  const result = text(value).trim()
  return result || null
}
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value)
  ? value as Record<string, unknown>
  : {}
const strings = (value: unknown): string[] => Array.isArray(value)
  ? value.map(String).filter(Boolean)
  : []

function dbFailure(operation: string, error: DbError): MarketplaceError {
  const missing = error?.code === '42P01' || String(error?.message || '').includes('category_native') || String(error?.message || '').includes('experience_schema')
  return new MarketplaceError(
    missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missing
      ? 'La migration Category-Native Mega ZIP 1 doit être appliquée dans Supabase.'
      : `Impossible de ${operation}.`,
    { cause: error || undefined, retryable: !missing },
  )
}

function fallbackField(
  schemaKey: string,
  index: number,
  field: ExperienceFieldBlueprint,
): ExperienceSchemaFieldRecord {
  return {
    ...field,
    id: `blueprint-field:${schemaKey}:${field.field_key}`,
    schema_id: `blueprint:${schemaKey}`,
    conditional_rule: {},
    status: 'active',
    created_at: undefined,
    updated_at: undefined,
    sort_order: field.sort_order || index * 10,
  }
}

function fallbackSchema(blueprint: ExperienceSchemaBlueprint): ExperienceSchemaRecord {
  return {
    ...blueprint,
    id: `blueprint:${blueprint.schema_key}`,
    description_en: null,
    description_ar: null,
    published_at: null,
    created_at: '',
    updated_at: '',
    fields: blueprint.fields.map((field, index) => fallbackField(blueprint.schema_key, index, field)),
    variant_groups: blueprint.variant_groups.map((group) => ({
      ...group,
      id: `blueprint-variant:${blueprint.schema_key}:${group.group_key}`,
      schema_id: `blueprint:${blueprint.schema_key}`,
      status: 'active',
    })),
    attribute_groups: [],
    csv_templates: [],
  }
}

function mapField(row: Row): ExperienceSchemaFieldRecord {
  return {
    id: text(row.id),
    schema_id: text(row.schema_id),
    field_key: text(row.field_key),
    section_key: text(row.section_key),
    label_fr: text(row.label_fr),
    label_en: text(row.label_en),
    label_ar: text(row.label_ar),
    help_fr: text(row.help_fr),
    field_type: text(row.field_type) as ExperienceSchemaFieldRecord['field_type'],
    required: Boolean(row.required),
    allowed_values: strings(row.allowed_values),
    validation: object(row.validation),
    default_value: row.default_value,
    admin_visible: row.admin_visible !== false,
    csv_enabled: row.csv_enabled !== false,
    public_visible: row.public_visible !== false,
    filter_enabled: Boolean(row.filter_enabled),
    comparison_enabled: Boolean(row.comparison_enabled),
    operations_visible: row.operations_visible !== false,
    conditional_rule: object(row.conditional_rule),
    sort_order: Number(row.sort_order || 0),
    status: (text(row.status) || 'active') as ExperienceSchemaFieldRecord['status'],
    created_at: nullableText(row.created_at) || undefined,
    updated_at: nullableText(row.updated_at) || undefined,
  }
}

function mapSchema(row: Row): ExperienceSchemaRecord {
  const fields = rows(row.fields).map(mapField).sort((a, b) => a.sort_order - b.sort_order)
  const variants = rows(row.variant_groups).map((entry) => ({
    id: text(entry.id),
    schema_id: text(entry.schema_id),
    group_key: text(entry.group_key),
    label_fr: text(entry.label_fr),
    label_en: text(entry.label_en),
    label_ar: text(entry.label_ar),
    selection_type: text(entry.selection_type) || 'multi',
    required: Boolean(entry.required),
    values: strings(entry.values),
    affects_media: entry.affects_media !== false,
    affects_price: entry.affects_price !== false,
    affects_availability: entry.affects_availability !== false,
    sort_order: Number(entry.sort_order || 0),
    status: (text(entry.status) || 'active') as ExperienceSchemaRecord['status'],
  })).sort((a, b) => a.sort_order - b.sort_order)
  const attributes = rows(row.attribute_groups).map((entry) => ({
    id: text(entry.id), schema_id: text(entry.schema_id), group_key: text(entry.group_key),
    label_fr: text(entry.label_fr), label_en: nullableText(entry.label_en), label_ar: nullableText(entry.label_ar),
    settings: object(entry.settings), sort_order: Number(entry.sort_order || 0),
    status: (text(entry.status) || 'active') as ExperienceSchemaRecord['status'],
  }))
  const templates = rows(row.csv_templates).map((entry) => ({
    id: text(entry.id), template_key: text(entry.template_key), schema_id: text(entry.schema_id),
    version: Number(entry.version || 1), file_name: text(entry.file_name), delimiter: text(entry.delimiter) || ',',
    encoding: text(entry.encoding) || 'utf-8-bom', columns: rows(entry.columns), examples: rows(entry.examples),
    allowed_values: object(entry.allowed_values), instructions_fr: nullableText(entry.instructions_fr),
    status: (text(entry.status) || 'active') as ExperienceSchemaRecord['status'], generated_at: text(entry.generated_at),
  }))
  return {
    id: text(row.id), schema_key: text(row.schema_key), version: Number(row.version || 1),
    segment_key: text(row.segment_key), vertical_key: text(row.vertical_key), category_key: text(row.category_key),
    subcategory_key: text(row.subcategory_key), archetype_key: text(row.archetype_key), parent_schema_key: nullableText(row.parent_schema_key),
    name_fr: text(row.name_fr), name_en: text(row.name_en), name_ar: text(row.name_ar), description_fr: text(row.description_fr),
    description_en: nullableText(row.description_en), description_ar: nullableText(row.description_ar),
    admin_studio_template: text(row.admin_studio_template), public_experience_template: text(row.public_experience_template),
    conversion_template: text(row.conversion_template), operations_handover_type: text(row.operations_handover_type),
    homepage_card_template: text(row.homepage_card_template), availability_authority: text(row.availability_authority),
    pricing_modes: strings(row.pricing_modes), media_requirements: object(row.media_requirements),
    search_filters: strings(row.search_filters), comparison_fields: strings(row.comparison_fields),
    analytics_dimensions: strings(row.analytics_dimensions), configuration: object(row.configuration),
    status: (text(row.status) || 'active') as ExperienceSchemaRecord['status'],
    published_at: nullableText(row.published_at), created_at: text(row.created_at), updated_at: text(row.updated_at),
    fields, variant_groups: variants, attribute_groups: attributes, csv_templates: templates,
  }
}

function mapBlock(row: Row): HomepageBlockRecord {
  return {
    id: text(row.id), block_key: text(row.block_key), name_fr: text(row.name_fr), name_en: text(row.name_en),
    name_ar: text(row.name_ar), category_family: text(row.category_family), block_type: text(row.block_type),
    compatible_archetypes: strings(row.compatible_archetypes), required_data_fields: strings(row.required_data_fields),
    default_settings: object(row.default_settings), layout_presets: strings(row.layout_presets), icon_key: text(row.icon_key),
    status: (text(row.status) || 'active') as HomepageBlockRecord['status'], created_at: nullableText(row.created_at) || undefined,
    updated_at: nullableText(row.updated_at) || undefined,
  }
}

function mapImportJob(row: Row): CategoryNativeImportJob {
  return {
    id: text(row.id), public_reference: text(row.public_reference), schema_id: text(row.schema_id),
    template_id: nullableText(row.template_id), schema_key: nullableText(row.schema_key) || undefined,
    schema_name_fr: nullableText(row.schema_name_fr) || undefined, source_file_name: text(row.source_file_name),
    template_version: Number(row.template_version || 1), mode: text(row.mode) as CategoryNativeImportJob['mode'],
    status: text(row.status) as CategoryNativeImportJob['status'], total_rows: Number(row.total_rows || 0),
    valid_rows: Number(row.valid_rows || 0), invalid_rows: Number(row.invalid_rows || 0),
    imported_rows: Number(row.imported_rows || 0), updated_rows: Number(row.updated_rows || 0),
    failed_rows: Number(row.failed_rows || 0), created_by: nullableText(row.created_by), created_at: text(row.created_at),
    validated_at: nullableText(row.validated_at), executed_at: nullableText(row.executed_at), rolled_back_at: nullableText(row.rolled_back_at),
    error_summary: object(row.error_summary),
    rows: row.rows ? rows(row.rows).map((entry) => mapImportRow(entry)) : undefined,
  }
}

function mapImportRow(row: Row): CategoryNativeImportRow {
  return {
    id: text(row.id), job_id: text(row.job_id), row_number: Number(row.row_number || 0),
    identity_key: nullableText(row.identity_key), payload: object(row.payload), normalized_payload: object(row.normalized_payload),
    before_snapshot: row.before_snapshot ? object(row.before_snapshot) : null,
    status: text(row.status) as CategoryNativeImportRow['status'], errors: strings(row.errors), warnings: strings(row.warnings),
    target_item_id: nullableText(row.target_item_id), created_at: text(row.created_at), updated_at: text(row.updated_at),
  }
}

function schemaRecordAsBlueprint(record: ExperienceSchemaRecord): ExperienceSchemaBlueprint {
  return {
    schema_key: record.schema_key, version: record.version, segment_key: record.segment_key, vertical_key: record.vertical_key,
    category_key: record.category_key, subcategory_key: record.subcategory_key, archetype_key: record.archetype_key,
    parent_schema_key: record.parent_schema_key, name_fr: record.name_fr, name_en: record.name_en, name_ar: record.name_ar,
    description_fr: record.description_fr, admin_studio_template: record.admin_studio_template,
    public_experience_template: record.public_experience_template, conversion_template: record.conversion_template,
    operations_handover_type: record.operations_handover_type, homepage_card_template: record.homepage_card_template,
    availability_authority: record.availability_authority, pricing_modes: record.pricing_modes,
    media_requirements: record.media_requirements, search_filters: record.search_filters,
    comparison_fields: record.comparison_fields, analytics_dimensions: record.analytics_dimensions,
    configuration: record.configuration, status: record.status,
    fields: record.fields, variant_groups: record.variant_groups,
  }
}

export async function listExperienceSchemas(): Promise<ExperienceSchemaRecord[]> {
  const db = await createServiceClient()
  const { data, error } = await db.from(SCHEMA_TABLE).select(
    '*,fields:angelcare_marketplace_experience_schema_fields(*),variant_groups:angelcare_marketplace_experience_variant_groups(*),attribute_groups:angelcare_marketplace_experience_attribute_groups(*),csv_templates:angelcare_marketplace_schema_csv_templates(*)',
  ).order('segment_key').order('vertical_key').order('name_fr')
  if (error) {
    if (error.code === '42P01') return CATEGORY_NATIVE_SCHEMA_BLUEPRINTS.map(fallbackSchema)
    throw dbFailure('charger le registre des schémas', error)
  }
  return rows(data).map(mapSchema)
}

export async function getExperienceSchema(schemaKey: string): Promise<ExperienceSchemaRecord | null> {
  const key = assertCategoryNativeSchemaKey(schemaKey)
  const db = await createServiceClient()
  const { data, error } = await db.from(SCHEMA_TABLE).select(
    '*,fields:angelcare_marketplace_experience_schema_fields(*),variant_groups:angelcare_marketplace_experience_variant_groups(*),attribute_groups:angelcare_marketplace_experience_attribute_groups(*),csv_templates:angelcare_marketplace_schema_csv_templates(*)',
  ).eq('schema_key', key).maybeSingle()
  if (error) {
    if (error.code === '42P01') {
      const blueprint = blueprintForSchema(key)
      return blueprint ? fallbackSchema(blueprint) : null
    }
    throw dbFailure('charger le schéma', error)
  }
  return data ? mapSchema(data as Row) : null
}

export async function listHomepageBlocks(): Promise<HomepageBlockRecord[]> {
  const db = await createServiceClient()
  const { data, error } = await db.from(BLOCK_TABLE).select('*').eq('status', 'active').order('category_family').order('name_fr')
  if (error) {
    if (error.code === '42P01') return CATEGORY_NATIVE_HOMEPAGE_BLOCKS.map((block) => ({ ...block, id: `blueprint:${block.block_key}`, status: 'active' }))
    throw dbFailure('charger la bibliothèque de blocs', error)
  }
  return rows(data).map(mapBlock)
}

export async function listCategoryNativeImports(limit = 50): Promise<CategoryNativeImportJob[]> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_category_native_import_jobs_v').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) {
    if (error.code === '42P01') return []
    throw dbFailure('charger l’historique des imports', error)
  }
  return rows(data).map(mapImportJob)
}

export async function categoryNativeSummary(schemas?: ExperienceSchemaRecord[]): Promise<CategoryNativeSummary> {
  const current = schemas || await listExperienceSchemas()
  const imports = await listCategoryNativeImports(100)
  const blocks = await listHomepageBlocks()
  const active = current.filter((schema) => schema.status === 'active')
  const segmentMap = new Map<string, number>()
  const verticalMap = new Map<string, number>()
  for (const schema of current) {
    segmentMap.set(schema.segment_key, (segmentMap.get(schema.segment_key) || 0) + 1)
    verticalMap.set(schema.vertical_key, (verticalMap.get(schema.vertical_key) || 0) + 1)
  }
  const csvCovered = current.filter((schema) => schema.csv_templates.length > 0 || schema.fields.some((field) => field.csv_enabled)).length
  const handoverCovered = current.filter((schema) => Boolean(schema.operations_handover_type)).length
  const blockCovered = current.filter((schema) => blocks.some((block) => block.compatible_archetypes.includes(schema.schema_key))).length
  const pct = (value: number) => current.length ? Math.round((value / current.length) * 100) : 0
  return {
    activeSchemas: active.length,
    totalFields: current.reduce((total, schema) => total + schema.fields.length, 0),
    csvTemplates: current.reduce((total, schema) => total + Math.max(schema.csv_templates.length, 1), 0),
    homepageBlocks: blocks.length,
    activeImports: imports.filter((job) => ['uploaded', 'validating', 'validated', 'importing', 'partial'].includes(job.status)).length,
    failedImportRows: imports.reduce((total, job) => total + job.failed_rows + job.invalid_rows, 0),
    segments: [...segmentMap.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    verticals: [...verticalMap.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    readiness: {
      schemaCoverage: pct(active.length), csvCoverage: pct(csvCovered), homepageBlockCoverage: pct(blockCovered),
      operationalHandoverCoverage: pct(handoverCovered),
    },
  }
}

export async function categoryNativeStudioData(): Promise<CategoryNativeStudioData> {
  const schemas = await listExperienceSchemas()
  const [homepageBlocks, imports, summary] = await Promise.all([
    listHomepageBlocks(), listCategoryNativeImports(), categoryNativeSummary(schemas),
  ])
  return { summary, schemas, homepageBlocks, imports }
}

async function schemaVersion(schema: ExperienceSchemaRecord, action: string, actorId: string): Promise<void> {
  const db = await createServiceClient()
  const { error } = await db.from(VERSION_TABLE).insert({
    schema_id: schema.id, version_number: schema.version, action,
    snapshot: schema, created_by: actorId,
  })
  if (error) throw dbFailure('enregistrer la version du schéma', error)
}

export async function saveExperienceSchema(
  payload: Row,
  context: MarketplaceRequestContext,
): Promise<ExperienceSchemaRecord> {
  const schemaKey = assertCategoryNativeSchemaKey(payload.schema_key)
  const existing = await getExperienceSchema(schemaKey)
  const db = await createServiceClient()
  const row = {
    schema_key: schemaKey,
    version: Math.max(1, Number(payload.version || existing?.version || 1)),
    segment_key: categoryNativeText(payload.segment_key || existing?.segment_key),
    vertical_key: categoryNativeText(payload.vertical_key || existing?.vertical_key),
    category_key: categoryNativeText(payload.category_key || existing?.category_key),
    subcategory_key: categoryNativeText(payload.subcategory_key || existing?.subcategory_key),
    archetype_key: categoryNativeText(payload.archetype_key || schemaKey),
    parent_schema_key: categoryNativeOptionalText(payload.parent_schema_key ?? existing?.parent_schema_key),
    name_fr: categoryNativeText(payload.name_fr || existing?.name_fr),
    name_en: categoryNativeText(payload.name_en || existing?.name_en),
    name_ar: categoryNativeText(payload.name_ar || existing?.name_ar),
    description_fr: categoryNativeText(payload.description_fr || existing?.description_fr, 10000),
    description_en: categoryNativeOptionalText(payload.description_en ?? existing?.description_en, 10000),
    description_ar: categoryNativeOptionalText(payload.description_ar ?? existing?.description_ar, 10000),
    admin_studio_template: categoryNativeText(payload.admin_studio_template || existing?.admin_studio_template),
    public_experience_template: categoryNativeText(payload.public_experience_template || existing?.public_experience_template),
    conversion_template: categoryNativeText(payload.conversion_template || existing?.conversion_template),
    operations_handover_type: categoryNativeText(payload.operations_handover_type || existing?.operations_handover_type),
    homepage_card_template: categoryNativeText(payload.homepage_card_template || existing?.homepage_card_template),
    availability_authority: categoryNativeText(payload.availability_authority || existing?.availability_authority),
    pricing_modes: categoryNativeList(payload.pricing_modes || existing?.pricing_modes),
    media_requirements: categoryNativeObject(payload.media_requirements || existing?.media_requirements),
    search_filters: categoryNativeList(payload.search_filters || existing?.search_filters),
    comparison_fields: categoryNativeList(payload.comparison_fields || existing?.comparison_fields),
    analytics_dimensions: categoryNativeList(payload.analytics_dimensions || existing?.analytics_dimensions),
    configuration: categoryNativeObject(payload.configuration || existing?.configuration),
    status: categoryNativeText(payload.status || existing?.status || 'active'),
    updated_by: context.actor.id,
    updated_at: new Date().toISOString(),
    ...(existing && !existing.id.startsWith('blueprint:') ? {} : { created_by: context.actor.id }),
  }
  if (!row.segment_key || !row.vertical_key || !row.category_key || !row.name_fr) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Segment, vertical, catégorie et nom FR sont requis.')
  }
  const { data, error } = await db.from(SCHEMA_TABLE).upsert(row, { onConflict: 'schema_key' }).select('*').single()
  if (error || !data) throw dbFailure('enregistrer le schéma', error)
  const result = await getExperienceSchema(schemaKey)
  if (!result) throw new MarketplaceError('INTERNAL_ERROR', 'Schéma enregistré mais introuvable.')
  await schemaVersion(result, existing ? 'updated' : 'created', context.actor.id)
  return result
}

export async function saveSchemaField(
  schemaKey: string,
  payload: Row,
  context: MarketplaceRequestContext,
): Promise<ExperienceSchemaFieldRecord> {
  const schema = await getExperienceSchema(schemaKey)
  if (!schema || schema.id.startsWith('blueprint:')) {
    throw new MarketplaceError('CONFIGURATION_ERROR', 'Appliquez la migration avant de modifier les champs persistants.')
  }
  const fieldKey = assertCategoryNativeSchemaKey(payload.field_key)
  const db = await createServiceClient()
  const row = {
    schema_id: schema.id, field_key: fieldKey, section_key: categoryNativeText(payload.section_key || 'content'),
    label_fr: categoryNativeText(payload.label_fr), label_en: categoryNativeText(payload.label_en), label_ar: categoryNativeText(payload.label_ar),
    help_fr: categoryNativeOptionalText(payload.help_fr), help_en: categoryNativeOptionalText(payload.help_en), help_ar: categoryNativeOptionalText(payload.help_ar),
    field_type: categoryNativeText(payload.field_type || 'text'), required: categoryNativeBoolean(payload.required) === true,
    conditional_rule: categoryNativeObject(payload.conditional_rule), default_value: payload.default_value ?? null,
    validation: categoryNativeObject(payload.validation), allowed_values: categoryNativeList(payload.allowed_values),
    admin_visible: categoryNativeBoolean(payload.admin_visible) !== false, csv_enabled: categoryNativeBoolean(payload.csv_enabled) !== false,
    public_visible: categoryNativeBoolean(payload.public_visible) !== false, filter_enabled: categoryNativeBoolean(payload.filter_enabled) === true,
    comparison_enabled: categoryNativeBoolean(payload.comparison_enabled) === true,
    operations_visible: categoryNativeBoolean(payload.operations_visible) !== false,
    sort_order: Number(payload.sort_order || schema.fields.length * 10), status: categoryNativeText(payload.status || 'active'),
    updated_by: context.actor.id, updated_at: new Date().toISOString(), created_by: context.actor.id,
  }
  if (!row.label_fr || !row.label_en || !row.label_ar) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Les libellés FR, EN et AR sont requis.')
  }
  const { data, error } = await db.from(FIELD_TABLE).upsert(row, { onConflict: 'schema_id,field_key' }).select('*').single()
  if (error || !data) throw dbFailure('enregistrer le champ', error)
  const updatedSchema = await getExperienceSchema(schemaKey)
  if (updatedSchema) await schemaVersion(updatedSchema, `field.${fieldKey}.saved`, context.actor.id)
  return mapField(data as Row)
}

export async function reorderSchemaFields(
  schemaKey: string,
  orderedIds: string[],
  context: MarketplaceRequestContext,
): Promise<ExperienceSchemaRecord> {
  const schema = await getExperienceSchema(schemaKey)
  if (!schema || schema.id.startsWith('blueprint:')) throw new MarketplaceError('CONFIGURATION_ERROR', 'Schéma non persistant.')
  const db = await createServiceClient()
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await db.from(FIELD_TABLE).update({
      sort_order: index * 10, updated_by: context.actor.id, updated_at: new Date().toISOString(),
    }).eq('schema_id', schema.id).eq('id', id)
    if (error) throw dbFailure('réordonner les champs', error)
  }
  const result = await getExperienceSchema(schemaKey)
  if (!result) throw new MarketplaceError('INTERNAL_ERROR', 'Schéma introuvable après réordonnancement.')
  await schemaVersion(result, 'fields.reordered', context.actor.id)
  return result
}

export async function schemaAction(
  schemaKey: string,
  action: 'publish' | 'pause' | 'duplicate' | 'restore',
  payload: Row,
  context: MarketplaceRequestContext,
): Promise<ExperienceSchemaRecord> {
  const schema = await getExperienceSchema(schemaKey)
  if (!schema || schema.id.startsWith('blueprint:')) throw new MarketplaceError('CONFIGURATION_ERROR', 'Schéma non persistant.')
  const db = await createServiceClient()
  if (action === 'duplicate') {
    const requestedKey = assertCategoryNativeSchemaKey(payload.schema_key || `${schema.schema_key}-copy-${Date.now()}`)
    const copy = await saveExperienceSchema({
      ...schema, schema_key: requestedKey, name_fr: `${schema.name_fr} — copie`, status: 'draft', version: 1,
    }, context)
    for (const field of schema.fields) {
      await saveSchemaField(copy.schema_key, { ...field, id: undefined, schema_id: undefined }, context)
    }
    return (await getExperienceSchema(copy.schema_key)) || copy
  }
  if (action === 'restore') {
    const version = Number(payload.version_number || 0)
    const { data, error } = await db.from(VERSION_TABLE).select('*').eq('schema_id', schema.id).eq('version_number', version).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error || !data) throw dbFailure('charger la version du schéma', error)
    const snapshot = object((data as Row).snapshot)
    return saveExperienceSchema({ ...snapshot, schema_key: schema.schema_key }, context)
  }
  const status = action === 'publish' ? 'active' : 'paused'
  const { error } = await db.from(SCHEMA_TABLE).update({
    status, published_at: action === 'publish' ? new Date().toISOString() : schema.published_at,
    updated_by: context.actor.id, updated_at: new Date().toISOString(), version: schema.version + 1,
  }).eq('id', schema.id)
  if (error) throw dbFailure(`${action} le schéma`, error)
  const result = await getExperienceSchema(schemaKey)
  if (!result) throw new MarketplaceError('INTERNAL_ERROR', 'Schéma introuvable après action.')
  await schemaVersion(result, action, context.actor.id)
  return result
}

export async function createImportPreview(input: {
  schemaKey: string
  sourceFileName: string
  source: string
  mode: CategoryNativeImportJob['mode']
  context: MarketplaceRequestContext
}): Promise<CategoryNativeImportJob> {
  const schema = await getExperienceSchema(input.schemaKey)
  if (!schema || schema.id.startsWith('blueprint:')) {
    throw new MarketplaceError('CONFIGURATION_ERROR', 'Le schéma doit être persistant avant import.')
  }
  const blueprint = schemaRecordAsBlueprint(schema)
  const sourceRows = parseCategoryNativeCsv(input.source)
  if (!sourceRows.length) throw new MarketplaceError('VALIDATION_ERROR', 'Le CSV ne contient aucune ligne de données.')
  if (sourceRows.length > 10000) throw new MarketplaceError('VALIDATION_ERROR', 'Un import est limité à 10 000 lignes.')
  const validated = sourceRows.map((row, index) => validateCategoryNativeRow(blueprint, row, index + 2))
  const db = await createServiceClient()
  const validRows = validated.filter((row) => row.valid).length
  const invalidRows = validated.length - validRows
  const { data: job, error: jobError } = await db.from(IMPORT_JOB_TABLE).insert({
    schema_id: schema.id, source_file_name: input.sourceFileName, template_version: schema.version,
    mode: input.mode, status: invalidRows ? 'validated' : 'validated', total_rows: validated.length,
    valid_rows: validRows, invalid_rows: invalidRows, error_summary: {
      blocking: invalidRows, warnings: validated.reduce((total, row) => total + row.warnings.length, 0),
    }, created_by: input.context.actor.id, validated_at: new Date().toISOString(),
  }).select('*').single()
  if (jobError || !job) throw dbFailure('créer le job d’import', jobError)
  const rowPayloads = validated.map((result) => ({
    job_id: String((job as Row).id), row_number: result.rowNumber, identity_key: result.identityKey,
    payload: sourceRows[result.rowNumber - 2], normalized_payload: result.normalized,
    status: result.valid ? 'valid' : 'invalid', errors: result.errors, warnings: result.warnings,
  }))
  const { error: rowsError } = await db.from(IMPORT_ROW_TABLE).insert(rowPayloads)
  if (rowsError) throw dbFailure('enregistrer les lignes d’import', rowsError)
  return (await getImportJob(String((job as Row).id))) as CategoryNativeImportJob
}

export async function getImportJob(jobId: string): Promise<CategoryNativeImportJob | null> {
  const db = await createServiceClient()
  const { data, error } = await db.from(IMPORT_JOB_TABLE).select('*,rows:angelcare_marketplace_category_native_import_rows(*)').eq('id', jobId).maybeSingle()
  if (error) throw dbFailure('charger le job d’import', error)
  if (!data) return null
  const mapped = mapImportJob(data as Row)
  const schema = await getExperienceSchemaById(mapped.schema_id)
  return { ...mapped, schema_key: schema?.schema_key, schema_name_fr: schema?.name_fr }
}

async function getExperienceSchemaById(schemaId: string): Promise<ExperienceSchemaRecord | null> {
  const db = await createServiceClient()
  const { data, error } = await db.from(SCHEMA_TABLE).select(
    '*,fields:angelcare_marketplace_experience_schema_fields(*),variant_groups:angelcare_marketplace_experience_variant_groups(*),attribute_groups:angelcare_marketplace_experience_attribute_groups(*),csv_templates:angelcare_marketplace_schema_csv_templates(*)',
  ).eq('id', schemaId).maybeSingle()
  if (error) throw dbFailure('charger le schéma', error)
  return data ? mapSchema(data as Row) : null
}

function canonicalPriceMode(value: string): string {
  if (value === 'quote_only' || value === 'subscription' || value === 'fixed' || value === 'starting_from') return value
  if (value === 'free') return 'fixed'
  return 'starting_from'
}

function canonicalCatalogPayload(
  schema: ExperienceSchemaRecord,
  normalized: Record<string, unknown>,
  actorId: string,
  importJobId: string,
): Row {
  const identityField = text(schema.configuration.identity_field)
  const identity = categoryNativeText(normalized[identityField])
  const actualPricingModel = categoryNativeText(normalized.price_mode || normalized.pricing_mode || 'quote_only')
  const amount = categoryNativeNumber(
    normalized.price_amount ?? normalized.starting_price_dh ?? normalized.recurring_fee_dh,
  )
  const status = categoryNativeText(normalized.status || 'draft')
  const stock = categoryNativeNumber(normalized.stock_quantity)
  const canonicalKeys = new Set([
    'template_version','schema_key',identityField,'item_key','service_key','programme_key','solution_key','sku',
    'name_fr','name_en','name_ar','short_description_fr','short_description_en','short_description_ar',
    'description_fr','description_en','description_ar','price_mode','pricing_mode','price_amount','starting_price_dh',
    'recurring_fee_dh','currency_label','status','featured','popular','best_pick','territory_codes','category_keys',
    'primary_image_reference','gallery_references','stock_quantity',
  ])
  const attributes = Object.fromEntries(Object.entries(normalized).filter(([key]) => !canonicalKeys.has(key)))
  return {
    item_key: identity,
    sku: categoryNativeOptionalText(normalized.sku),
    slug: slugify(categoryNativeText(normalized.slug || normalized.name_fr || identity)),
    kind: categoryNativeText(schema.configuration.catalog_kind || 'service'),
    sellable_type: categoryNativeText(schema.configuration.sellable_type || schema.archetype_key),
    name_fr: categoryNativeText(normalized.name_fr), name_en: categoryNativeOptionalText(normalized.name_en),
    name_ar: categoryNativeOptionalText(normalized.name_ar), short_description_fr: categoryNativeOptionalText(normalized.short_description_fr),
    short_description_en: categoryNativeOptionalText(normalized.short_description_en), short_description_ar: categoryNativeOptionalText(normalized.short_description_ar),
    description_fr: categoryNativeOptionalText(normalized.description_fr), description_en: categoryNativeOptionalText(normalized.description_en),
    description_ar: categoryNativeOptionalText(normalized.description_ar), currency_label: categoryNativeText(normalized.currency_label || 'Dh'),
    price_mode: canonicalPriceMode(actualPricingModel), price_amount: actualPricingModel === 'free' ? 0 : amount,
    featured: categoryNativeBoolean(normalized.featured) === true,
    availability_status: schema.availability_authority === 'inventory'
      ? (stock !== null && stock > 0 ? 'available' : 'out_of_stock')
      : 'configuration_required',
    commercial_metadata: {
      experience_schema_key: schema.schema_key, experience_schema_version: schema.version,
      segment_key: schema.segment_key, vertical_key: schema.vertical_key, category_key: schema.category_key,
      subcategory_key: schema.subcategory_key, pricing_model: actualPricingModel, import_job_id: importJobId,
    },
    seo_metadata: {}, attributes,
    experience_schema_key: schema.schema_key, experience_schema_version: schema.version,
    experience_configuration: normalized,
    status: ['published','paused','archived'].includes(status) ? status : 'draft',
    updated_by: actorId, updated_at: new Date().toISOString(),
  }
}

async function fullCatalogSnapshot(itemId: string): Promise<Row> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_catalog_items').select(
    '*,variants:angelcare_marketplace_catalog_variants(*),media:angelcare_marketplace_catalog_item_media(*),availability:angelcare_marketplace_catalog_availability(*),categories:angelcare_marketplace_catalog_item_categories(*)',
  ).eq('id', itemId).maybeSingle()
  if (error) throw dbFailure('capturer le produit avant import', error)
  return data ? data as Row : {}
}

function cartesianVariantRows(schema: ExperienceSchemaRecord, normalized: Row): Array<{ key: string; label: string; options: Row }> {
  const groups = schema.variant_groups
    .map((group) => ({ group, values: categoryNativeList(normalized[group.group_key]) }))
    .filter((entry) => entry.values.length)
  if (!groups.length) return []
  let combinations: Row[] = [{}]
  for (const entry of groups) {
    combinations = combinations.flatMap((base) => entry.values.map((value) => ({ ...base, [entry.group.group_key]: value })))
    if (combinations.length > 200) {
      throw new MarketplaceError('VALIDATION_ERROR', 'La combinaison de variantes dépasse 200 variantes pour une ligne.')
    }
  }
  return combinations.map((options) => {
    const label = Object.values(options).map(String).join(' · ')
    return { key: slugify(label), label, options }
  })
}

async function applyMediaReferences(itemId: string, normalized: Row, actorId: string): Promise<void> {
  const db = await createServiceClient()
  const references = [categoryNativeText(normalized.primary_image_reference), ...categoryNativeList(normalized.gallery_references)].filter(Boolean)
  if (!references.length) return
  const assetKeys = references.filter((entry) => !/^https?:\/\//.test(entry))
  const { data: assets, error } = assetKeys.length
    ? await db.from('angelcare_marketplace_media_assets').select('*').in('asset_key', assetKeys)
    : { data: [], error: null }
  if (error) throw dbFailure('résoudre les médias importés', error)
  const byKey = new Map(rows(assets).map((asset) => [text(asset.asset_key), asset]))
  for (const [index, reference] of references.entries()) {
    const asset = byKey.get(reference)
    const url = /^https?:\/\//.test(reference) ? reference : text(asset?.desktop_url || asset?.public_url)
    if (!url) continue
    const mediaKey = index === 0 ? 'primary' : `gallery-${index}`
    const { error: upsertError } = await db.from('angelcare_marketplace_catalog_item_media').upsert({
      catalog_item_id: itemId, media_key: mediaKey, media_type: 'image', asset_url: url,
      alt_text_fr: text(asset?.alt_text_fr) || 'Visuel produit ANGELCARE', alt_text_en: nullableText(asset?.alt_text_en),
      alt_text_ar: nullableText(asset?.alt_text_ar), sort_order: index * 10, status: 'active', updated_by: actorId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'catalog_item_id,media_key' })
    if (upsertError) throw dbFailure('assigner les médias importés', upsertError)
  }
}

async function applyCategories(itemId: string, normalized: Row): Promise<void> {
  const keys = categoryNativeList(normalized.category_keys)
  if (!keys.length) return
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_catalog_categories').select('id,category_key').in('category_key', keys).eq('locale', 'fr')
  if (error) throw dbFailure('résoudre les catégories', error)
  const categoryRows = rows(data)
  for (const [index, category] of categoryRows.entries()) {
    const { error: assignmentError } = await db.from('angelcare_marketplace_catalog_item_categories').upsert({
      catalog_item_id: itemId, category_id: text(category.id), is_primary: index === 0, sort_order: index * 10,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'catalog_item_id,category_id' })
    if (assignmentError) throw dbFailure('assigner les catégories', assignmentError)
  }
}

async function applyVariants(itemId: string, schema: ExperienceSchemaRecord, normalized: Row, actorId: string): Promise<void> {
  const variants = cartesianVariantRows(schema, normalized)
  if (!variants.length) return
  const db = await createServiceClient()
  for (const [index, variant] of variants.entries()) {
    const { error } = await db.from('angelcare_marketplace_catalog_variants').upsert({
      catalog_item_id: itemId, variant_key: variant.key, name_fr: variant.label,
      option_values: variant.options, configuration: variant.options, available: true,
      status: 'active', sort_order: index * 10, updated_by: actorId, updated_at: new Date().toISOString(),
    }, { onConflict: 'catalog_item_id,variant_key' })
    if (error) throw dbFailure('créer les variantes importées', error)
  }
}

async function applyAvailability(itemId: string, schema: ExperienceSchemaRecord, normalized: Row, actorId: string): Promise<void> {
  const territoryCodes = categoryNativeList(normalized.territory_codes)
  if (!territoryCodes.length) return
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_territories').select('id,territory_code').in('territory_code', territoryCodes)
  if (error) throw dbFailure('résoudre les territoires', error)
  const capacity = categoryNativeNumber(normalized.stock_quantity ?? normalized.capacity ?? normalized.seat_capacity ?? normalized.children_capacity)
  for (const territory of rows(data)) {
    const { error: availabilityError } = await db.from('angelcare_marketplace_catalog_availability').upsert({
      catalog_item_id: itemId, territory_id: text(territory.id), city_zone_id: null, audience: 'all',
      available: schema.availability_authority === 'inventory' ? (capacity !== null && capacity > 0) : true,
      capacity_limit: capacity === null ? null : Math.max(0, Math.trunc(capacity)), reason: `Import ${schema.schema_key}`,
      updated_by: actorId, updated_at: new Date().toISOString(),
    }, { onConflict: 'catalog_item_id,territory_id,city_zone_id,audience' })
    if (availabilityError) throw dbFailure('configurer la disponibilité', availabilityError)
  }
}

async function applyMerchandising(itemId: string, normalized: Row, actorId: string): Promise<void> {
  const badges = [
    ['popular', categoryNativeBoolean(normalized.popular) === true],
    ['best-pick', categoryNativeBoolean(normalized.best_pick) === true],
  ] as const
  const db = await createServiceClient()
  for (const [badge, active] of badges) {
    if (!active) continue
    const { error } = await db.from('angelcare_marketplace_homepage_placements').upsert({
      placement_key: `${badge}-${itemId}`, catalog_item_id: itemId, locale: 'fr', audience: 'all',
      merchandising_badge: badge, priority: 100, sort_order: 100, starts_at: new Date().toISOString(),
      status: 'active', updated_by: actorId,
    }, { onConflict: 'placement_key,locale,territory_id' })
    if (error) throw dbFailure('appliquer le merchandising', error)
  }
}

export async function executeImportJob(jobId: string, context: MarketplaceRequestContext): Promise<CategoryNativeImportJob> {
  const job = await getImportJob(jobId)
  if (!job) throw new MarketplaceError('NOT_FOUND', 'Job d’import introuvable.')
  if (!['validated','partial','failed'].includes(job.status)) {
    throw new MarketplaceError('INVALID_STATE_TRANSITION', 'Ce job ne peut pas être exécuté dans son état actuel.')
  }
  if (job.mode === 'dry_run') {
    throw new MarketplaceError('INVALID_STATE_TRANSITION', 'Ce job est en validation uniquement. Créez un job create, update ou upsert pour exécuter.')
  }
  const schema = await getExperienceSchemaById(job.schema_id)
  if (!schema) throw new MarketplaceError('NOT_FOUND', 'Schéma du job introuvable.')
  const db = await createServiceClient()
  await db.from(IMPORT_JOB_TABLE).update({ status: 'importing' }).eq('id', job.id)
  let imported = 0
  let updated = 0
  let failed = 0
  for (const row of job.rows || []) {
    if (row.status !== 'valid' && row.status !== 'failed') continue
    try {
      const normalized = row.normalized_payload
      const identityField = text(schema.configuration.identity_field)
      const identity = categoryNativeText(normalized[identityField])
      const { data: existing, error: existingError } = await db.from('angelcare_marketplace_catalog_items').select('id').eq('item_key', identity).maybeSingle()
      if (existingError) throw dbFailure('rechercher le produit existant', existingError)
      if (job.mode === 'create' && existing) throw new MarketplaceError('CONFLICT', `L’objet ${identity} existe déjà.`)
      if (job.mode === 'update' && !existing) throw new MarketplaceError('NOT_FOUND', `L’objet ${identity} n’existe pas pour mise à jour.`)
      const before = existing ? await fullCatalogSnapshot(text((existing as Row).id)) : null
      const payload = canonicalCatalogPayload(schema, normalized, context.actor.id, job.id)
      const { data: catalogItem, error: upsertError } = await db.from('angelcare_marketplace_catalog_items').upsert({
        ...payload, ...(existing ? {} : { created_by: context.actor.id }),
      }, { onConflict: 'item_key' }).select('*').single()
      if (upsertError || !catalogItem) throw dbFailure('importer l’objet commercial', upsertError)
      const itemId = text((catalogItem as Row).id)
      await applyMediaReferences(itemId, normalized, context.actor.id)
      await applyCategories(itemId, normalized)
      await applyVariants(itemId, schema, normalized, context.actor.id)
      await applyAvailability(itemId, schema, normalized, context.actor.id)
      await applyMerchandising(itemId, normalized, context.actor.id)
      await db.from(IMPORT_ROW_TABLE).update({
        before_snapshot: before, target_item_id: itemId, status: existing ? 'updated' : 'imported',
        errors: [], updated_at: new Date().toISOString(),
      }).eq('id', row.id)
      if (existing) updated += 1
      else imported += 1
    } catch (error) {
      failed += 1
      await db.from(IMPORT_ROW_TABLE).update({
        status: 'failed', errors: [error instanceof Error ? error.message : 'Erreur inconnue'], updated_at: new Date().toISOString(),
      }).eq('id', row.id)
    }
  }
  const status = failed ? (imported + updated ? 'partial' : 'failed') : 'completed'
  const { error: jobError } = await db.from(IMPORT_JOB_TABLE).update({
    status, imported_rows: imported, updated_rows: updated, failed_rows: failed,
    executed_at: new Date().toISOString(), error_summary: { failed },
  }).eq('id', job.id)
  if (jobError) throw dbFailure('finaliser le job d’import', jobError)
  refreshCommerceSurfaces([
    '/angelcare-marketplace/fr', '/angelcare-marketplace/en', '/angelcare-marketplace/ar',
    '/angelcare-marketplace/fr/marketplace', '/angelcare-marketplace/en/marketplace', '/angelcare-marketplace/ar/marketplace',
  ])
  return (await getImportJob(job.id)) as CategoryNativeImportJob
}

export async function rollbackImportJob(jobId: string, context: MarketplaceRequestContext): Promise<CategoryNativeImportJob> {
  const job = await getImportJob(jobId)
  if (!job) throw new MarketplaceError('NOT_FOUND', 'Job d’import introuvable.')
  if (!['completed','partial','failed'].includes(job.status)) {
    throw new MarketplaceError('INVALID_STATE_TRANSITION', 'Ce job ne peut pas être restauré.')
  }
  const db = await createServiceClient()
  for (const row of job.rows || []) {
    if (!row.target_item_id || !['imported','updated','failed'].includes(row.status)) continue
    if (row.before_snapshot && Object.keys(row.before_snapshot).length) {
      const before = { ...row.before_snapshot }
      const variants = rows(before.variants)
      const media = rows(before.media)
      const availability = rows(before.availability)
      const categories = rows(before.categories)
      delete before.variants; delete before.media; delete before.availability; delete before.categories
      delete before.created_at; delete before.updated_at
      const itemId = row.target_item_id
      const { error } = await db.from('angelcare_marketplace_catalog_items').update({
        ...before, updated_by: context.actor.id, updated_at: new Date().toISOString(),
      }).eq('id', itemId)
      if (error) throw dbFailure('restaurer le produit', error)
      await db.from('angelcare_marketplace_catalog_variants').delete().eq('catalog_item_id', itemId)
      await db.from('angelcare_marketplace_catalog_item_media').delete().eq('catalog_item_id', itemId)
      await db.from('angelcare_marketplace_catalog_availability').delete().eq('catalog_item_id', itemId)
      await db.from('angelcare_marketplace_catalog_item_categories').delete().eq('catalog_item_id', itemId)
      if (variants.length) await db.from('angelcare_marketplace_catalog_variants').insert(variants.map((entry) => ({ ...entry, catalog_item_id: itemId })))
      if (media.length) await db.from('angelcare_marketplace_catalog_item_media').insert(media.map((entry) => ({ ...entry, catalog_item_id: itemId })))
      if (availability.length) await db.from('angelcare_marketplace_catalog_availability').insert(availability.map((entry) => ({ ...entry, catalog_item_id: itemId })))
      if (categories.length) await db.from('angelcare_marketplace_catalog_item_categories').insert(categories.map((entry) => ({ ...entry, catalog_item_id: itemId })))
    } else {
      const { error } = await db.from('angelcare_marketplace_catalog_items').update({
        status: 'archived', updated_by: context.actor.id, updated_at: new Date().toISOString(),
      }).eq('id', row.target_item_id)
      if (error) throw dbFailure('archiver l’objet créé par import', error)
    }
    await db.from(IMPORT_ROW_TABLE).update({ status: 'rolled_back', updated_at: new Date().toISOString() }).eq('id', row.id)
  }
  const { error } = await db.from(IMPORT_JOB_TABLE).update({
    status: 'rolled_back', rolled_back_at: new Date().toISOString(), rollback_actor_id: context.actor.id,
  }).eq('id', job.id)
  if (error) throw dbFailure('finaliser le rollback', error)
  refreshCommerceSurfaces(['/angelcare-marketplace/fr','/angelcare-marketplace/en','/angelcare-marketplace/ar'])
  return (await getImportJob(job.id)) as CategoryNativeImportJob
}

export function validateRowsInMemory(
  schema: ExperienceSchemaRecord,
  source: string,
): RowValidationResult[] {
  const blueprint = schemaRecordAsBlueprint(schema)
  return parseCategoryNativeCsv(source).map((row, index) => validateCategoryNativeRow(blueprint, row, index + 2))
}
