import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import type {
  CatalogAdminItem,
  CatalogCategoryAdmin,
  CommerceMutationResult,
  CommerceRecord,
  CommerceResource,
  CommerceStudioData,
  CommerceStudioSummary,
  HomepageSectionRecord,
  MediaAsset,
  MerchandisingAssignment,
  NavigationMenuRecord,
} from './types'
import { affectedCommercePaths, refreshCommerceSurfaces } from './publication'
import { assertInternalOrHttpUrl, safeArray, safeBoolean, safeJson, safeNumber, slugify } from './validation'

type Row = Record<string, unknown>
type DbError = { code?: string; message?: string; details?: string } | null

const rows = (value: unknown): Row[] => Array.isArray(value)
  ? value.filter((entry): entry is Row => Boolean(entry) && typeof entry === 'object')
  : []
const text = (value: unknown): string => typeof value === 'string' ? value : ''
const nullableText = (value: unknown): string | null => text(value) || null
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value)
  ? value as Record<string, unknown>
  : {}

function fail(operation: string, error: DbError): MarketplaceError {
  const missing = error?.code === '42P01' || String(error?.message || '').includes('commerce_')
  return new MarketplaceError(
    missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missing
      ? 'La migration Complete Commerce Administration doit être appliquée.'
      : `Impossible de ${operation}.`,
    { cause: error || undefined },
  )
}

const TABLES: Record<CommerceResource, string> = {
  media: 'angelcare_marketplace_media_assets',
  'media-folders': 'angelcare_marketplace_media_folders',
  'homepage-sections': 'angelcare_marketplace_homepage_sections',
  'homepage-campaigns': 'angelcare_marketplace_homepage_campaigns',
  'homepage-collections': 'angelcare_marketplace_homepage_collections',
  'homepage-collection-items': 'angelcare_marketplace_homepage_collection_items',
  'homepage-placements': 'angelcare_marketplace_homepage_placements',
  'navigation-menus': 'angelcare_marketplace_cms_menus',
  'navigation-items': 'angelcare_marketplace_cms_menu_items',
  'catalog-items': 'angelcare_marketplace_catalog_items',
  'catalog-media': 'angelcare_marketplace_catalog_item_media',
  'catalog-variants': 'angelcare_marketplace_catalog_variants',
  'catalog-availability': 'angelcare_marketplace_catalog_availability',
  'catalog-categories': 'angelcare_marketplace_catalog_categories',
  'catalog-item-categories': 'angelcare_marketplace_catalog_item_categories',
  'catalog-attributes': 'angelcare_marketplace_catalog_attribute_definitions',
  'price-rules': 'angelcare_marketplace_finance_price_rules',
  'merchandising-rules': 'angelcare_marketplace_merchandising_rules',
  versions: 'angelcare_marketplace_commerce_versions',
  'publication-events': 'angelcare_marketplace_commerce_publication_events',
  'cache-events': 'angelcare_marketplace_cache_refresh_events',
}

const ARCHIVE_STATUS: Partial<Record<CommerceResource, string>> = {
  media: 'archived',
  'media-folders': 'archived',
  'homepage-sections': 'archived',
  'homepage-campaigns': 'archived',
  'homepage-collections': 'archived',
  'homepage-collection-items': 'archived',
  'homepage-placements': 'archived',
  'navigation-menus': 'archived',
  'navigation-items': 'archived',
  'catalog-items': 'archived',
  'catalog-media': 'archived',
  'catalog-variants': 'archived',
  'catalog-categories': 'archived',
  'merchandising-rules': 'archived',
}

function mapMedia(row: Row): MediaAsset {
  return {
    ...row,
    id: text(row.id), asset_key: text(row.asset_key), folder_id: nullableText(row.folder_id),
    file_name: text(row.file_name), media_type: text(row.media_type), mime_type: text(row.mime_type),
    storage_bucket: text(row.storage_bucket), storage_path: text(row.storage_path), public_url: text(row.public_url),
    desktop_url: text(row.desktop_url), tablet_url: nullableText(row.tablet_url), mobile_url: nullableText(row.mobile_url),
    square_url: nullableText(row.square_url), alt_text_fr: text(row.alt_text_fr), alt_text_en: nullableText(row.alt_text_en),
    alt_text_ar: nullableText(row.alt_text_ar), focal_point: record(row.focal_point), rights_status: text(row.rights_status),
    rights_expires_at: nullableText(row.rights_expires_at), usage_count: Number(row.usage_count || 0),
    status: text(row.status), created_at: text(row.created_at), updated_at: text(row.updated_at),
  }
}

function mapSection(row: Row): HomepageSectionRecord {
  return {
    ...row,
    id: text(row.id), section_key: text(row.section_key), section_type: text(row.section_type),
    locale: (text(row.locale) || 'fr') as HomepageSectionRecord['locale'], title: text(row.title),
    subtitle: nullableText(row.subtitle), layout_variant: text(row.layout_variant), sort_order: Number(row.sort_order || 0),
    settings: record(row.settings), visible: row.visible !== false, audience: text(row.audience) || 'all',
    starts_at: nullableText(row.starts_at), ends_at: nullableText(row.ends_at),
    background_variant: text(row.background_variant) || 'white', accent: text(row.accent) || 'navy', status: text(row.status),
  }
}

function mapCategory(row: Row): CatalogCategoryAdmin {
  return {
    ...row,
    id: text(row.id), category_key: text(row.category_key), locale: (text(row.locale) || 'fr') as CatalogCategoryAdmin['locale'],
    title: text(row.title), short_description: nullableText(row.short_description), slug: text(row.slug),
    parent_category_id: nullableText(row.parent_category_id), cover_asset_url: nullableText(row.cover_asset_url),
    mobile_cover_asset_url: nullableText(row.mobile_cover_asset_url), icon_key: nullableText(row.icon_key),
    visual_theme: text(row.visual_theme) || 'navy', storefront_template: text(row.storefront_template) || 'mixed',
    sort_order: Number(row.sort_order || 0), visible: row.visible !== false, status: text(row.status),
    seo_metadata: record(row.seo_metadata), item_count: Number(row.item_count || 0),
  }
}

function mapItem(row: Row): CatalogAdminItem {
  return {
    ...row,
    id: text(row.id), public_reference: text(row.public_reference), item_key: text(row.item_key), sku: nullableText(row.sku),
    slug: text(row.slug), kind: text(row.kind), sellable_type: text(row.sellable_type) || text(row.kind), name_fr: text(row.name_fr), name_en: nullableText(row.name_en),
    name_ar: nullableText(row.name_ar), short_description_fr: nullableText(row.short_description_fr),
    short_description_en: nullableText(row.short_description_en), short_description_ar: nullableText(row.short_description_ar),
    description_fr: nullableText(row.description_fr), description_en: nullableText(row.description_en),
    description_ar: nullableText(row.description_ar), price_mode: text(row.price_mode),
    price_amount: row.price_amount === null || row.price_amount === undefined ? null : Number(row.price_amount),
    currency_label: text(row.currency_label) || 'Dh', featured: Boolean(row.featured),
    availability_status: text(row.availability_status), status: text(row.status),
    commercial_metadata: record(row.commercial_metadata), seo_metadata: record(row.seo_metadata), attributes: record(row.attributes),
    variants: rows(row.variants) as CommerceRecord[], media: rows(row.media) as CommerceRecord[], availability: rows(row.availability) as CommerceRecord[], categories: rows(row.categories) as CommerceRecord[],
    priceRules: rows(row.priceRules) as CommerceRecord[],
  }
}

async function countRows(table: string, filters: Array<[string, string | number | boolean]> = []): Promise<number> {
  const db = await createServiceClient()
  let query = db.from(table).select('id', { count: 'exact', head: true })
  for (const [column, value] of filters) query = query.eq(column, value)
  const { count, error } = await query
  if (error) throw fail(`compter ${table}`, error)
  return count || 0
}

export async function commerceStudioSummary(): Promise<CommerceStudioSummary> {
  const db = await createServiceClient()
  const [
    liveHomepageSections, activeCampaigns, publishedProducts, publishedCategories,
    activeNavigationItems, mediaAssets, missingMedia, missingPrice, missingCategory,
    missingTranslation, featuredProducts, popularProducts, bestPickProducts, availableNowProducts,
  ] = await Promise.all([
    countRows('angelcare_marketplace_homepage_sections', [['status', 'active'], ['visible', true]]),
    countRows('angelcare_marketplace_homepage_campaigns', [['status', 'active']]),
    countRows('angelcare_marketplace_catalog_items', [['status', 'published']]),
    countRows('angelcare_marketplace_catalog_categories', [['status', 'published'], ['visible', true]]),
    countRows('angelcare_marketplace_cms_menu_items', [['status', 'active']]),
    countRows('angelcare_marketplace_media_assets', [['status', 'active']]),
    countRows('angelcare_marketplace_commerce_item_admin_v', [['missing_media', true]]),
    countRows('angelcare_marketplace_commerce_item_admin_v', [['missing_price', true]]),
    countRows('angelcare_marketplace_commerce_item_admin_v', [['missing_category', true]]),
    countRows('angelcare_marketplace_commerce_item_admin_v', [['missing_translation', true]]),
    countRows('angelcare_marketplace_catalog_items', [['featured', true], ['status', 'published']]),
    countRows('angelcare_marketplace_homepage_placements', [['merchandising_badge', 'popular'], ['status', 'active']]),
    countRows('angelcare_marketplace_homepage_placements', [['merchandising_badge', 'best-pick'], ['status', 'active']]),
    countRows('angelcare_marketplace_homepage_placements', [['merchandising_badge', 'available-now'], ['status', 'active']]),
  ])
  const [{ data: recent }, { data: failed }] = await Promise.all([
    db.from('angelcare_marketplace_commerce_publication_events').select('*').eq('status', 'completed').order('created_at', { ascending: false }).limit(12),
    db.from('angelcare_marketplace_commerce_publication_events').select('*').eq('status', 'failed').order('created_at', { ascending: false }).limit(12),
  ])
  return {
    liveHomepageSections, activeCampaigns, publishedProducts, publishedCategories, activeNavigationItems,
    mediaAssets, missingMedia, missingPrice, missingCategory, missingTranslation, featuredProducts,
    popularProducts, bestPickProducts, availableNowProducts,
    recentPublications: rows(recent) as CommerceRecord[], failedPublications: rows(failed) as CommerceRecord[],
  }
}

export async function commerceStudioData(context: MarketplaceRequestContext): Promise<CommerceStudioData> {
  const db = await createServiceClient()
  const scopedTerritory = context.territoryId
  const territoryFilter = <T extends { or: (value: string) => T }>(query: T): T => scopedTerritory
    ? query.or(`territory_id.is.null,territory_id.eq.${scopedTerritory}`)
    : query
  const [summary, media, sections, campaigns, collections, placements, menus, items, categories, priceBooks, territories, versions, events] = await Promise.all([
    commerceStudioSummary(),
    db.from('angelcare_marketplace_media_assets').select('*').order('updated_at', { ascending: false }).limit(500),
    territoryFilter(db.from('angelcare_marketplace_homepage_sections').select('*')).order('sort_order'),
    territoryFilter(db.from('angelcare_marketplace_homepage_campaigns').select('*')).order('priority'),
    territoryFilter(db.from('angelcare_marketplace_homepage_collections').select('*,items:angelcare_marketplace_homepage_collection_items(*)')).order('sort_order'),
    territoryFilter(db.from('angelcare_marketplace_homepage_placements').select('*')).order('sort_order'),
    territoryFilter(db.from('angelcare_marketplace_cms_menus').select('*,items:angelcare_marketplace_cms_menu_items(*)')).order('locale'),
    territoryFilter(db.from('angelcare_marketplace_commerce_item_admin_v').select('*')).order('updated_at', { ascending: false }).limit(500),
    territoryFilter(db.from('angelcare_marketplace_category_admin_v').select('*')).order('sort_order').limit(500),
    territoryFilter(db.from('angelcare_marketplace_finance_price_books').select('*')).order('updated_at', { ascending: false }).limit(250),
    db.from('angelcare_marketplace_territories').select('id,territory_code,name,status,currency_label').order('name'),
    db.from('angelcare_marketplace_commerce_versions').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('angelcare_marketplace_commerce_publication_events').select('*').order('created_at', { ascending: false }).limit(100),
  ])
  for (const result of [media, sections, campaigns, collections, placements, menus, items, categories]) {
    if (result.error) throw fail('charger Commerce Studio', result.error)
  }
  return {
    summary,
    media: rows(media.data).map(mapMedia), sections: rows(sections.data).map(mapSection),
    campaigns: rows(campaigns.data) as CommerceRecord[], collections: rows(collections.data) as CommerceRecord[],
    placements: rows(placements.data) as MerchandisingAssignment[], menus: rows(menus.data) as NavigationMenuRecord[],
    catalogItems: rows(items.data).map(mapItem), categories: rows(categories.data).map(mapCategory),
    priceBooks: rows(priceBooks.data) as CommerceRecord[], territories: rows(territories.data) as CommerceRecord[],
    versions: rows(versions.data) as CommerceRecord[], publicationEvents: rows(events.data) as CommerceRecord[],
  }
}

export async function listCommerceResource(resource: CommerceResource, filters: Record<string, string> = {}): Promise<CommerceRecord[]> {
  const db = await createServiceClient()
  let query = db.from(TABLES[resource]).select('*')
  for (const [key, value] of Object.entries(filters)) if (value) query = query.eq(key, value)
  const orderColumn = resource === 'navigation-items' || resource.includes('sections') || resource.includes('collections') || resource.includes('placements')
    ? 'sort_order' : 'updated_at'
  const { data, error } = await query.order(orderColumn, { ascending: orderColumn === 'sort_order' }).limit(1000)
  if (error) throw fail(`charger ${resource}`, error)
  return rows(data) as CommerceRecord[]
}

export async function getCommerceResource(resource: CommerceResource, id: string): Promise<CommerceRecord | null> {
  const db = await createServiceClient()
  let query = db.from(TABLES[resource]).select('*').eq('id', id)
  if (resource === 'catalog-items') {
    query = db.from(TABLES[resource]).select('*,variants:angelcare_marketplace_catalog_variants(*),media:angelcare_marketplace_catalog_item_media(*),availability:angelcare_marketplace_catalog_availability(*),categories:angelcare_marketplace_catalog_item_categories(*),priceRules:angelcare_marketplace_finance_price_rules(*)').eq('id', id)
  }
  if (resource === 'catalog-categories') {
    query = db.from(TABLES[resource]).select('*,items:angelcare_marketplace_catalog_item_categories(*)').eq('id', id)
  }
  if (resource === 'homepage-collections') {
    query = db.from(TABLES[resource]).select('*,items:angelcare_marketplace_homepage_collection_items(*)').eq('id', id)
  }
  const { data, error } = await query.maybeSingle()
  if (error) throw fail(`charger ${resource}`, error)
  return data as CommerceRecord | null
}

function normalizedPayload(resource: CommerceResource, payload: Row, context: MarketplaceRequestContext): Row {
  const common: Row = { updated_at: new Date().toISOString(), updated_by: context.actor.id }
  if (resource === 'media-folders') return {
    ...payload, ...common,
    name: text(payload.name),
    slug: text(payload.slug) || slugify(text(payload.name)),
    parent_id: nullableText(payload.parent_id),
    status: text(payload.status) || 'active',
    created_by: context.actor.id,
    updated_by: context.actor.id,
  }
  if (resource === 'media') return {
    ...payload, ...common, asset_key: text(payload.asset_key) || `media-${crypto.randomUUID()}`,
    file_name: text(payload.file_name), media_type: text(payload.media_type) || 'image', mime_type: text(payload.mime_type),
    storage_bucket: text(payload.storage_bucket) || 'angelcare-marketplace-media', storage_path: text(payload.storage_path),
    public_url: text(payload.public_url), desktop_url: text(payload.desktop_url) || text(payload.public_url),
    tablet_url: nullableText(payload.tablet_url), mobile_url: nullableText(payload.mobile_url), square_url: nullableText(payload.square_url),
    alt_text_fr: text(payload.alt_text_fr), alt_text_en: nullableText(payload.alt_text_en), alt_text_ar: nullableText(payload.alt_text_ar),
    focal_point: payload.focal_x !== undefined || payload.focal_y !== undefined ? { x: safeNumber(payload.focal_x, 50), y: safeNumber(payload.focal_y, 50) } : safeJson(payload.focal_point), rights_status: text(payload.rights_status) || 'owned', status: text(payload.status) || 'active',
  }
  if (resource === 'homepage-sections') return {
    ...payload, ...common, section_key: text(payload.section_key) || slugify(text(payload.title)), locale: text(payload.locale) || 'fr',
    section_type: text(payload.section_type) || 'custom_product_grid', title: text(payload.title), subtitle: nullableText(payload.subtitle),
    layout_variant: text(payload.layout_variant) || 'rail', sort_order: safeNumber(payload.sort_order, 100), settings: { ...safeJson(payload.settings), ...(payload.collection_id ? { collection_id: String(payload.collection_id) } : {}) },
    visible: safeBoolean(payload.visible, true), audience: text(payload.audience) || 'all', starts_at: nullableText(payload.starts_at),
    ends_at: nullableText(payload.ends_at), background_variant: text(payload.background_variant) || 'white',
    accent: text(payload.accent) || 'navy', status: text(payload.status) || 'active',
  }
  if (resource === 'homepage-campaigns') return {
    ...payload, ...common, campaign_key: text(payload.campaign_key) || slugify(text(payload.title)), locale: text(payload.locale) || 'fr',
    title: text(payload.title), eyebrow: nullableText(payload.eyebrow), subtitle: nullableText(payload.subtitle),
    primary_cta_label: text(payload.primary_cta_label), primary_cta_href: text(payload.primary_cta_href),
    secondary_cta_label: nullableText(payload.secondary_cta_label), secondary_cta_href: nullableText(payload.secondary_cta_href),
    desktop_asset_url: text(payload.desktop_asset_url), tablet_asset_url: nullableText(payload.tablet_asset_url),
    mobile_asset_url: nullableText(payload.mobile_asset_url), audience: text(payload.audience) || 'all',
    priority: safeNumber(payload.priority, 100), starts_at: nullableText(payload.starts_at) || new Date().toISOString(),
    ends_at: nullableText(payload.ends_at), status: text(payload.status) || 'active',
  }
  if (resource === 'navigation-menus') return {
    ...payload, ...common, menu_key: text(payload.menu_key) || slugify(text(payload.name)), name: text(payload.name),
    locale: text(payload.locale) || 'fr', status: text(payload.status) || 'published', owner_id: context.actor.id,
  }
  if (resource === 'navigation-items') return {
    ...payload, ...common, label: text(payload.label_fr) || text(payload.label), label_fr: nullableText(payload.label_fr) || text(payload.label),
    label_en: nullableText(payload.label_en), label_ar: nullableText(payload.label_ar), href: assertInternalOrHttpUrl(text(payload.href), 'Destination'),
    parent_id: nullableText(payload.parent_id), sort_order: safeNumber(payload.sort_order, 0), visibility: text(payload.visibility) || 'public',
    icon_key: nullableText(payload.icon_key), image_asset_id: nullableText(payload.image_asset_id),
    desktop_visible: safeBoolean(payload.desktop_visible, true), mobile_visible: safeBoolean(payload.mobile_visible, true), status: text(payload.status) || 'active',
  }
  if (resource === 'catalog-items') return {
    ...payload, ...common, item_key: text(payload.item_key) || slugify(text(payload.name_fr)), sku: nullableText(payload.sku),
    slug: text(payload.slug) || slugify(text(payload.name_fr)), kind: text(payload.kind) || 'product', sellable_type: text(payload.sellable_type) || text(payload.kind) || 'physical_product', name_fr: text(payload.name_fr),
    name_en: nullableText(payload.name_en), name_ar: nullableText(payload.name_ar), short_description_fr: nullableText(payload.short_description_fr),
    short_description_en: nullableText(payload.short_description_en), short_description_ar: nullableText(payload.short_description_ar),
    description_fr: nullableText(payload.description_fr), description_en: nullableText(payload.description_en), description_ar: nullableText(payload.description_ar),
    currency_label: text(payload.currency_label) || 'Dh', price_mode: text(payload.price_mode) || 'quote_only',
    price_amount: payload.price_amount === '' || payload.price_amount === null || payload.price_amount === undefined ? null : safeNumber(payload.price_amount),
    featured: safeBoolean(payload.featured), availability_status: text(payload.availability_status) || 'configuration_required',
    commercial_metadata: safeJson(payload.commercial_metadata), seo_metadata: safeJson(payload.seo_metadata), attributes: safeJson(payload.attributes),
    status: text(payload.status) || 'draft', created_by: context.actor.id,
  }
  if (resource === 'catalog-categories') return {
    ...payload, ...common, category_key: text(payload.category_key) || slugify(text(payload.title)), locale: text(payload.locale) || 'fr',
    title: text(payload.title), short_description: nullableText(payload.short_description), slug: text(payload.slug) || slugify(text(payload.title)),
    parent_category_id: nullableText(payload.parent_category_id), cover_asset_url: nullableText(payload.cover_asset_url),
    mobile_cover_asset_url: nullableText(payload.mobile_cover_asset_url), icon_key: nullableText(payload.icon_key),
    visual_theme: text(payload.visual_theme) || 'navy', storefront_template: text(payload.storefront_template) || 'mixed',
    allowed_sellable_types: safeArray(payload.allowed_sellable_types), available_filters: safeJson(payload.available_filters),
    sort_order: safeNumber(payload.sort_order, 100), visible: safeBoolean(payload.visible, true), seo_metadata: safeJson(payload.seo_metadata),
    status: text(payload.status) || 'draft', created_by: context.actor.id,
  }
  if (resource === 'homepage-collections') return {
    ...payload, ...common, collection_key: text(payload.collection_key) || slugify(text(payload.title)), locale: text(payload.locale) || 'fr',
    title: text(payload.title), subtitle: nullableText(payload.subtitle), description: nullableText(payload.description),
    selection_method: text(payload.selection_method) || 'editorial', layout_variant: text(payload.layout_variant) || 'service_cards',
    sort_order: safeNumber(payload.sort_order, 100), item_limit: safeNumber(payload.item_limit, 12), audience: text(payload.audience) || 'all',
    starts_at: nullableText(payload.starts_at), ends_at: nullableText(payload.ends_at), settings: safeJson(payload.settings),
    status: text(payload.status) || 'active', created_by: context.actor.id,
  }
  if (resource === 'homepage-placements') return {
    ...payload, ...common, placement_key: text(payload.placement_key) || `placement-${crypto.randomUUID()}`,
    section_id: nullableText(payload.section_id), collection_id: nullableText(payload.collection_id), catalog_item_id: nullableText(payload.catalog_item_id),
    locale: text(payload.locale) || 'fr', audience: text(payload.audience) || 'all', merchandising_badge: nullableText(payload.merchandising_badge),
    custom_title: nullableText(payload.custom_title), custom_subtitle: nullableText(payload.custom_subtitle), media_asset_id: nullableText(payload.media_asset_id),
    cta_label: nullableText(payload.cta_label), cta_href: nullableText(payload.cta_href), priority: safeNumber(payload.priority, 100),
    sort_order: safeNumber(payload.sort_order, 100), starts_at: nullableText(payload.starts_at) || new Date().toISOString(),
    ends_at: nullableText(payload.ends_at), status: text(payload.status) || 'active', created_by: context.actor.id,
  }
  if (resource === 'catalog-media') return {
    catalog_item_id: text(payload.catalog_item_id),
    media_key: text(payload.media_key) || `media-${crypto.randomUUID()}`,
    media_type: text(payload.media_type) || 'image',
    asset_url: text(payload.asset_url),
    alt_text_fr: text(payload.alt_text_fr),
    alt_text_en: nullableText(payload.alt_text_en),
    alt_text_ar: nullableText(payload.alt_text_ar),
    sort_order: safeNumber(payload.sort_order, 100),
    status: text(payload.status) || 'active',
    updated_at: new Date().toISOString(),
    updated_by: context.actor.id,
  }
  if (resource === 'homepage-collection-items') return {
    collection_id: text(payload.collection_id),
    catalog_item_id: text(payload.catalog_item_id),
    sort_order: safeNumber(payload.sort_order, 100),
    merchandising_reason: nullableText(payload.merchandising_reason),
    starts_at: nullableText(payload.starts_at) || new Date().toISOString(),
    ends_at: nullableText(payload.ends_at),
    status: text(payload.status) || 'active',
    updated_at: new Date().toISOString(),
    updated_by: context.actor.id,
  }
  if (resource === 'catalog-item-categories') return {
    catalog_item_id: text(payload.catalog_item_id),
    category_id: text(payload.category_id),
    is_primary: safeBoolean(payload.is_primary),
    sort_order: safeNumber(payload.sort_order, 100),
    updated_at: new Date().toISOString(),
    updated_by: context.actor.id,
  }
  if (resource === 'catalog-variants') return {
    ...payload, ...common, variant_key: text(payload.variant_key) || slugify(text(payload.name_fr)), sku: nullableText(payload.sku),
    name_fr: text(payload.name_fr), name_en: nullableText(payload.name_en), name_ar: nullableText(payload.name_ar),
    configuration: safeJson(payload.configuration), option_values: safeJson(payload.option_values),
    price_delta: payload.price_delta === '' ? null : safeNumber(payload.price_delta), price_override: payload.price_override === '' ? null : safeNumber(payload.price_override),
    media_asset_id: nullableText(payload.media_asset_id), inventory_reference: nullableText(payload.inventory_reference),
    available: safeBoolean(payload.available, true), sort_order: safeNumber(payload.sort_order, 0), status: text(payload.status) || 'active',
  }
  if (resource === 'catalog-availability') return {
    ...payload, ...common, audience: text(payload.audience) || 'all', available: safeBoolean(payload.available),
    capacity_limit: payload.capacity_limit === '' ? null : safeNumber(payload.capacity_limit), starts_at: nullableText(payload.starts_at),
    ends_at: nullableText(payload.ends_at), reason: nullableText(payload.reason), updated_by: context.actor.id,
  }
  if (resource === 'price-rules') return {
    ...payload, ...common, pricing_model: text(payload.pricing_model) || 'fixed', unit_label: nullableText(payload.unit_label),
    minimum_price: payload.minimum_price === '' ? null : safeNumber(payload.minimum_price),
    standard_price: safeNumber(payload.standard_price), maximum_price: payload.maximum_price === '' ? null : safeNumber(payload.maximum_price),
    status: text(payload.status) || 'active', created_by: context.actor.id,
  }
  if (resource === 'merchandising-rules') return {
    ...payload, ...common, rule_key: text(payload.rule_key) || slugify(text(payload.name)), name: text(payload.name),
    rule_type: text(payload.rule_type) || 'manual_priority', conditions: safeJson(payload.conditions), sort: safeJson(payload.sort),
    item_limit: safeNumber(payload.item_limit, 12), locale: text(payload.locale) || 'fr', audience: text(payload.audience) || 'all',
    starts_at: nullableText(payload.starts_at), ends_at: nullableText(payload.ends_at), status: text(payload.status) || 'active',
    created_by: context.actor.id,
  }
  return { ...payload, ...common }
}

async function versionRecord(input: { resource: CommerceResource; row: Row; action: string; actorId: string }): Promise<void> {
  const db = await createServiceClient()
  const objectId = text(input.row.id)
  if (!objectId) return
  const { data } = await db.from('angelcare_marketplace_commerce_versions').select('version_number').eq('object_type', input.resource).eq('object_id', objectId).order('version_number', { ascending: false }).limit(1).maybeSingle()
  await db.from('angelcare_marketplace_commerce_versions').insert({
    object_type: input.resource, object_id: objectId, version_number: Number(data?.version_number || 0) + 1,
    action: input.action, snapshot: input.row, created_by: input.actorId,
  })
}

async function publicationEvent(input: {
  resource: CommerceResource
  row: Row
  action: string
  actorId: string
  paths: string[]
  status?: string
  error?: string | null
}): Promise<string | null> {
  const db = await createServiceClient()
  const { data } = await db.from('angelcare_marketplace_commerce_publication_events').insert({
    object_type: input.resource, object_id: text(input.row.id), action: input.action,
    locale: nullableText(input.row.locale), territory_id: nullableText(input.row.territory_id),
    status: input.status || 'completed', affected_paths: input.paths, error_message: input.error || null,
    executed_by: input.actorId, completed_at: input.status === 'failed' ? null : new Date().toISOString(),
  }).select('id').maybeSingle()
  return data?.id ? String(data.id) : null
}

async function assertNoHierarchyCycle(resource: CommerceResource, id: string | null, parentId: string | null): Promise<void> {
  if (!parentId) return
  if (id && parentId === id) throw new MarketplaceError('VALIDATION_ERROR', 'Un objet ne peut pas devenir son propre parent.')
  const db = await createServiceClient()
  const table = resource === 'navigation-items'
    ? 'angelcare_marketplace_cms_menu_items'
    : resource === 'catalog-categories'
      ? 'angelcare_marketplace_catalog_categories'
      : null
  if (!table) return
  let cursor: string | null = parentId
  const visited = new Set<string>()
  for (let depth = 0; cursor && depth < 50; depth += 1) {
    if (visited.has(cursor) || (id && cursor === id)) throw new MarketplaceError('VALIDATION_ERROR', 'Hiérarchie circulaire interdite.')
    visited.add(cursor)
    const hierarchyResult = await db
      .from(table)
      .select('parent_id,parent_category_id')
      .eq('id', cursor)
      .maybeSingle()
    const hierarchyData = hierarchyResult.data as Row | null
    if (hierarchyResult.error) throw fail('vérifier la hiérarchie', hierarchyResult.error)
    if (!hierarchyData) break
    cursor = resource === 'navigation-items'
      ? nullableText(hierarchyData.parent_id)
      : nullableText(hierarchyData.parent_category_id)
  }
}

export async function createCommerceResource(input: {
  resource: CommerceResource
  payload: Row
  context: MarketplaceRequestContext
}): Promise<CommerceMutationResult> {
  const db = await createServiceClient()
  const payload = normalizedPayload(input.resource, input.payload, input.context)
  if (input.resource === 'navigation-items') await assertNoHierarchyCycle(input.resource, null, nullableText(payload.parent_id))
  if (input.resource === 'catalog-categories') await assertNoHierarchyCycle(input.resource, null, nullableText(payload.parent_category_id))
  const { data, error } = await db.from(TABLES[input.resource]).insert(payload).select('*').single()
  if (error || !data) throw fail(`créer ${input.resource}`, error)
  await versionRecord({ resource: input.resource, row: data as Row, action: 'created', actorId: input.context.actor.id })
  const paths = affectedCommercePaths({ objectType: input.resource, locale: nullableText((data as Row).locale), slug: nullableText((data as Row).slug) })
  refreshCommerceSurfaces(paths)
  const eventId = await publicationEvent({ resource: input.resource, row: data as Row, action: 'created', actorId: input.context.actor.id, paths })
  return { record: data as CommerceRecord, affectedPaths: paths, publicationEventId: eventId }
}

export async function updateCommerceResource(input: {
  resource: CommerceResource
  id: string
  payload: Row
  context: MarketplaceRequestContext
}): Promise<CommerceMutationResult> {
  const db = await createServiceClient()
  const { data: current, error: currentError } = await db
    .from(TABLES[input.resource])
    .select('*')
    .eq('id', input.id)
    .maybeSingle()
  if (currentError) throw fail(`charger ${input.resource} avant modification`, currentError)
  if (!current) throw new MarketplaceError('NOT_FOUND', 'Objet commercial introuvable.')
  const payload = normalizedPayload(
    input.resource,
    { ...(current as Row), ...input.payload },
    input.context,
  )
  if (input.resource === 'navigation-items') await assertNoHierarchyCycle(input.resource, input.id, nullableText(payload.parent_id))
  if (input.resource === 'catalog-categories') await assertNoHierarchyCycle(input.resource, input.id, nullableText(payload.parent_category_id))
  delete payload.id
  delete payload.created_at
  delete payload.created_by
  delete payload.owner_id
  delete payload.public_reference
  const { data, error } = await db.from(TABLES[input.resource]).update(payload).eq('id', input.id).select('*').single()
  if (error || !data) throw fail(`mettre à jour ${input.resource}`, error)
  await versionRecord({ resource: input.resource, row: data as Row, action: 'updated', actorId: input.context.actor.id })
  const paths = affectedCommercePaths({ objectType: input.resource, locale: nullableText((data as Row).locale), slug: nullableText((data as Row).slug) })
  refreshCommerceSurfaces(paths)
  const eventId = await publicationEvent({ resource: input.resource, row: data as Row, action: 'updated', actorId: input.context.actor.id, paths })
  return { record: data as CommerceRecord, affectedPaths: paths, publicationEventId: eventId }
}

export async function archiveCommerceResource(input: {
  resource: CommerceResource
  id: string
  context: MarketplaceRequestContext
}): Promise<CommerceMutationResult> {
  const db = await createServiceClient()
  const status = ARCHIVE_STATUS[input.resource]
  const patch: Row = status
    ? { status, updated_at: new Date().toISOString(), updated_by: input.context.actor.id }
    : { updated_at: new Date().toISOString(), updated_by: input.context.actor.id }
  const { data, error } = status
    ? await db.from(TABLES[input.resource]).update(patch).eq('id', input.id).select('*').single()
    : await db.from(TABLES[input.resource]).delete().eq('id', input.id).select('*').single()
  if (error || !data) throw fail(`archiver ${input.resource}`, error)
  await versionRecord({ resource: input.resource, row: data as Row, action: 'archived', actorId: input.context.actor.id })
  const paths = affectedCommercePaths({ objectType: input.resource, locale: nullableText((data as Row).locale), slug: nullableText((data as Row).slug) })
  refreshCommerceSurfaces(paths)
  const eventId = await publicationEvent({ resource: input.resource, row: data as Row, action: 'archived', actorId: input.context.actor.id, paths })
  return { record: data as CommerceRecord, affectedPaths: paths, publicationEventId: eventId }
}

function statusForAction(resource: CommerceResource, action: string): string | null {
  if (action === 'publish' || action === 'restore') {
    if (resource === 'catalog-items' || resource === 'catalog-categories') return 'published'
    if (resource === 'navigation-menus') return 'published'
    return 'active'
  }
  if (action === 'unpublish') {
    if (resource === 'catalog-items' || resource === 'catalog-categories') return 'paused'
    if (resource === 'navigation-menus') return 'draft'
    return 'paused'
  }
  return null
}

export async function commerceResourceAction(input: {
  resource: CommerceResource
  id: string
  action: string
  payload: Row
  context: MarketplaceRequestContext
}): Promise<CommerceMutationResult> {
  const db = await createServiceClient()
  if (input.id === 'bulk' && ['publish', 'unpublish', 'archive', 'restore'].includes(input.action)) {
    const ids = Array.isArray(input.payload.ids) ? input.payload.ids.map(String).filter(Boolean) : []
    if (!ids.length) throw new MarketplaceError('VALIDATION_ERROR', 'Sélection vide pour l’action groupée.')
    const targetStatus = input.action === 'archive' ? ARCHIVE_STATUS[input.resource] || 'archived' : statusForAction(input.resource, input.action)
    if (!targetStatus) throw new MarketplaceError('VALIDATION_ERROR', 'Action groupée inconnue.')
    const { data, error } = await db.from(TABLES[input.resource]).update({
      status: targetStatus,
      updated_at: new Date().toISOString(),
      updated_by: input.context.actor.id,
    }).in('id', ids).select('*')
    if (error) throw fail(`appliquer ${input.action} en masse`, error)
    const updatedRows = rows(data)
    const paths = affectedCommercePaths({ objectType: input.resource })
    refreshCommerceSurfaces(paths)
    const eventRow: Row = { id: 'bulk', ids, status: targetStatus, count: updatedRows.length }
    const eventId = await publicationEvent({ resource: input.resource, row: eventRow, action: `bulk.${input.action}`, actorId: input.context.actor.id, paths })
    return { record: eventRow as CommerceRecord, affectedPaths: paths, publicationEventId: eventId }
  }
  if (input.action === 'archive') {
    return archiveCommerceResource({ resource: input.resource, id: input.id, context: input.context })
  }
  if (input.action === 'duplicate') {
    const original = await getCommerceResource(input.resource, input.id)
    if (!original) throw new MarketplaceError('NOT_FOUND', 'Objet à dupliquer introuvable.')
    const duplicate: Row = { ...original }
    delete duplicate.id; delete duplicate.public_reference; delete duplicate.created_at; delete duplicate.updated_at
    for (const key of ['item_key','slug','section_key','campaign_key','collection_key','placement_key','menu_key','asset_key']) {
      if (typeof duplicate[key] === 'string') duplicate[key] = `${duplicate[key]}-copy-${Date.now()}`
    }
    if (typeof duplicate.title === 'string') duplicate.title = `${duplicate.title} — copie`
    if (typeof duplicate.name === 'string') duplicate.name = `${duplicate.name} — copie`
    duplicate.status = input.resource === 'catalog-items' || input.resource === 'catalog-categories' ? 'draft' : 'paused'
    return createCommerceResource({ resource: input.resource, payload: duplicate, context: input.context })
  }
  if (input.action === 'rollback') {
    const versionNumber = safeNumber(input.payload.version_number)
    const { data: version, error } = await db.from('angelcare_marketplace_commerce_versions').select('*').eq('object_type', input.resource).eq('object_id', input.id).eq('version_number', versionNumber).single()
    if (error || !version) throw fail('charger la version', error)
    const snapshot = record(version.snapshot)
    delete snapshot.id; delete snapshot.created_at; delete snapshot.updated_at
    return updateCommerceResource({ resource: input.resource, id: input.id, payload: snapshot, context: input.context })
  }
  if (input.action === 'reorder') {
    const orderedIds = Array.isArray(input.payload.ordered_ids) ? input.payload.ordered_ids.map(String) : []
    let index = 0
    for (const id of orderedIds) {
      await db.from(TABLES[input.resource]).update({ sort_order: index * 10, updated_at: new Date().toISOString(), updated_by: input.context.actor.id }).eq('id', id)
      index += 1
    }
    const paths = affectedCommercePaths({ objectType: input.resource })
    refreshCommerceSurfaces(paths)
    const row: Row = { id: input.id || 'bulk-reorder', ordered_ids: orderedIds }
    const eventId = await publicationEvent({ resource: input.resource, row, action: 'reordered', actorId: input.context.actor.id, paths })
    return { record: row as CommerceRecord, affectedPaths: paths, publicationEventId: eventId }
  }
  if (input.action === 'assign-category') {
    const categoryIds = Array.isArray(input.payload.category_ids) ? input.payload.category_ids.map(String) : []
    await db.from('angelcare_marketplace_catalog_item_categories').delete().eq('catalog_item_id', input.id)
    if (categoryIds.length) {
      const assignments = categoryIds.map((categoryId, index) => ({ catalog_item_id: input.id, category_id: categoryId, is_primary: index === 0, sort_order: index * 10 }))
      const { error } = await db.from('angelcare_marketplace_catalog_item_categories').insert(assignments)
      if (error) throw fail('assigner les catégories', error)
    }
    const item = await getCommerceResource('catalog-items', input.id)
    const paths = affectedCommercePaths({ objectType: 'catalog-items', slug: item ? nullableText(item.slug) : null })
    refreshCommerceSurfaces(paths)
    const eventId = await publicationEvent({ resource: 'catalog-items', row: item || { id: input.id }, action: 'categories.assigned', actorId: input.context.actor.id, paths })
    return { record: item || { id: input.id }, affectedPaths: paths, publicationEventId: eventId }
  }
  if (input.action === 'assign-items' && input.resource === 'homepage-collections') {
    const itemIds = Array.isArray(input.payload.item_ids) ? input.payload.item_ids.map(String) : []
    const { error: deleteError } = await db.from('angelcare_marketplace_homepage_collection_items').delete().eq('collection_id', input.id)
    if (deleteError) throw fail('réinitialiser la collection', deleteError)
    if (itemIds.length) {
      const rowsToInsert = itemIds.map((catalogItemId, index) => ({
        collection_id: input.id,
        catalog_item_id: catalogItemId,
        sort_order: index * 10,
        merchandising_reason: text(input.payload.merchandising_reason) || 'Sélection administrateur',
        starts_at: nullableText(input.payload.starts_at) || new Date().toISOString(),
        ends_at: nullableText(input.payload.ends_at),
        status: 'active',
        updated_by: input.context.actor.id,
      }))
      const { error: insertError } = await db.from('angelcare_marketplace_homepage_collection_items').insert(rowsToInsert)
      if (insertError) throw fail('assigner les produits à la collection', insertError)
    }
    const collection = await getCommerceResource('homepage-collections', input.id)
    const paths = affectedCommercePaths({ objectType: 'homepage-collections', locale: collection ? nullableText(collection.locale) : null })
    refreshCommerceSurfaces(paths)
    const eventId = await publicationEvent({ resource: 'homepage-collections', row: collection || { id: input.id }, action: 'items.assigned', actorId: input.context.actor.id, paths })
    return { record: collection || { id: input.id }, affectedPaths: paths, publicationEventId: eventId }
  }
  if (input.action === 'assign-products' && input.resource === 'catalog-categories') {
    const itemIds = Array.isArray(input.payload.item_ids) ? input.payload.item_ids.map(String) : []
    const { error: deleteError } = await db.from('angelcare_marketplace_catalog_item_categories').delete().eq('category_id', input.id)
    if (deleteError) throw fail('réinitialiser les produits de la catégorie', deleteError)
    if (itemIds.length) {
      const assignments = itemIds.map((catalogItemId, index) => ({
        catalog_item_id: catalogItemId,
        category_id: input.id,
        is_primary: false,
        sort_order: index * 10,
      }))
      const { error: insertError } = await db.from('angelcare_marketplace_catalog_item_categories').insert(assignments)
      if (insertError) throw fail('assigner les produits à la catégorie', insertError)
    }
    const category = await getCommerceResource('catalog-categories', input.id)
    const paths = affectedCommercePaths({
      objectType: 'catalog-categories',
      locale: category ? nullableText(category.locale) : null,
      categorySlug: category ? nullableText(category.slug) : null,
    })
    refreshCommerceSurfaces(paths)
    const eventId = await publicationEvent({
      resource: 'catalog-categories',
      row: category || { id: input.id },
      action: 'products.assigned',
      actorId: input.context.actor.id,
      paths,
    })
    return { record: category || { id: input.id }, affectedPaths: paths, publicationEventId: eventId }
  }
  if (input.action === 'feature') {
    const badge = text(input.payload.merchandising_badge) || 'featured'
    if (badge === 'featured') {
      const { data, error } = await db.from('angelcare_marketplace_catalog_items').update({ featured: safeBoolean(input.payload.active, true), updated_by: input.context.actor.id, updated_at: new Date().toISOString() }).eq('id', input.id).select('*').single()
      if (error || !data) throw fail('mettre en avant le produit', error)
      const paths = affectedCommercePaths({ objectType: 'catalog-items', slug: nullableText((data as Row).slug) })
      refreshCommerceSurfaces(paths)
      const eventId = await publicationEvent({ resource: 'catalog-items', row: data as Row, action: 'featured', actorId: input.context.actor.id, paths })
      return { record: data as CommerceRecord, affectedPaths: paths, publicationEventId: eventId }
    }
    const placementKey = `${badge}-${input.id}`
    const { data, error } = await db.from('angelcare_marketplace_homepage_placements').upsert({
      placement_key: placementKey, catalog_item_id: input.id, locale: text(input.payload.locale) || 'fr',
      territory_id: nullableText(input.payload.territory_id), audience: text(input.payload.audience) || 'all',
      merchandising_badge: badge, priority: safeNumber(input.payload.priority, 100), sort_order: safeNumber(input.payload.sort_order, 100),
      starts_at: nullableText(input.payload.starts_at) || new Date().toISOString(), ends_at: nullableText(input.payload.ends_at),
      status: safeBoolean(input.payload.active, true) ? 'active' : 'suppressed', updated_by: input.context.actor.id,
    }, { onConflict: 'placement_key,locale,territory_id' }).select('*').single()
    if (error || !data) throw fail('enregistrer le merchandising', error)
    const paths = affectedCommercePaths({ objectType: 'homepage-placements' })
    refreshCommerceSurfaces(paths)
    const eventId = await publicationEvent({ resource: 'homepage-placements', row: data as Row, action: `merchandising.${badge}`, actorId: input.context.actor.id, paths })
    return { record: data as CommerceRecord, affectedPaths: paths, publicationEventId: eventId }
  }
  const targetStatus = statusForAction(input.resource, input.action)
  if (!targetStatus) throw new MarketplaceError('VALIDATION_ERROR', 'Action Commerce Studio inconnue.')
  const statusPayload: Row = { status: targetStatus }
  if (input.action === 'publish' && input.resource === 'catalog-items') statusPayload.publish_at = new Date().toISOString()
  if (input.action === 'publish' && input.resource === 'catalog-categories') statusPayload.published_at = new Date().toISOString()
  if (input.action === 'unpublish' && input.resource === 'catalog-items') statusPayload.unpublish_at = new Date().toISOString()
  return updateCommerceResource({ resource: input.resource, id: input.id, payload: statusPayload, context: input.context })
}

export async function registerUploadedMedia(input: {
  fileName: string
  mimeType: string
  storagePath: string
  publicUrl: string
  desktopUrl?: string | null
  tabletUrl?: string | null
  mobileUrl?: string | null
  squareUrl?: string | null
  width?: number | null
  height?: number | null
  sizeBytes: number
  folderId: string | null
  altTextFr: string
  context: MarketplaceRequestContext
}): Promise<MediaAsset> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_media_assets').insert({
    asset_key: `media-${crypto.randomUUID()}`, folder_id: input.folderId, file_name: input.fileName,
    media_type: input.mimeType.startsWith('video/') ? 'video' : input.mimeType === 'application/pdf' ? 'document' : 'image',
    mime_type: input.mimeType, size_bytes: input.sizeBytes, storage_bucket: 'angelcare-marketplace-media', storage_path: input.storagePath,
    public_url: input.publicUrl,
    desktop_url: input.desktopUrl || input.publicUrl,
    tablet_url: input.tabletUrl || input.desktopUrl || input.publicUrl,
    mobile_url: input.mobileUrl || input.tabletUrl || input.desktopUrl || input.publicUrl,
    square_url: input.squareUrl || input.mobileUrl || input.desktopUrl || input.publicUrl,
    width: input.width || null,
    height: input.height || null,
    alt_text_fr: input.altTextFr,
    rights_status: 'owned', status: 'active', created_by: input.context.actor.id, updated_by: input.context.actor.id,
  }).select('*').single()
  if (error || !data) throw fail('enregistrer le média', error)
  await versionRecord({ resource: 'media', row: data as Row, action: 'uploaded', actorId: input.context.actor.id })
  return mapMedia(data as Row)
}
