import 'server-only'
import { createClient } from '@/lib/supabase/contract-client'
import { type SupabaseClient } from '@supabase/supabase-js'
import type { FactoryCataloguePayload, FactoryCategorySource } from '@/types/homeservice-factory'
import { FACTORY_CONTEXTS, FACTORY_OBJECTIVES, FACTORY_OUTCOMES, FACTORY_PAIN_POINTS } from '../constants'

const TENANT = 'angelcare-main'
const allowedStatuses = new Set(['draft', 'active', 'approved', 'review', 'published'])
const arr = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : []
const num = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function factoryDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function assertRows<T>(result: { data: T[] | null; error: unknown }, optional = false): T[] {
  if (result.error && !optional) throw result.error
  return result.data || []
}

export async function loadFactoryCatalogue(): Promise<FactoryCataloguePayload> {
  const db = factoryDb()
  if (!db) return { categories: [], objectives: FACTORY_OBJECTIVES, contexts: FACTORY_CONTEXTS, painPoints: FACTORY_PAIN_POINTS, outcomes: FACTORY_OUTCOMES }
  const [familiesR, categoriesR, doctrineR, capacityR, activitiesR, optionsR, competenciesR, competencyRulesR, risksR, pricesR] = await Promise.all([
    db.from('hsd_service_families').select('id,name_fr,status').eq('tenant_id', TENANT),
    db.from('hsd_service_categories').select('*').eq('tenant_id', TENANT).order('commercial_name_fr'),
    db.from('hsd_doctrine_rules').select('*').eq('tenant_id', TENANT),
    db.from('hsd_capacity_rules').select('*').eq('tenant_id', TENANT),
    db.from('hsd_activity_library').select('*').eq('tenant_id', TENANT),
    db.from('hsd_service_options').select('*').eq('tenant_id', TENANT),
    db.from('hsd_competencies').select('*').eq('tenant_id', TENANT),
    db.from('hsd_service_competency_rules').select('*').eq('tenant_id', TENANT),
    db.from('hsd_risk_controls').select('*').eq('tenant_id', TENANT),
    db.from('hsd_price_entries').select('*').eq('tenant_id', TENANT).order('effective_from', { ascending: false }),
  ])
  const families = new Map(assertRows<any>(familiesR).map((row) => [String(row.id), String(row.name_fr)]))
  const doctrine = assertRows<any>(doctrineR)
  const capacities = assertRows<any>(capacityR)
  const activities = assertRows<any>(activitiesR).filter((row) => allowedStatuses.has(String(row.status)))
  const options = assertRows<any>(optionsR).filter((row) => allowedStatuses.has(String(row.status)))
  const competencies = assertRows<any>(competenciesR).filter((row) => allowedStatuses.has(String(row.status)))
  const competencyRules = assertRows<any>(competencyRulesR)
  const risks = assertRows<any>(risksR).filter((row) => allowedStatuses.has(String(row.status)))
  const prices = assertRows<any>(pricesR).filter((row) => allowedStatuses.has(String(row.status)))

  const categories: FactoryCategorySource[] = assertRows<any>(categoriesR)
    .filter((row) => allowedStatuses.has(String(row.status)))
    .map((category) => {
      const code = String(category.code)
      const categoryActivities = activities.filter((activity) => {
        const codes = arr(activity.category_codes)
        return codes.length === 0 || codes.includes(code)
      }).map((activity) => ({
        id: String(activity.id), code: String(activity.code), name: String(activity.name_fr), description: String(activity.description_fr || ''),
        blockType: String(activity.block_type || 'activity'), objectiveCodes: arr(activity.objective_codes), categoryCodes: arr(activity.category_codes),
        ageMinMonths: activity.age_min_months == null ? null : num(activity.age_min_months), ageMaxMonths: activity.age_max_months == null ? null : num(activity.age_max_months),
        minMinutes: num(activity.min_minutes, 15), maxMinutes: num(activity.max_minutes, 60), materials: arr(activity.materials), competencyCodes: arr(activity.competency_codes),
        riskCodes: arr(activity.risk_codes), evidenceCodes: arr(activity.evidence_codes), repetitionLimit: num(activity.repetition_limit_per_day, 1), status: String(activity.status),
      }))
      const rules = competencyRules.filter((rule) => String(rule.category_id) === String(category.id))
      const categoryCompetencies = rules.map((rule) => {
        const competency = competencies.find((item) => String(item.id) === String(rule.competency_id))
        return { ...rule, code: competency?.code || null, name: competency?.name_fr || null }
      })
      return {
        id: String(category.id), code, commercialName: String(category.commercial_name_fr), operationalName: String(category.operational_name_fr),
        description: String(category.description_fr || ''), audience: String(category.audience || 'both'), status: String(category.status), versionNumber: num(category.version_number, 1),
        familyName: families.get(String(category.family_id)) || 'Famille non renseignée', missionFormats: arr(category.mission_formats), beneficiaryProfiles: arr(category.beneficiary_profiles),
        languages: arr(category.languages), cities: arr(category.cities), doctrine: doctrine.filter((rule) => String(rule.category_id) === String(category.id)),
        capacity: capacities.find((rule) => String(rule.category_id) === String(category.id)) || null,
        activities: categoryActivities,
        options: options.filter((option) => String(option.category_id) === String(category.id)).map((option) => ({
          id: String(option.id), code: String(option.code), name: String(option.name_fr), description: String(option.description_fr || ''),
          optionType: String(option.option_type) as 'feature' | 'topup' | 'upsell', pricingBasis: String(option.pricing_basis || 'per_mission'),
          unitPriceDh: num(option.unit_price_dh), costAmountDh: num(option.cost_amount_dh), minimumQuantity: num(option.minimum_quantity), maximumQuantity: num(option.maximum_quantity, 999), status: String(option.status),
        })),
        competencies: categoryCompetencies,
        risks: risks.filter((risk) => !arr(risk.category_codes).length || arr(risk.category_codes).includes(code)),
        priceEntries: prices.filter((price) => String(price.category_id) === String(category.id)),
      }
    })
  return { categories, objectives: FACTORY_OBJECTIVES, contexts: FACTORY_CONTEXTS, painPoints: FACTORY_PAIN_POINTS, outcomes: FACTORY_OUTCOMES }
}

export async function loadCategoryAuthority(categoryId: string): Promise<FactoryCategorySource> {
  const catalogue = await loadFactoryCatalogue()
  const category = catalogue.categories.find((item) => item.id === categoryId)
  if (!category) throw Object.assign(new Error('Catégorie introuvable ou non utilisable. Importez ou activez d’abord la catégorie.'), { status: 422, code: 'CATEGORY_NOT_AVAILABLE' })
  return category
}
