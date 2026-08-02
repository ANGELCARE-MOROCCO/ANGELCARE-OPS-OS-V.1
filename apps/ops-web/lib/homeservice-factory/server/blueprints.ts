import 'server-only'
import type { CategoryExperienceBlueprint, CategoryExperienceField, CategoryExperiencePreset, CategoryExperienceSection } from '@/types/homeservice-category-experience'
import { getCompiledCategoryBlueprint, listCompiledCategoryBlueprints } from '@/lib/homeservice-factory/blueprints'
import { factoryDb } from './catalogue'

const TENANT = 'angelcare-main'
const byOrder = (rows: any[]): any[] => [...rows].sort((a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0))

export async function loadCategoryBlueprint(categoryCode: string): Promise<CategoryExperienceBlueprint | null> {
  const fallback = getCompiledCategoryBlueprint(categoryCode)
  const db = factoryDb()
  if (!db) return fallback
  try {
    const { data: category } = await db.from('hsd_service_categories').select('id,code').eq('tenant_id', TENANT).eq('code', categoryCode).single()
    if (!category) return fallback
    const { data: blueprintRow, error } = await db.from('hsd_category_experience_blueprints').select('*').eq('tenant_id', TENANT).eq('category_id', category.id).eq('status', 'active').order('version_number', { ascending: false }).limit(1).single()
    if (error || !blueprintRow) return fallback
    const [{ data: sectionRows }, { data: presetRows }] = await Promise.all([
      db.from('hsd_category_experience_sections').select('*').eq('tenant_id', TENANT).eq('blueprint_id', blueprintRow.id).eq('status', 'active').order('sort_order'),
      db.from('hsd_category_experience_presets').select('*').eq('tenant_id', TENANT).eq('blueprint_id', blueprintRow.id).eq('status', 'active').order('sort_order'),
    ])
    const sectionIds = (sectionRows || []).map((row: any) => row.id)
    const { data: fieldRows } = sectionIds.length
      ? await db.from('hsd_category_experience_fields').select('*').eq('tenant_id', TENANT).in('section_id', sectionIds).eq('status', 'active').order('sort_order')
      : { data: [] as any[] }
    const fieldIds = (fieldRows || []).map((row: any) => row.id)
    const { data: optionRows } = fieldIds.length
      ? await db.from('hsd_category_experience_options').select('*').eq('tenant_id', TENANT).in('field_id', fieldIds).eq('status', 'active').order('sort_order')
      : { data: [] as any[] }

    const sections: CategoryExperienceSection[] = byOrder(sectionRows || []).map((section: any): CategoryExperienceSection => ({
      code: String(section.code), title: String(section.title_fr), description: String(section.description_fr || ''), layout: String(section.layout || 'cards') as CategoryExperienceSection['layout'],
      fields: byOrder((fieldRows || []).filter((field: any) => String(field.section_id) === String(section.id))).map((field: any): CategoryExperienceField => ({
        code: String(field.code), label: String(field.label_fr), description: String(field.description_fr || ''), type: String(field.field_type) as CategoryExperienceField['type'], required: Boolean(field.required),
        defaultValue: field.default_value ?? undefined, min: field.min_value == null ? undefined : Number(field.min_value), max: field.max_value == null ? undefined : Number(field.max_value), unit: field.unit || undefined,
        semantic: field.semantic || undefined,
        options: byOrder((optionRows || []).filter((option: any) => String(option.field_id) === String(field.id))).map((option: any) => ({ code: String(option.code), label: String(option.label_fr), description: String(option.description_fr || '') })),
      })),
    }))
    const presets: CategoryExperiencePreset[] = byOrder(presetRows || []).map((preset: any) => ({
      code: String(preset.code), name: String(preset.name_fr), description: String(preset.description_fr || ''), badge: String(preset.badge_fr || ''), mode: preset.mode,
      universe: preset.universe, fieldValues: preset.field_values || {}, defaultStartTime: String(preset.default_start_time || '08:00').slice(0, 5), defaultEndTime: String(preset.default_end_time || '16:00').slice(0, 5),
      defaultDayCount: Number(preset.default_day_count || 1), scenarioCount: Number(preset.scenario_count || 3), maxActivitiesPerDay: Number(preset.max_activities_per_day || 6), maxOptions: Number(preset.max_options || 4),
    }))
    return {
      code: String(blueprintRow.code), categoryCode, categoryName: String(blueprintRow.title_fr), concept: blueprintRow.concept, conceptTitle: fallback?.conceptTitle || String(blueprintRow.title_fr),
      title: String(blueprintRow.title_fr), subtitle: String(blueprintRow.subtitle_fr || ''), heroStatement: String(blueprintRow.hero_statement_fr || ''), accent: String(blueprintRow.accent || 'blue'), icon: String(blueprintRow.icon || 'Sparkles'),
      audience: blueprintRow.audience, version: Number(blueprintRow.version_number || 1), zeroTypingPromise: String(blueprintRow.zero_typing_promise_fr || ''), sections: sections.length ? sections : fallback?.sections || [], presets: presets.length ? presets : fallback?.presets || [],
      aiCompositionProfile: blueprintRow.ai_composition_profile || fallback?.aiCompositionProfile || { purpose: '', forbidden: [], priorities: [] },
    }
  } catch {
    return fallback
  }
}

export async function loadAllCategoryBlueprints(): Promise<CategoryExperienceBlueprint[]> {
  const compiled = listCompiledCategoryBlueprints()
  return Promise.all(compiled.map(async (item) => (await loadCategoryBlueprint(item.categoryCode)) || item))
}

export async function requireCategoryBlueprint(categoryCode: string): Promise<CategoryExperienceBlueprint> {
  const blueprint = await loadCategoryBlueprint(categoryCode)
  if (!blueprint) throw Object.assign(new Error(`Aucun blueprint d’expérience n’est disponible pour ${categoryCode}.`), { status: 422, code: 'BLUEPRINT_NOT_AVAILABLE' })
  return blueprint
}
