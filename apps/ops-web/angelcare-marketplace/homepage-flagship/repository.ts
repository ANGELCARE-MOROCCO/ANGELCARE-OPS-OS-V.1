import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import type { CmsMenuItem } from '../experience-builder/types'
import { MarketplaceError } from '../server/errors'
import { resolveTerritoryId } from '../public-universe/repository'
import type {
  HomepageAcademyCohort,
  HomepageAdminData,
  HomepageAdminKind,
  HomepageAdminRecord,
  HomepageCampaign,
  HomepageCategory,
  HomepageCollection,
  HomepageExperience,
  HomepageItem,
  HomepageLocale,
  HomepagePartnerPlan,
  HomepageTerritory,
  HomepageTrustSignal,
} from './types'

const VISITOR_COOKIE = 'angelcare_marketplace_visitor'

type DbRow = Record<string, unknown>

function rows(value: unknown): DbRow[] { return Array.isArray(value) ? value.filter((row): row is DbRow => Boolean(row && typeof row === 'object')) : [] }
function text(value: unknown): string { return typeof value === 'string' ? value : '' }
function nullableText(value: unknown): string | null { const result = text(value); return result || null }
function numberValue(value: unknown): number { return typeof value === 'number' ? value : Number(value || 0) }
function nullableNumber(value: unknown): number | null { return value === null || value === undefined || value === '' ? null : numberValue(value) }
function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.map(String).filter(Boolean) : [] }
function recordValue(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }

function homepageFailure(operation: string, error: { code?: string; message?: string } | null): MarketplaceError {
  const missing = error?.code === '42P01' || String(error?.message || '').includes('angelcare_marketplace_homepage_')
  return new MarketplaceError(missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR', missing
    ? 'Le storefront Homepage Flagship nécessite sa migration additive.'
    : `Le storefront n’a pas pu ${operation}.`, { cause: error || undefined, retryable: !missing })
}

function localized(row: DbRow, base: string, locale: HomepageLocale): string {
  const localizedValue = text(row[`${base}_${locale}`])
  return localizedValue || text(row[`${base}_fr`]) || text(row[base])
}

function mapCampaign(row: DbRow): HomepageCampaign {
  return {
    id: text(row.id), campaign_key: text(row.campaign_key), locale: text(row.locale) as HomepageLocale,
    title: text(row.title), eyebrow: nullableText(row.eyebrow), subtitle: nullableText(row.subtitle),
    primary_cta_label: text(row.primary_cta_label), primary_cta_href: text(row.primary_cta_href),
    secondary_cta_label: nullableText(row.secondary_cta_label), secondary_cta_href: nullableText(row.secondary_cta_href),
    desktop_asset_url: text(row.desktop_asset_url), tablet_asset_url: nullableText(row.tablet_asset_url), mobile_asset_url: nullableText(row.mobile_asset_url),
    audience: text(row.audience) as HomepageCampaign['audience'], priority: numberValue(row.priority), status: text(row.status),
  }
}

function mapCategory(row: DbRow, itemCount: number): HomepageCategory {
  return {
    id: text(row.id), category_key: text(row.category_key), locale: text(row.locale) as HomepageLocale,
    title: text(row.title), short_description: nullableText(row.short_description), slug: text(row.slug),
    cover_asset_url: nullableText(row.cover_asset_url), icon_key: nullableText(row.icon_key), visual_theme: text(row.visual_theme) || 'navy', item_count: itemCount,
  }
}

function mapItem(row: DbRow, locale: HomepageLocale, mediaUrl: string | null, category?: HomepageCategory, trustLabels: string[] = []): HomepageItem {
  return {
    id: text(row.id), public_reference: text(row.public_reference), item_key: text(row.item_key), slug: text(row.slug),
    kind: text(row.kind) as HomepageItem['kind'], name: localized(row, 'name', locale),
    short_description: localized(row, 'short_description', locale) || null, status: text(row.status), territory_id: nullableText(row.territory_id),
    currency_label: text(row.currency_label) || 'Dh', price_mode: text(row.price_mode) as HomepageItem['price_mode'],
    price_amount: nullableNumber(row.price_amount), featured: Boolean(row.featured), availability_status: text(row.availability_status),
    category_key: category?.category_key || null, category_title: category?.title || null, media_url: mediaUrl,
    trust_labels: trustLabels, metadata: recordValue(row.commercial_metadata),
  }
}

async function listNavigation(locale: HomepageLocale, territoryId: string | null): Promise<CmsMenuItem[]> {
  const supabase = await createServiceClient()
  let query = supabase.from('angelcare_marketplace_public_navigation_v').select('*').eq('locale', locale)
  query = territoryId ? query.or(`territory_id.is.null,territory_id.eq.${territoryId}`) : query.is('territory_id', null)
  const { data } = await query.order('sort_order')
  return (data || []) as CmsMenuItem[]
}

async function listTerritory(territoryCode: string): Promise<HomepageTerritory | null> {
  const supabase = await createServiceClient()
  const { data: territory } = await supabase.from('angelcare_marketplace_territories').select('*').eq('territory_code', territoryCode).maybeSingle()
  if (!territory) return null
  const { data: cities } = await supabase.from('angelcare_marketplace_territory_city_zones').select('id,city_name,zone_name,coverage_status').eq('territory_id', territory.id).in('coverage_status', ['active', 'limited']).order('city_name')
  return {
    id: String(territory.id), territory_code: String(territory.territory_code), name: String(territory.name),
    currency_label: String(territory.currency_label), status: String(territory.status), readiness_score: Number(territory.readiness_score || 0),
    active_locales: stringArray(territory.active_locales), cities: rows(cities).map((row) => ({ id: text(row.id), city_name: text(row.city_name), zone_name: nullableText(row.zone_name), coverage_status: text(row.coverage_status) })),
  }
}

async function visitorSelection(): Promise<{ saved: string[]; compare: string[] }> {
  const store = await cookies()
  const reference = store.get(VISITOR_COOKIE)?.value
  if (!reference) return { saved: [], compare: [] }
  const supabase = await createServiceClient()
  const { data } = await supabase.from('angelcare_marketplace_homepage_visitor_selections').select('catalog_item_id,selection_type').eq('visitor_reference', reference).eq('active', true)
  const selected = rows(data)
  return {
    saved: selected.filter((row) => row.selection_type === 'saved').map((row) => text(row.catalog_item_id)),
    compare: selected.filter((row) => row.selection_type === 'compare').map((row) => text(row.catalog_item_id)),
  }
}

export async function getHomepageExperience(input: { locale: HomepageLocale; territoryCode?: string }): Promise<HomepageExperience> {
  const locale = input.locale
  const territoryCode = input.territoryCode || 'MA-MASTER'
  const territoryId = await resolveTerritoryId(territoryCode)
  const supabase = await createServiceClient()
  const now = new Date().toISOString()

  let campaignQuery = supabase.from('angelcare_marketplace_homepage_campaigns').select('*').eq('locale', locale).eq('status', 'active').lte('starts_at', now).or(`ends_at.is.null,ends_at.gte.${now}`)
  campaignQuery = territoryId ? campaignQuery.or(`territory_id.is.null,territory_id.eq.${territoryId}`) : campaignQuery.is('territory_id', null)
  const { data: campaignRows, error: campaignError } = await campaignQuery.order('priority').limit(8)
  if (campaignError) throw homepageFailure('charger les campagnes', campaignError)

  const [{ data: categoryRows }, { data: itemRows }, { data: mediaRows }, { data: linkRows }, { data: collectionRows }, { data: collectionItemRows }] = await Promise.all([
    supabase.from('angelcare_marketplace_catalog_categories').select('*').eq('locale', locale).eq('status', 'published').order('sort_order'),
    supabase.from('angelcare_marketplace_catalog_items').select('*').eq('status', 'published').order('featured', { ascending: false }).order('updated_at', { ascending: false }).limit(120),
    supabase.from('angelcare_marketplace_catalog_item_media').select('*').eq('status', 'active').order('sort_order'),
    supabase.from('angelcare_marketplace_catalog_item_categories').select('*'),
    supabase.from('angelcare_marketplace_homepage_collections').select('*').eq('locale', locale).eq('status', 'active').order('sort_order'),
    supabase.from('angelcare_marketplace_homepage_collection_items').select('*').eq('status', 'active').order('sort_order'),
  ])

  const itemRowsSafe = rows(itemRows)
  const linkRowsSafe = rows(linkRows)
  const mediaMap = new Map(rows(mediaRows).map((row) => [text(row.catalog_item_id), text(row.asset_url)]))
  const rawCategories = rows(categoryRows)
  const countByCategory = new Map<string, number>()
  for (const link of linkRowsSafe) countByCategory.set(text(link.category_id), (countByCategory.get(text(link.category_id)) || 0) + 1)
  const categories = rawCategories.map((row) => mapCategory(row, countByCategory.get(text(row.id)) || 0))
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const categoryByItem = new Map<string, HomepageCategory>()
  for (const row of linkRowsSafe) {
    const category = categoryById.get(text(row.category_id))
    if (category) categoryByItem.set(text(row.catalog_item_id), category)
  }

  const trustByObject = new Map<string, string[]>()
  const { data: badgeRows } = await supabase.from('angelcare_marketplace_trust_badge_issuances').select('object_id,badge_key,status,valid_until,verification_reference,public_claims').eq('status', 'active')
  for (const badge of rows(badgeRows)) {
    const objectId = text(badge.object_id)
    trustByObject.set(objectId, [...(trustByObject.get(objectId) || []), text(badge.badge_key)])
  }

  const items = itemRowsSafe.map((row) => mapItem(row, locale, mediaMap.get(text(row.id)) || null, categoryByItem.get(text(row.id)), trustByObject.get(text(row.id)) || []))
  const itemById = new Map(items.map((item) => [item.id, item]))
  const collectionLinks = rows(collectionItemRows)
  const collections: HomepageCollection[] = rows(collectionRows).map((row) => ({
    id: text(row.id), collection_key: text(row.collection_key), locale, title: text(row.title), subtitle: nullableText(row.subtitle),
    selection_method: text(row.selection_method), layout_variant: text(row.layout_variant),
    items: collectionLinks.filter((link) => text(link.collection_id) === text(row.id)).map((link) => itemById.get(text(link.catalog_item_id))).filter((item): item is HomepageItem => Boolean(item)),
  }))

  const [{ data: cohortsRaw }, { data: coursesRaw }, { data: plansRaw }, { data: planModulesRaw }, { data: badgeDefinitionsRaw }] = await Promise.all([
    supabase.from('angelcare_marketplace_academy_cohorts').select('id,name,status,capacity,enrolled_count,starts_at,course_id').in('status', ['enrollment_open', 'scheduled', 'active']).order('starts_at').limit(8),
    supabase.from('angelcare_marketplace_academy_courses').select('id,title_fr,slug,delivery_mode,status').eq('status', 'published'),
    supabase.from('angelcare_marketplace_partner_plans').select('*').eq('status', 'published').order('sort_order').limit(6),
    supabase.from('angelcare_marketplace_partner_plan_modules').select('plan_id,module_key,included').eq('included', true),
    supabase.from('angelcare_marketplace_trust_badge_definitions').select('badge_key,name_fr,status').in('status', ['configured', 'active', 'published']),
  ])

  const courses = new Map(rows(coursesRaw).map((row) => [text(row.id), row]))
  const academyCohorts: HomepageAcademyCohort[] = rows(cohortsRaw).map((row) => {
    const course = courses.get(text(row.course_id)) || {}
    return { id: text(row.id), name: text(row.name), status: text(row.status), capacity: numberValue(row.capacity), enrolled_count: numberValue(row.enrolled_count), starts_at: nullableText(row.starts_at), course_title: localized(course, 'title', locale), course_slug: text(course.slug), delivery_mode: text(course.delivery_mode) }
  })

  const planModuleRows = rows(planModulesRaw)
  const partnerPlans: HomepagePartnerPlan[] = rows(plansRaw).map((row) => ({ id: text(row.id), plan_key: text(row.plan_key), name: localized(row, 'name', locale), description: localized(row, 'description', locale) || null, billing_period: text(row.billing_period), base_price: nullableNumber(row.base_price), currency_label: text(row.currency_label) || 'Dh', modules: planModuleRows.filter((module) => text(module.plan_id) === text(row.id)).map((module) => text(module.module_key)) }))

  const definitions = new Map(rows(badgeDefinitionsRaw).map((row) => [text(row.badge_key), text(row.name_fr)]))
  const trustSignals: HomepageTrustSignal[] = rows(badgeRows).slice(0, 6).map((row) => ({ id: text(row.object_id) + text(row.badge_key), name: definitions.get(text(row.badge_key)) || text(row.badge_key), verification_reference: text(row.verification_reference), valid_until: nullableText(row.valid_until), public_claims: stringArray(row.public_claims) }))

  const [navigation, territory, selection] = await Promise.all([listNavigation(locale, territoryId), listTerritory(territoryCode), visitorSelection()])
  const published = items.filter((item) => !territoryId || !item.territory_id || item.territory_id === territoryId)

  return {
    locale, territory, navigation, campaigns: rows(campaignRows).map(mapCampaign), categories, collections,
    featuredItems: published.filter((item) => item.featured).slice(0, 14),
    availableItems: published.filter((item) => item.availability_status === 'available').slice(0, 12),
    familyItems: published.filter((item) => item.metadata.audience === 'family' || item.category_key === 'family-services').slice(0, 10),
    developmentItems: published.filter((item) => ['development', 'kits'].includes(item.category_key || '')).slice(0, 10),
    academyItems: published.filter((item) => item.kind === 'training' || item.category_key === 'academy').slice(0, 10),
    organizationItems: published.filter((item) => item.metadata.audience === 'organization' || ['institutions', 'hospitality', 'corporate', 'partner-os', 'quality'].includes(item.category_key || '')).slice(0, 12),
    academyCohorts, partnerPlans, trustSignals, selection, generatedAt: new Date().toISOString(),
  }
}

export async function getHomepageAdminData(territoryId: string | null): Promise<HomepageAdminData> {
  const supabase = await createServiceClient()
  const table = (name: string) => supabase.from(name).select('*').order('updated_at', { ascending: false }).limit(250)
  const [campaigns, sections, collections, placements, audienceRules, territoryRules, assets, interactions, catalog] = await Promise.all([
    table('angelcare_marketplace_homepage_campaigns'), table('angelcare_marketplace_homepage_sections'), table('angelcare_marketplace_homepage_collections'),
    table('angelcare_marketplace_homepage_placements'), table('angelcare_marketplace_homepage_audience_rules'), table('angelcare_marketplace_homepage_territory_rules'),
    table('angelcare_marketplace_homepage_campaign_assets'), table('angelcare_marketplace_homepage_interactions'),
    supabase.from('angelcare_marketplace_catalog_items').select('id,name_fr,kind,status').order('name_fr').limit(500),
  ])
  return {
    campaigns: rows(campaigns.data) as HomepageAdminRecord[], sections: rows(sections.data) as HomepageAdminRecord[], collections: rows(collections.data) as HomepageAdminRecord[],
    placements: rows(placements.data) as HomepageAdminRecord[], rules: [...rows(audienceRules.data), ...rows(territoryRules.data)] as HomepageAdminRecord[], assets: rows(assets.data) as HomepageAdminRecord[],
    interactions: rows(interactions.data) as HomepageAdminRecord[], catalogItems: (catalog.data || []) as HomepageAdminData['catalogItems'], territoryId,
  }
}

const ADMIN_TABLES: Record<HomepageAdminKind, string> = {
  campaigns: 'angelcare_marketplace_homepage_campaigns', sections: 'angelcare_marketplace_homepage_sections', collections: 'angelcare_marketplace_homepage_collections',
  placements: 'angelcare_marketplace_homepage_placements', 'audience-rules': 'angelcare_marketplace_homepage_audience_rules', 'territory-rules': 'angelcare_marketplace_homepage_territory_rules', assets: 'angelcare_marketplace_homepage_campaign_assets',
}

export async function listHomepageAdminKind(kind: HomepageAdminKind): Promise<HomepageAdminRecord[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from(ADMIN_TABLES[kind]).select('*').order('updated_at', { ascending: false }).limit(500)
  if (error) throw homepageFailure(`charger ${kind}`, error)
  return rows(data) as HomepageAdminRecord[]
}

export async function createHomepageAdminRecord(kind: HomepageAdminKind, payload: DbRow): Promise<HomepageAdminRecord> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from(ADMIN_TABLES[kind]).insert(payload).select('*').single()
  if (error || !data) throw homepageFailure(`créer ${kind}`, error)
  return data as HomepageAdminRecord
}

export async function updateHomepageAdminRecord(kind: HomepageAdminKind, id: string, payload: DbRow): Promise<HomepageAdminRecord> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from(ADMIN_TABLES[kind]).update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error || !data) throw homepageFailure(`mettre à jour ${kind}`, error)
  return data as HomepageAdminRecord
}

export async function archiveHomepageAdminRecord(kind: HomepageAdminKind, id: string): Promise<void> {
  const supabase = await createServiceClient()
  const { error } = await supabase.from(ADMIN_TABLES[kind]).update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw homepageFailure(`archiver ${kind}`, error)
}
