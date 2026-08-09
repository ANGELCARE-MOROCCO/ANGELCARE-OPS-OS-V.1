import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import type { HomeServiceUser } from '@/lib/homeservice-design/server/auth'
import { userId, userLabel } from '@/lib/homeservice-design/server/auth'
import type { DirectImportResult } from '@/types/homeservice-factory'
import { factoryDb } from './catalogue'

const TENANT = 'angelcare-main'
const truthy = new Set(['1', 'true', 'yes', 'oui', 'y', 'on'])
const falsey = new Set(['0', 'false', 'no', 'non', 'n', 'off'])
const list = (value: unknown) => String(value || '').split(/[|;,]/).map((item) => item.trim()).filter(Boolean)
const numberValue = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const booleanValue = (value: unknown, fallback = false) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (truthy.has(normalized)) return true
  if (falsey.has(normalized)) return false
  return fallback
}
const text = (row: Record<string, string>, ...keys: string[]) => {
  for (const key of keys) if (row[key] != null && row[key].trim() !== '') return row[key].trim()
  return ''
}

function parseCsv(content: string) {
  const delimiter = content.split(/\r?\n/, 1)[0]?.includes(';') && !content.split(/\r?\n/, 1)[0]?.includes(',') ? ';' : ','
  const rows: string[][] = []
  let row: string[] = [], field = '', quoted = false
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const next = content[index + 1]
    if (quoted) {
      if (char === '"' && next === '"') { field += '"'; index += 1 }
      else if (char === '"') quoted = false
      else field += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === delimiter) { row.push(field.trim()); field = '' }
    else if (char === '\n') { row.push(field.trim().replace(/\r$/, '')); if (row.some((cell) => cell !== '')) rows.push(row); row = []; field = '' }
    else field += char
  }
  row.push(field.trim().replace(/\r$/, ''))
  if (row.some((cell) => cell !== '')) rows.push(row)
  if (rows.length < 2) throw Object.assign(new Error('Le fichier doit contenir un en-tête et au moins une ligne.'), { status: 422 })
  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/\s+/g, '_'))
  return rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])))
}

async function resolveCategory(categoryCode?: string | null, categoryId?: string | null): Promise<{ id: string; code: string } | null> {
  const db = factoryDb()!
  let query = db.from('hsd_service_categories').select('id,code').eq('tenant_id', TENANT)
  if (categoryId) query = query.eq('id', categoryId)
  else if (categoryCode) query = query.eq('code', categoryCode)
  else return null
  const { data, error } = await query.single()
  if (error || !data) throw Object.assign(new Error(`Catégorie ${categoryCode || categoryId} introuvable.`), { status: 422 })
  return { id: String(data.id), code: String(data.code) }
}
async function resolveCategoryId(categoryCode?: string | null, categoryId?: string | null) {
  return (await resolveCategory(categoryCode, categoryId))?.id || null
}

async function upsertDoctrine(row: Record<string, string>, selectedCategoryId: string | null, user: HomeServiceUser) {
  const db = factoryDb()!
  const categoryId = await resolveCategoryId(text(row, 'category_code') || null, selectedCategoryId)
  if (!categoryId) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const code = text(row, 'code', 'rule_code')
  const title = text(row, 'title_fr', 'title', 'name_fr')
  const description = text(row, 'description_fr', 'description', 'rule_text')
  if (!code || !title || !description) throw new Error('code, title_fr et description_fr sont obligatoires.')
  const version = Math.max(1, Math.round(numberValue(text(row, 'version_number', 'version'), 1)))
  const payload = {
    tenant_id: TENANT, category_id: categoryId, code, kind: text(row, 'kind', 'rule_type') || 'recommended', severity: text(row, 'severity') || 'important',
    title_fr: title, description_fr: description, mandatory: booleanValue(text(row, 'mandatory'), true), blocking: booleanValue(text(row, 'blocking'), false),
    applicability: text(row, 'applicability_json') ? JSON.parse(text(row, 'applicability_json')) : { age_bands: list(text(row, 'age_bands')), contexts: list(text(row, 'contexts')), situations: list(text(row, 'situations')) },
    required_evidence: list(text(row, 'required_evidence')), escalation_route: text(row, 'escalation_route') || null, status: text(row, 'status') || 'draft', version_number: version,
    effective_from: text(row, 'effective_from') || null, effective_to: text(row, 'effective_to') || null, updated_by: userId(user), created_by: userId(user), updated_at: new Date().toISOString(),
  }
  const { error } = await db.from('hsd_doctrine_rules').upsert(payload, { onConflict: 'tenant_id,category_id,code,version_number' })
  if (error) throw error
}

async function upsertCapacity(row: Record<string, string>, selectedCategoryId: string | null, user: HomeServiceUser) {
  const db = factoryDb()!
  const categoryId = await resolveCategoryId(text(row, 'category_code') || null, selectedCategoryId)
  if (!categoryId) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const minimum = numberValue(text(row, 'minimum_hours', 'min_hours'), 1)
  const maximum = numberValue(text(row, 'maximum_hours', 'max_hours'), 12)
  if (maximum < minimum) throw new Error('maximum_hours doit être supérieur ou égal à minimum_hours.')
  const payload = {
    tenant_id: TENANT, category_id: categoryId, minimum_hours: minimum, maximum_hours: maximum,
    maximum_consecutive_days: Math.max(1, Math.round(numberValue(text(row, 'maximum_consecutive_days', 'max_consecutive_days'), 14))),
    maximum_non_consecutive_days: Math.max(1, Math.round(numberValue(text(row, 'maximum_non_consecutive_days', 'max_non_consecutive_days'), 60))),
    earliest_start_time: text(row, 'earliest_start_time', 'earliest_start') || '06:00', latest_end_time: text(row, 'latest_end_time', 'latest_end') || '23:00',
    max_beneficiaries_per_agent: Math.max(1, Math.round(numberValue(text(row, 'max_beneficiaries_per_agent'), 1))), minimum_agents: Math.max(1, Math.round(numberValue(text(row, 'minimum_agents'), 1))),
    backup_required: booleanValue(text(row, 'backup_required')), supervisor_required: booleanValue(text(row, 'supervisor_required')),
    lead_time_hours: Math.max(0, Math.round(numberValue(text(row, 'lead_time_hours'), 24))), night_allowed: booleanValue(text(row, 'night_allowed')),
    weekend_allowed: booleanValue(text(row, 'weekend_allowed'), true), holiday_allowed: booleanValue(text(row, 'holiday_allowed'), true),
    allowed_cities: list(text(row, 'allowed_cities', 'cities')), conditions: text(row, 'conditions_json') ? JSON.parse(text(row, 'conditions_json')) : {},
    status: text(row, 'status') || 'draft', updated_by: userId(user), updated_at: new Date().toISOString(),
  }
  const { error } = await db.from('hsd_capacity_rules').upsert(payload, { onConflict: 'tenant_id,category_id' })
  if (error) throw error
}

async function upsertActivity(row: Record<string, string>, selectedCategoryId: string | null, user: HomeServiceUser) {
  const db = factoryDb()!
  const category = await resolveCategory(text(row, 'category_code') || null, selectedCategoryId)
  if (!category) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const activityCode = text(row, 'code', 'activity_code')
  const name = text(row, 'name_fr', 'activity_name', 'name')
  if (!activityCode || !name) throw new Error('code et name_fr sont obligatoires.')
  const min = Math.max(5, Math.round(numberValue(text(row, 'min_minutes'), 15)))
  const max = Math.max(min, Math.round(numberValue(text(row, 'max_minutes'), 60)))
  const version = Math.max(1, Math.round(numberValue(text(row, 'version_number', 'version'), 1)))
  const categoryCodes = Array.from(new Set([...list(text(row, 'category_codes', 'categories')), category.code]))
  const payload = {
    tenant_id: TENANT, code: activityCode, name_fr: name, description_fr: text(row, 'description_fr', 'description'), block_type: text(row, 'block_type') || 'activity',
    objective_codes: list(text(row, 'objective_codes', 'objectives')), category_codes: categoryCodes,
    age_min_months: text(row, 'age_min_months') ? numberValue(text(row, 'age_min_months')) : null, age_max_months: text(row, 'age_max_months') ? numberValue(text(row, 'age_max_months')) : null,
    min_minutes: min, max_minutes: max, energy_level: text(row, 'energy_level') || 'moderate', location_type: text(row, 'location_type') || 'indoor',
    materials: list(text(row, 'materials')), competency_codes: list(text(row, 'competency_codes', 'competencies')), risk_codes: list(text(row, 'risk_codes', 'risks')), evidence_codes: list(text(row, 'evidence_codes', 'evidence')),
    repetition_limit_per_day: Math.max(1, Math.round(numberValue(text(row, 'repetition_limit_per_day', 'repetition_limit'), 1))), status: text(row, 'status') || 'draft', version_number: version,
    created_by: userId(user), updated_by: userId(user), updated_at: new Date().toISOString(),
  }
  const { error } = await db.from('hsd_activity_library').upsert(payload, { onConflict: 'tenant_id,code,version_number' })
  if (error) throw error
}

async function upsertOption(row: Record<string, string>, selectedCategoryId: string | null, type: 'feature' | 'topup' | 'upsell', user: HomeServiceUser) {
  const db = factoryDb()!
  const categoryId = await resolveCategoryId(text(row, 'category_code') || null, selectedCategoryId)
  if (!categoryId) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const code = text(row, 'code', 'item_code', 'option_code')
  const name = text(row, 'name_fr', 'item_name', 'option_name', 'name')
  if (!code || !name) throw new Error('code et name_fr sont obligatoires.')
  const payload = {
    tenant_id: TENANT, category_id: categoryId, code, name_fr: name, description_fr: text(row, 'description_fr', 'description'), option_type: type,
    included_by_default: booleanValue(text(row, 'included_by_default')), pricing_basis: text(row, 'pricing_basis') || 'per_mission',
    unit_price_dh: numberValue(text(row, 'unit_price_dh', 'unit_price'), 0), cost_amount_dh: numberValue(text(row, 'cost_amount_dh', 'cost_amount'), 0),
    minimum_quantity: numberValue(text(row, 'minimum_quantity'), 0), maximum_quantity: numberValue(text(row, 'maximum_quantity'), 999),
    eligibility_rule: text(row, 'eligibility_rule') || null, customer_visible: booleanValue(text(row, 'customer_visible'), true),
    sort_order: Math.round(numberValue(text(row, 'sort_order'), 100)), status: text(row, 'status') || 'draft', updated_by: userId(user), updated_at: new Date().toISOString(),
  }
  const { error } = await db.from('hsd_service_options').upsert(payload, { onConflict: 'tenant_id,category_id,code' })
  if (error) throw error
}

async function upsertCompetency(row: Record<string, string>, selectedCategoryId: string | null, user: HomeServiceUser) {
  const db = factoryDb()!
  const category = await resolveCategory(text(row, 'category_code') || null, selectedCategoryId)
  if (!category) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const competencyCode = text(row, 'code', 'competency_code'), name = text(row, 'name_fr', 'competency_name', 'name')
  if (!competencyCode || !name) throw new Error('code et name_fr sont obligatoires.')
  const { data: competency, error } = await db.from('hsd_competencies').upsert({ tenant_id: TENANT, code: competencyCode, name_fr: name, family: text(row, 'family') || 'general', description_fr: text(row, 'description_fr', 'description'), evidence_type: text(row, 'evidence_type') || 'declaration', renewal_months: text(row, 'renewal_months') ? numberValue(text(row, 'renewal_months')) : null, status: text(row, 'status') || 'draft', created_by: userId(user), updated_by: userId(user), updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,code' }).select('id').single()
  if (error) throw error
  const { error: linkError } = await db.from('hsd_service_competency_rules').upsert({ tenant_id: TENANT, category_id: category.id, competency_id: competency.id, required_level: text(row, 'required_level') || 'operational', mandatory: booleanValue(text(row, 'mandatory'), true), minimum_experience_months: Math.max(0, Math.round(numberValue(text(row, 'minimum_experience_months'), 0))), certification_required: booleanValue(text(row, 'certification_required')), status: text(row, 'status') || 'draft' }, { onConflict: 'tenant_id,category_id,competency_id' })
  if (linkError) throw linkError
}

async function upsertMaterial(row: Record<string, string>, selectedCategoryId: string | null) {
  const db = factoryDb()!
  const category = await resolveCategory(text(row, 'category_code') || null, selectedCategoryId)
  if (!category) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const materialCode = text(row, 'code', 'material_code'), name = text(row, 'name_fr', 'material_name', 'name')
  if (!materialCode || !name) throw new Error('code et name_fr sont obligatoires.')
  const { data: material, error } = await db.from('hsd_materials').upsert({ tenant_id: TENANT, code: materialCode, name_fr: name, description_fr: text(row, 'description_fr', 'description'), provider_scope: text(row, 'provider_scope') || 'angelcare', unit: text(row, 'unit') || 'unit', status: text(row, 'status') || 'draft', updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,code' }).select('id').single()
  if (error) throw error
  const { error: linkError } = await db.from('hsd_service_material_links').upsert({ tenant_id: TENANT, category_id: category.id, material_id: material.id, required: booleanValue(text(row, 'required')), minimum_quantity: numberValue(text(row, 'minimum_quantity'), 0), notes: text(row, 'notes') || null, status: text(row, 'status') || 'draft' }, { onConflict: 'tenant_id,category_id,material_id' })
  if (linkError) throw linkError
}

async function upsertRisk(row: Record<string, string>, selectedCategoryId: string | null, user: HomeServiceUser) {
  const db = factoryDb()!
  const category = await resolveCategory(text(row, 'category_code') || null, selectedCategoryId)
  if (!category) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const riskCode = text(row, 'code', 'risk_code'), name = text(row, 'name_fr', 'risk_name', 'name')
  if (!riskCode || !name) throw new Error('code et name_fr sont obligatoires.')
  const categoryCodes = Array.from(new Set([...list(text(row, 'category_codes', 'categories')), category.code]))
  const { error } = await db.from('hsd_risk_controls').upsert({ tenant_id: TENANT, code: riskCode, name_fr: name, description_fr: text(row, 'description_fr', 'description'), severity: text(row, 'severity', 'risk_level') || 'important', trigger_conditions: list(text(row, 'trigger_conditions')), preventive_controls: list(text(row, 'preventive_controls', 'preventive_control')), required_evidence: list(text(row, 'required_evidence')), stop_work: booleanValue(text(row, 'stop_work')), escalation_route: text(row, 'escalation_route') || 'Dispatch / sécurité', category_codes: categoryCodes, status: text(row, 'status') || 'draft', created_by: userId(user), updated_by: userId(user), updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,code' })
  if (error) throw error
}

async function upsertChecklist(row: Record<string, string>, selectedCategoryId: string | null, user: HomeServiceUser) {
  const db = factoryDb()!
  const categoryId = await resolveCategoryId(text(row, 'category_code') || null, selectedCategoryId)
  if (!categoryId) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const templateCode = text(row, 'template_code') || 'DEFAULT'
  const templateName = text(row, 'template_name', 'name_fr') || `Checklist ${templateCode}`
  const { data: template, error: te } = await db.from('hsd_checklist_templates').upsert({ tenant_id: TENANT, category_id: categoryId, code: templateCode, name_fr: templateName, purpose_fr: text(row, 'purpose_fr', 'purpose'), status: text(row, 'status') || 'draft', version_number: Math.max(1, Math.round(numberValue(text(row, 'version_number'), 1))), updated_by: userId(user), updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,category_id,code,version_number' }).select('id').single()
  if (te) throw te
  const itemCode = text(row, 'item_code', 'code'), label = text(row, 'item_label', 'label_fr', 'label')
  if (!itemCode || !label) throw new Error('item_code et item_label sont obligatoires.')
  const { error } = await db.from('hsd_checklist_template_items').upsert({ tenant_id: TENANT, template_id: template.id, code: itemCode, phase: text(row, 'phase') || 'execution', label_fr: label, item_type: text(row, 'item_type') || 'boolean', mandatory: booleanValue(text(row, 'mandatory')), evidence_required: booleanValue(text(row, 'evidence_required')), blocking_if_failed: booleanValue(text(row, 'blocking_if_failed')), sort_order: Math.round(numberValue(text(row, 'sort_order'), 100)), status: text(row, 'status') || 'draft' }, { onConflict: 'tenant_id,template_id,code' })
  if (error) throw error
}

async function upsertReportField(row: Record<string, string>, selectedCategoryId: string | null, user: HomeServiceUser) {
  const db = factoryDb()!
  const categoryId = await resolveCategoryId(text(row, 'category_code') || null, selectedCategoryId)
  if (!categoryId) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const templateCode = text(row, 'template_code') || 'DEFAULT'
  const { data: template, error: te } = await db.from('hsd_report_templates').upsert({ tenant_id: TENANT, category_id: categoryId, code: templateCode, name_fr: text(row, 'template_name', 'name_fr') || `Rapport ${templateCode}`, purpose_fr: text(row, 'purpose_fr', 'purpose'), status: text(row, 'status') || 'draft', version_number: Math.max(1, Math.round(numberValue(text(row, 'version_number'), 1))), updated_by: userId(user), updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,category_id,code,version_number' }).select('id').single()
  if (te) throw te
  const fieldCode = text(row, 'field_code', 'code'), label = text(row, 'label', 'label_fr')
  if (!fieldCode || !label) throw new Error('field_code et label sont obligatoires.')
  const { error } = await db.from('hsd_report_template_fields').upsert({ tenant_id: TENANT, template_id: template.id, code: fieldCode, section_fr: text(row, 'section', 'section_fr') || 'Mission', label_fr: label, field_type: text(row, 'field_type') || 'text', required: booleanValue(text(row, 'required')), option_values: list(text(row, 'option_values')), sort_order: Math.round(numberValue(text(row, 'sort_order'), 100)), status: text(row, 'status') || 'draft' }, { onConflict: 'tenant_id,template_id,code' })
  if (error) throw error
}

async function upsertPricing(row: Record<string, string>, selectedCategoryId: string | null, user: HomeServiceUser) {
  const db = factoryDb()!
  const categoryId = await resolveCategoryId(text(row, 'category_code') || null, selectedCategoryId)
  if (!categoryId) throw new Error('category_code ou catégorie sélectionnée obligatoire.')
  const code = text(row, 'code', 'price_code')
  if (!code || !text(row, 'unit_price_dh', 'unit_price')) throw new Error('code et unit_price_dh sont obligatoires.')
  const { error } = await db.from('hsd_price_entries').upsert({ tenant_id: TENANT, category_id: categoryId, price_book_id: null, code, customer_segment: text(row, 'customer_segment') || 'all', pricing_basis: text(row, 'pricing_basis') || 'per_hour', minimum_quantity: numberValue(text(row, 'minimum_quantity'), 1), unit_price_dh: numberValue(text(row, 'unit_price_dh', 'unit_price')), cost_amount_dh: numberValue(text(row, 'cost_amount_dh', 'cost_amount')), margin_floor_percent: numberValue(text(row, 'margin_floor_percent'), 0), effective_from: text(row, 'effective_from') || new Date().toISOString().slice(0, 10), effective_to: text(row, 'effective_to') || null, status: text(row, 'status') || 'draft', updated_by: userId(user), updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,category_id,code,effective_from' })
  if (error) throw error
}


function jsonValue(value: string, fallback: unknown = {}) {
  const textValue = String(value || '').trim()
  if (!textValue) return fallback
  try { return JSON.parse(textValue) } catch {
    const result: Record<string, unknown> = {}
    for (const pair of textValue.split('|')) {
      const [key, raw] = pair.split('=', 2)
      if (!key || raw == null) continue
      const normalized = raw.trim()
      if (normalized.includes(';')) result[key.trim()] = normalized.split(';').map((item) => item.trim()).filter(Boolean)
      else if (truthy.has(normalized.toLowerCase())) result[key.trim()] = true
      else if (falsey.has(normalized.toLowerCase())) result[key.trim()] = false
      else if (Number.isFinite(Number(normalized))) result[key.trim()] = Number(normalized)
      else result[key.trim()] = normalized
    }
    return Object.keys(result).length ? result : fallback
  }
}

async function experienceBlueprintForCategory(selectedCategoryId: string | null, categoryCode?: string | null) {
  const db = factoryDb()!
  const category = await resolveCategory(categoryCode || null, selectedCategoryId)
  if (!category) throw new Error('Catégorie obligatoire.')
  const { data, error } = await db.from('hsd_category_experience_blueprints').select('*').eq('tenant_id', TENANT).eq('category_id', category.id).eq('status', 'active').order('version_number', { ascending: false }).limit(1).single()
  if (error || !data) throw new Error(`Aucun blueprint actif pour ${category.code}. Appliquez d’abord la migration Category Master Experience.`)
  return { category, blueprint: data }
}

async function upsertExperienceBlueprint(row: Record<string, string>, selectedCategoryId: string | null) {
  const db = factoryDb()!
  const category = await resolveCategory(text(row, 'category_code') || null, selectedCategoryId)
  if (!category) throw new Error('Catégorie obligatoire.')
  const code = text(row, 'code', 'blueprint_code') || `EXP-${category.code}`
  const { error } = await db.from('hsd_category_experience_blueprints').upsert({
    tenant_id: TENANT, category_id: category.id, code, concept: text(row, 'concept') || 'family_care', title_fr: text(row, 'title_fr', 'title') || category.code,
    subtitle_fr: text(row, 'subtitle_fr', 'subtitle'), hero_statement_fr: text(row, 'hero_statement_fr', 'hero_statement'), accent: text(row, 'accent') || 'blue', icon: text(row, 'icon') || 'Sparkles',
    audience: text(row, 'audience') || 'both', version_number: Math.max(1, Math.round(numberValue(text(row, 'version_number'), 1))), zero_typing_promise_fr: text(row, 'zero_typing_promise_fr', 'zero_typing_promise'),
    ai_composition_profile: jsonValue(text(row, 'ai_composition_profile'), {}), status: text(row, 'status') || 'active', updated_at: new Date().toISOString(),
  }, { onConflict: 'tenant_id,category_id,version_number' })
  if (error) throw error
}

async function upsertExperienceSection(row: Record<string, string>, selectedCategoryId: string | null) {
  const db = factoryDb()!
  const { blueprint } = await experienceBlueprintForCategory(selectedCategoryId, text(row, 'category_code') || null)
  const code = text(row, 'code', 'section_code'), title = text(row, 'title_fr', 'title')
  if (!code || !title) throw new Error('section_code/code et title_fr sont obligatoires.')
  const { error } = await db.from('hsd_category_experience_sections').upsert({ tenant_id: TENANT, blueprint_id: blueprint.id, code, title_fr: title, description_fr: text(row, 'description_fr', 'description'), layout: text(row, 'layout') || 'cards', sort_order: Math.round(numberValue(text(row, 'sort_order'), 100)), status: text(row, 'status') || 'active' }, { onConflict: 'tenant_id,blueprint_id,code' })
  if (error) throw error
}

async function experienceSection(selectedCategoryId: string | null, row: Record<string, string>) {
  const db = factoryDb()!
  const { blueprint } = await experienceBlueprintForCategory(selectedCategoryId, text(row, 'category_code') || null)
  const sectionCode = text(row, 'section_code')
  if (!sectionCode) throw new Error('section_code obligatoire.')
  const { data, error } = await db.from('hsd_category_experience_sections').select('*').eq('tenant_id', TENANT).eq('blueprint_id', blueprint.id).eq('code', sectionCode).single()
  if (error || !data) throw new Error(`Section ${sectionCode} introuvable.`)
  return { blueprint, section: data }
}

async function upsertExperienceField(row: Record<string, string>, selectedCategoryId: string | null) {
  const db = factoryDb()!
  const { section } = await experienceSection(selectedCategoryId, row)
  const code = text(row, 'code', 'field_code'), label = text(row, 'label_fr', 'label')
  if (!code || !label) throw new Error('field_code/code et label_fr sont obligatoires.')
  const defaultRaw = text(row, 'default_value')
  const { error } = await db.from('hsd_category_experience_fields').upsert({ tenant_id: TENANT, section_id: section.id, code, label_fr: label, description_fr: text(row, 'description_fr', 'description'), field_type: text(row, 'field_type', 'type') || 'single', required: booleanValue(text(row, 'required')), default_value: defaultRaw ? jsonValue(defaultRaw, defaultRaw) : null, min_value: text(row, 'min_value', 'min') ? numberValue(text(row, 'min_value', 'min')) : null, max_value: text(row, 'max_value', 'max') ? numberValue(text(row, 'max_value', 'max')) : null, unit: text(row, 'unit') || null, semantic: text(row, 'semantic') || null, sort_order: Math.round(numberValue(text(row, 'sort_order'), 100)), status: text(row, 'status') || 'active' }, { onConflict: 'tenant_id,section_id,code' })
  if (error) throw error
}

async function upsertExperienceOption(row: Record<string, string>, selectedCategoryId: string | null) {
  const db = factoryDb()!
  const { section } = await experienceSection(selectedCategoryId, row)
  const fieldCode = text(row, 'field_code')
  if (!fieldCode) throw new Error('field_code obligatoire.')
  const { data: field, error: fieldError } = await db.from('hsd_category_experience_fields').select('*').eq('tenant_id', TENANT).eq('section_id', section.id).eq('code', fieldCode).single()
  if (fieldError || !field) throw new Error(`Champ ${fieldCode} introuvable.`)
  const code = text(row, 'code', 'option_code'), label = text(row, 'label_fr', 'label')
  if (!code || !label) throw new Error('option_code/code et label_fr sont obligatoires.')
  const { error } = await db.from('hsd_category_experience_options').upsert({ tenant_id: TENANT, field_id: field.id, code, label_fr: label, description_fr: text(row, 'description_fr', 'description'), sort_order: Math.round(numberValue(text(row, 'sort_order'), 100)), status: text(row, 'status') || 'active' }, { onConflict: 'tenant_id,field_id,code' })
  if (error) throw error
}

async function upsertExperiencePreset(row: Record<string, string>, selectedCategoryId: string | null) {
  const db = factoryDb()!
  const { blueprint } = await experienceBlueprintForCategory(selectedCategoryId, text(row, 'category_code') || null)
  const code = text(row, 'code', 'preset_code'), name = text(row, 'name_fr', 'name')
  if (!code || !name) throw new Error('preset_code/code et name_fr sont obligatoires.')
  const { error } = await db.from('hsd_category_experience_presets').upsert({ tenant_id: TENANT, blueprint_id: blueprint.id, code, name_fr: name, description_fr: text(row, 'description_fr', 'description'), badge_fr: text(row, 'badge_fr', 'badge') || 'Importé', mode: text(row, 'mode') || 'single_mission', universe: text(row, 'universe') || 'b2c', field_values: jsonValue(text(row, 'field_values'), {}), default_start_time: text(row, 'default_start_time') || '08:00', default_end_time: text(row, 'default_end_time') || '16:00', default_day_count: Math.max(1, Math.round(numberValue(text(row, 'default_day_count'), 1))), scenario_count: Math.max(1, Math.min(10, Math.round(numberValue(text(row, 'scenario_count'), 3)))), max_activities_per_day: Math.max(1, Math.min(12, Math.round(numberValue(text(row, 'max_activities_per_day'), 6)))), max_options: Math.max(0, Math.min(12, Math.round(numberValue(text(row, 'max_options'), 4)))), sort_order: Math.round(numberValue(text(row, 'sort_order'), 100)), status: text(row, 'status') || 'active', updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,blueprint_id,code' })
  if (error) throw error
}

export async function applyDirectImport(input: unknown, user: HomeServiceUser): Promise<DirectImportResult> {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const importType = String(body.importType || '')
  const content = String(body.content || '')
  const fileName = String(body.fileName || `${importType}.csv`)
  const categoryId = body.categoryId ? String(body.categoryId) : null
  const allowed = ['doctrine_rules', 'capacity_rules', 'activities', 'features', 'topups', 'upsells', 'competencies', 'materials', 'risks', 'checklists', 'report_fields', 'pricing', 'experience_blueprints', 'experience_sections', 'experience_fields', 'experience_options', 'experience_presets']
  if (!allowed.includes(importType)) throw Object.assign(new Error('Type d’import non supporté.'), { status: 422 })
  if (!content.trim()) throw Object.assign(new Error('Le contenu CSV est vide.'), { status: 422 })
  const rows = parseCsv(content)
  const db = factoryDb()
  if (!db) throw Object.assign(new Error('Base HomeService non configurée.'), { status: 503 })
  const checksum = createHash('sha256').update(content).digest('hex')
  const batchId = randomUUID()
  const errors: Array<{ row: number; message: string }> = []
  let appliedRows = 0
  for (const [index, row] of rows.entries()) {
    try {
      if (importType === 'doctrine_rules') await upsertDoctrine(row, categoryId, user)
      else if (importType === 'capacity_rules') await upsertCapacity(row, categoryId, user)
      else if (importType === 'activities') await upsertActivity(row, categoryId, user)
      else if (importType === 'features' || importType === 'topups' || importType === 'upsells') await upsertOption(row, categoryId, importType === 'features' ? 'feature' : importType === 'topups' ? 'topup' : 'upsell', user)
      else if (importType === 'competencies') await upsertCompetency(row, categoryId, user)
      else if (importType === 'materials') await upsertMaterial(row, categoryId)
      else if (importType === 'risks') await upsertRisk(row, categoryId, user)
      else if (importType === 'checklists') await upsertChecklist(row, categoryId, user)
      else if (importType === 'report_fields') await upsertReportField(row, categoryId, user)
      else if (importType === 'pricing') await upsertPricing(row, categoryId, user)
      else if (importType === 'experience_blueprints') await upsertExperienceBlueprint(row, categoryId)
      else if (importType === 'experience_sections') await upsertExperienceSection(row, categoryId)
      else if (importType === 'experience_fields') await upsertExperienceField(row, categoryId)
      else if (importType === 'experience_options') await upsertExperienceOption(row, categoryId)
      else if (importType === 'experience_presets') await upsertExperiencePreset(row, categoryId)
      appliedRows += 1
    } catch (error) {
      errors.push({ row: index + 2, message: error instanceof Error ? error.message : String(error) })
    }
  }
  const status = errors.length === 0 ? 'applied' : appliedRows > 0 ? 'partially_applied' : 'failed'
  const result: DirectImportResult = { batchId, importType, totalRows: rows.length, appliedRows, rejectedRows: errors.length, warnings: ['Les lignes appliquées sont immédiatement disponibles pour composer des brouillons. Aucune approbation n’est exigée à l’import.'], errors }
  const { error: batchError } = await db.from('hsd_direct_import_batches').insert({ id: batchId, tenant_id: TENANT, import_type: importType, file_name: fileName, checksum, category_id: categoryId, status, total_rows: rows.length, applied_rows: appliedRows, rejected_rows: errors.length, result, created_by: userId(user) })
  if (batchError) throw batchError
  const correlationId = randomUUID()
  await Promise.all([
    db.from('hsd_audit_events').insert({ tenant_id: TENANT, actor_id: userId(user), actor_label: userLabel(user), action: 'direct_import_applied', entity_type: 'direct_import_batch', entity_id: batchId, entity_label: fileName, to_state: status, correlation_id: correlationId, payload: result }),
    db.from('hsd_outbox_events').insert({ tenant_id: TENANT, event_type: 'homeservice.factory.direct_import_applied', aggregate_type: 'direct_import_batch', aggregate_id: batchId, correlation_id: correlationId, payload: result }),
  ])
  return result
}
