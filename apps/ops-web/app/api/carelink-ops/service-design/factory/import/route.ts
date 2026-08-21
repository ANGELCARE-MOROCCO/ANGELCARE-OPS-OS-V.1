import { governRoute } from '@/lib/runtime/governor/route'
import { apiError, apiOk, jsonBody } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { HSD_TENANT_ID } from '@/lib/homeservice-design/constants'
import { createClient } from '@/lib/supabase/server'
import { applyDirectImport } from '@/lib/homeservice-factory/server/importer'

export const maxDuration = 120

const EXPERIENCE_TYPES = new Set([
  'experience_blueprints',
  'experience_sections',
  'experience_fields',
  'experience_options',
  'experience_presets',
])

type CsvRow = Record<string, string>
type ImportMode = 'update_existing' | 'create_version' | 'replace_draft'
type ImportBody = {
  importType?: string
  categoryId?: string | null
  fileName?: string
  content?: string
  importMode?: ImportMode
  targetVersion?: number | null
}

function businessError(message: string, code: string, details?: unknown, status = 422) {
  return Object.assign(new Error(message), { status, code, details })
}

function parseCsv(content: string): { headers: string[]; rows: CsvRow[] } {
  const source = String(content || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const logicalRows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]
    if (char === '"' && quoted && next === '"') { field += '"'; index += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (char === ',' && !quoted) { row.push(field); field = ''; continue }
    if (char === '\n' && !quoted) {
      row.push(field); field = ''
      if (row.some((value) => value.trim())) logicalRows.push(row)
      row = []
      continue
    }
    field += char
  }
  row.push(field)
  if (row.some((value) => value.trim())) logicalRows.push(row)
  if (!logicalRows.length) throw businessError('Le fichier CSV est vide.', 'EMPTY_CSV')
  const headers = logicalRows[0].map((value) => value.trim().toLowerCase())
  if (!headers.length || headers.some((value) => !value)) throw businessError('Un ou plusieurs en-têtes CSV sont vides.', 'INVALID_HEADERS')
  if (new Set(headers).size !== headers.length) throw businessError('Le fichier contient des en-têtes CSV dupliqués.', 'DUPLICATE_HEADERS')
  const rows = logicalRows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? '').trim()])))
  return { headers, rows }
}

function required(row: CsvRow, field: string, rowNumber: number) {
  const value = String(row[field] || '').trim()
  if (!value) throw businessError(`Ligne ${rowNumber}: la colonne « ${field} » est obligatoire.`, 'MISSING_IMPORT_VALUE', { row: rowNumber, field })
  return value
}

function bool(value: string | undefined, fallback = false) {
  if (value == null || value === '') return fallback
  return /^(1|true|yes|oui|y)$/i.test(value)
}

function numberValue(value: string | undefined, fallback: number | null = null) {
  if (value == null || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw businessError(`La valeur numérique « ${value} » est invalide.`, 'INVALID_NUMBER')
  return parsed
}

function jsonValue(value: string | undefined, fallback: unknown = null) {
  if (value == null || value.trim() === '') return fallback
  try { return JSON.parse(value) } catch { throw businessError('Une valeur JSON du CSV est invalide.', 'INVALID_JSON_VALUE', { value: value.slice(0, 180) }) }
}

async function exactCategory(client: any, categoryId: string) {
  const query = client.from('hsd_service_categories').select('id,code,commercial_name_fr').eq('tenant_id', HSD_TENANT_ID)
  const { data, error } = await (categoryId.includes('-') ? query.eq('id', categoryId) : query.eq('code', categoryId)).limit(1).maybeSingle()
  if (error) throw businessError('La catégorie cible n’a pas pu être résolue.', 'CATEGORY_LOOKUP_FAILED', error.message, 500)
  if (!data) throw businessError('La catégorie cible est introuvable. Sélectionnez une catégorie synchronisée puis réessayez.', 'CATEGORY_NOT_FOUND')
  return data
}

async function activeBlueprint(client: any, categoryId: string, targetVersion?: number | null) {
  let query = client.from('hsd_category_experience_blueprints').select('*').eq('tenant_id', HSD_TENANT_ID).eq('category_id', categoryId)
  if (targetVersion) query = query.eq('version_number', targetVersion)
  else query = query.order('version_number', { ascending: false }).limit(1)
  const { data, error } = await query.maybeSingle()
  if (error) throw businessError('Le blueprint de la catégorie n’a pas pu être résolu.', 'BLUEPRINT_LOOKUP_FAILED', error.message, 500)
  if (!data) throw businessError('Aucun blueprint n’existe encore pour cette catégorie. Importez d’abord le fichier 12_experience_blueprint.', 'BLUEPRINT_REQUIRED')
  return data
}

async function upsertOrThrow(client: any, table: string, payload: Record<string, unknown>, conflict: string, message: string) {
  const { data, error } = await client.from(table).upsert(payload, { onConflict: conflict }).select('*').single()
  if (error) throw businessError(message, 'EXPERIENCE_UPSERT_FAILED', { table, cause: error.message, code: error.code })
  return data
}

async function applyExperienceImport(body: ImportBody) {
  const importType = String(body.importType || '')
  const categoryId = String(body.categoryId || '')
  const fileName = String(body.fileName || `${importType}.csv`)
  const mode: ImportMode = body.importMode || 'update_existing'
  if (!categoryId) throw businessError('Sélectionnez la catégorie cible avant l’import.', 'CATEGORY_REQUIRED')
  const { rows } = parseCsv(String(body.content || ''))
  if (!rows.length) throw businessError('Le CSV ne contient aucune ligne de données.', 'NO_DATA_ROWS')

  const client = await createClient() as any
  const category = await exactCategory(client, categoryId)
  const errors: Array<{ row: number; message: string }> = []
  const warnings: string[] = []
  let appliedRows = 0
  let blueprint: any = null

  if (importType !== 'experience_blueprints') blueprint = await activeBlueprint(client, category.id, body.targetVersion)

  for (let index = 0; index < rows.length; index += 1) {
    const csv = rows[index]
    const rowNumber = index + 2
    try {
      if (importType === 'experience_blueprints') {
        const versionFromCsv = numberValue(csv.version_number, 1) || 1
        let version = body.targetVersion || versionFromCsv
        let existingQuery = client.from('hsd_category_experience_blueprints').select('*').eq('tenant_id', HSD_TENANT_ID).eq('category_id', category.id).eq('version_number', version)
        let { data: existing, error: existingError } = await existingQuery.maybeSingle()
        if (existingError) throw businessError('Le blueprint existant n’a pas pu être vérifié.', 'BLUEPRINT_LOOKUP_FAILED', existingError.message, 500)
        if (mode === 'create_version') {
          const { data: latest, error: latestError } = await client.from('hsd_category_experience_blueprints').select('version_number').eq('tenant_id', HSD_TENANT_ID).eq('category_id', category.id).order('version_number', { ascending: false }).limit(1).maybeSingle()
          if (latestError) throw businessError('La prochaine version n’a pas pu être calculée.', 'VERSION_LOOKUP_FAILED', latestError.message, 500)
          version = Math.max(Number(latest?.version_number || 0) + 1, version)
          existing = null
        }
        if (mode === 'replace_draft' && existing && existing.status !== 'draft') throw businessError(`Ligne ${rowNumber}: seule une version brouillon peut être remplacée. Utilisez « Mettre à jour la version active ».`, 'REPLACE_NON_DRAFT')
        const baseCode = required(csv, 'code', rowNumber)
        const code = mode === 'create_version' ? `${baseCode.replace(/-V\d+$/i, '')}-V${version}` : baseCode
        blueprint = await upsertOrThrow(client, 'hsd_category_experience_blueprints', {
          tenant_id: HSD_TENANT_ID,
          category_id: category.id,
          code,
          concept: required(csv, 'concept', rowNumber),
          title_fr: required(csv, 'title_fr', rowNumber),
          subtitle_fr: csv.subtitle_fr || '',
          hero_statement_fr: csv.hero_statement_fr || '',
          accent: csv.accent || 'blue',
          icon: csv.icon || 'Sparkles',
          audience: csv.audience || 'both',
          version_number: version,
          zero_typing_promise_fr: csv.zero_typing_promise_fr || '',
          ai_composition_profile: jsonValue(csv.ai_composition_profile, {}),
          status: csv.status || existing?.status || 'active',
          updated_at: new Date().toISOString(),
        }, 'tenant_id,category_id,version_number', `Ligne ${rowNumber}: le blueprint ${code} n’a pas pu être appliqué.`)
      } else if (importType === 'experience_sections') {
        await upsertOrThrow(client, 'hsd_category_experience_sections', {
          tenant_id: HSD_TENANT_ID,
          blueprint_id: blueprint.id,
          code: required(csv, 'section_code', rowNumber),
          title_fr: required(csv, 'title_fr', rowNumber),
          description_fr: csv.description_fr || '',
          layout: csv.layout || 'cards',
          sort_order: numberValue(csv.sort_order, 100),
          status: csv.status || 'active',
        }, 'tenant_id,blueprint_id,code', `Ligne ${rowNumber}: la section ${csv.section_code || 'sans code'} n’a pas pu être appliquée.`)
      } else if (importType === 'experience_fields') {
        const sectionCode = required(csv, 'section_code', rowNumber)
        const { data: section, error: sectionError } = await client.from('hsd_category_experience_sections').select('id').eq('tenant_id', HSD_TENANT_ID).eq('blueprint_id', blueprint.id).eq('code', sectionCode).maybeSingle()
        if (sectionError) throw businessError(`Ligne ${rowNumber}: la section ${sectionCode} n’a pas pu être vérifiée.`, 'SECTION_LOOKUP_FAILED', sectionError.message, 500)
        if (!section) throw businessError(`Ligne ${rowNumber}: la section ${sectionCode} est introuvable. Importez d’abord le fichier 13_experience_sections.`, 'SECTION_REQUIRED', { row: rowNumber, sectionCode })
        await upsertOrThrow(client, 'hsd_category_experience_fields', {
          tenant_id: HSD_TENANT_ID,
          section_id: section.id,
          code: required(csv, 'field_code', rowNumber),
          label_fr: required(csv, 'label_fr', rowNumber),
          description_fr: csv.description_fr || '',
          field_type: required(csv, 'field_type', rowNumber),
          required: bool(csv.required),
          default_value: jsonValue(csv.default_value, null),
          min_value: numberValue(csv.min_value),
          max_value: numberValue(csv.max_value),
          unit: csv.unit || null,
          semantic: csv.semantic || null,
          sort_order: numberValue(csv.sort_order, 100),
          status: csv.status || 'active',
        }, 'tenant_id,section_id,code', `Ligne ${rowNumber}: le champ ${csv.field_code || 'sans code'} n’a pas pu être appliqué.`)
      } else if (importType === 'experience_options') {
        const sectionCode = required(csv, 'section_code', rowNumber)
        const fieldCode = required(csv, 'field_code', rowNumber)
        const { data: section } = await client.from('hsd_category_experience_sections').select('id').eq('tenant_id', HSD_TENANT_ID).eq('blueprint_id', blueprint.id).eq('code', sectionCode).maybeSingle()
        if (!section) throw businessError(`Ligne ${rowNumber}: la section ${sectionCode} est introuvable. Importez d’abord les sections.`, 'SECTION_REQUIRED')
        const { data: field, error: fieldError } = await client.from('hsd_category_experience_fields').select('id').eq('tenant_id', HSD_TENANT_ID).eq('section_id', section.id).eq('code', fieldCode).maybeSingle()
        if (fieldError) throw businessError(`Ligne ${rowNumber}: le champ ${fieldCode} n’a pas pu être vérifié.`, 'FIELD_LOOKUP_FAILED', fieldError.message, 500)
        if (!field) throw businessError(`Ligne ${rowNumber}: le champ ${fieldCode} est introuvable dans ${sectionCode}. Importez d’abord le fichier 14_experience_fields.`, 'FIELD_REQUIRED')
        await upsertOrThrow(client, 'hsd_category_experience_options', {
          tenant_id: HSD_TENANT_ID,
          field_id: field.id,
          code: required(csv, 'option_code', rowNumber),
          label_fr: required(csv, 'label_fr', rowNumber),
          description_fr: csv.description_fr || '',
          sort_order: numberValue(csv.sort_order, 100),
          status: csv.status || 'active',
        }, 'tenant_id,field_id,code', `Ligne ${rowNumber}: l’option ${csv.option_code || 'sans code'} n’a pas pu être appliquée.`)
      } else if (importType === 'experience_presets') {
        const values = jsonValue(csv.field_values, {}) as Record<string, unknown>
        const { data: sections, error: sectionError } = await client.from('hsd_category_experience_sections').select('id').eq('tenant_id', HSD_TENANT_ID).eq('blueprint_id', blueprint.id)
        if (sectionError) throw businessError(`Ligne ${rowNumber}: les sections du blueprint n’ont pas pu être chargées.`, 'SECTION_LOOKUP_FAILED', sectionError.message, 500)
        const sectionIds = (sections || []).map((item: any) => item.id)
        const { data: fields, error: fieldError } = sectionIds.length ? await client.from('hsd_category_experience_fields').select('id,code,field_type').eq('tenant_id', HSD_TENANT_ID).in('section_id', sectionIds) : { data: [], error: null }
        if (fieldError) throw businessError(`Ligne ${rowNumber}: les champs du blueprint n’ont pas pu être chargés.`, 'FIELD_LOOKUP_FAILED', fieldError.message, 500)
        const knownFields = new Set((fields || []).map((item: any) => String(item.code)))
        const unknownKeys = Object.keys(values || {}).filter((key) => !knownFields.has(key))
        if (unknownKeys.length) warnings.push(`Ligne ${rowNumber}: le preset ${csv.preset_code || ''} contient ${unknownKeys.length} clé(s) hors formulaire (${unknownKeys.slice(0, 5).join(', ')}). Elles sont conservées comme paramètres structurés.`)
        await upsertOrThrow(client, 'hsd_category_experience_presets', {
          tenant_id: HSD_TENANT_ID,
          blueprint_id: blueprint.id,
          code: required(csv, 'preset_code', rowNumber),
          name_fr: required(csv, 'name_fr', rowNumber),
          description_fr: csv.description_fr || '',
          badge_fr: csv.badge_fr || '',
          mode: required(csv, 'mode', rowNumber),
          universe: required(csv, 'universe', rowNumber),
          field_values: values,
          default_start_time: csv.default_start_time || '08:00',
          default_end_time: csv.default_end_time || '16:00',
          default_day_count: numberValue(csv.default_day_count, 1),
          scenario_count: numberValue(csv.scenario_count, 3),
          max_activities_per_day: numberValue(csv.max_activities_per_day, 6),
          max_options: numberValue(csv.max_options, 4),
          sort_order: numberValue(csv.sort_order, 100),
          status: csv.status || 'active',
          updated_at: new Date().toISOString(),
        }, 'tenant_id,blueprint_id,code', `Ligne ${rowNumber}: le scénario ${csv.preset_code || 'sans code'} n’a pas pu être appliqué.`)
      }
      appliedRows += 1
    } catch (error) {
      const object = error as { message?: string }
      errors.push({ row: rowNumber, message: object?.message || 'Erreur inconnue.' })
    }
  }

  return {
    batchId: crypto.randomUUID(),
    importType,
    fileName,
    categoryId: category.id,
    categoryCode: category.code,
    blueprintId: blueprint?.id || null,
    blueprintCode: blueprint?.code || null,
    blueprintVersion: blueprint?.version_number || null,
    totalRows: rows.length,
    appliedRows,
    rejectedRows: errors.length,
    warnings,
    errors,
  }
}

async function POST__angelcareGovernedImpl(request: Request) {
  try {
    const user = await requireHomeServiceApi(['homeservice_design.import_configuration', 'homeservice_design.admin'])
    const body = await jsonBody(request) as ImportBody
    if (EXPERIENCE_TYPES.has(String(body.importType || ''))) return apiOk(await applyExperienceImport(body), 201)
    return apiOk(await applyDirectImport(body, user), 201)
  } catch (error) { return apiError(error) }
}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/carelink-ops/service-design/factory/import',
  },
  POST__angelcareGovernedImpl,
)
