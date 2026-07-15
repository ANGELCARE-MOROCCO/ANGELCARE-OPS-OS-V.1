import { createClient } from '@/lib/supabase/server'
import { isSupabaseServerConfigured } from '@/lib/supabase/env'
import { listLocalAdminRows } from './local-admin-store'
import {
  academyModules,
  categories,
  gateways,
  homeSections,
  marketplaceTheme,
  packs,
  products,
} from './seed'
import type {
  AcademyModule,
  MarketplaceCategory,
  MarketplaceGateway,
  MarketplaceHomePayload,
  MarketplaceHomeSection,
  MarketplaceNavigationItem,
  MarketplacePack,
  MarketplaceProduct,
  MarketplaceThemeSettings,
  QuoteRequestPayload,
} from './types'

export function moneyMad(value: number): string {
  if (!value || value <= 0) return 'Prix catalogue à confirmer'
  return `${value.toLocaleString('fr-FR')} MAD`
}

type DbRow = Record<string, any>

function arr(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function n(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function status(value: unknown): 'draft' | 'published' | 'archived' {
  return value === 'draft' || value === 'archived' ? value : 'published'
}

function activeThemeFallback(): MarketplaceThemeSettings {
  return {
    ...marketplaceTheme,
    logoUrl: '/b2b-plaquette-partenaires/assets/angelcare-original-logo.png',
    logoAlt: 'AngelCare',
    logoWidthPx: 52,
    logoHeightPx: 52,
    logoDisplayMode: 'symbol-and-wordmark',
    customerLogoMaxWidthPx: 180,
    announcementEnabled: true,
    announcementText: 'Marketplace public sans login • Catalogue réel • Devis wholesale • Prix de gros',
    announcementCtaLabel: 'Demande rapide',
    announcementCtaHref: '/b2b-marketplace/request-quote',
    announcementBackground: '#092e63',
    announcementTextColor: '#ffffff',
    headerLayout: 'centered',
    menuStyle: 'pill',
    stickyQuoteEnabled: true,
  }
}

export function fallbackNavigation(): MarketplaceNavigationItem[] {
  return [
    { id: 'nav-catalogue', label: 'Catalogue', href: '/b2b-marketplace/categories', location: 'main-horizontal', order: 1, status: 'published' },
    { id: 'nav-products', label: 'Produits', href: '/b2b-marketplace/products', location: 'main-horizontal', order: 2, status: 'published' },
    { id: 'nav-academy', label: 'Academy', href: '/b2b-marketplace/academy', location: 'main-horizontal', order: 3, status: 'published' },
    { id: 'nav-packs', label: 'Packs', href: '/b2b-marketplace/packs', location: 'main-horizontal', order: 4, status: 'published' },
    { id: 'nav-custom', label: 'Sur-mesure', href: '/b2b-marketplace/custom-pack-builder', location: 'main-horizontal', order: 5, status: 'published' },
    { id: 'nav-quote', label: 'Devis B2B', href: '/b2b-marketplace/quote-cart', location: 'main-horizontal', order: 6, status: 'published' },
    { id: 'f-packs', label: 'Packs prêts à déployer', href: '/b2b-marketplace/packs', location: 'footer-quick', order: 1, status: 'published' },
    { id: 'f-academy', label: 'Catalogue Academy', href: '/b2b-marketplace/academy', location: 'footer-quick', order: 2, status: 'published' },
    { id: 'f-custom', label: 'Pack sur-mesure', href: '/b2b-marketplace/custom-pack-builder', location: 'footer-quick', order: 3, status: 'published' },
    { id: 'f-cart', label: 'Panier B2B', href: '/b2b-marketplace/quote-cart', location: 'footer-commercial', order: 1, status: 'published' },
    { id: 'f-request', label: 'Demande de devis', href: '/b2b-marketplace/request-quote', location: 'footer-commercial', order: 2, status: 'published' },
    { id: 'f-search', label: 'Recherche catalogue', href: '/b2b-marketplace/search', location: 'footer-commercial', order: 3, status: 'published' },
  ]
}

function mapTheme(row: DbRow): MarketplaceThemeSettings {
  return {
    id: String(row.id || row.theme_key || marketplaceTheme.id),
    name: String(row.name || marketplaceTheme.name),
    primaryColor: String(row.primary_color || marketplaceTheme.primaryColor),
    accentColor: String(row.accent_color || marketplaceTheme.accentColor),
    backgroundStyle: String(row.background_style || marketplaceTheme.backgroundStyle),
    cardRadius: String(row.card_radius || marketplaceTheme.cardRadius),
    buttonStyle: String(row.button_style || marketplaceTheme.buttonStyle),
    heroStyle: String(row.hero_style || marketplaceTheme.heroStyle),
    productCardStyle: String(row.product_card_style || marketplaceTheme.productCardStyle),
    gridDensity: row.grid_density === 'compact' || row.grid_density === 'dense' ? row.grid_density : 'comfortable',
    marketplaceMode: row.marketplace_mode === 'editorial' || row.marketplace_mode === 'wholesale' || row.marketplace_mode === 'classic' ? row.marketplace_mode : 'premium',
    logoUrl: String(row.logo_url || '/b2b-plaquette-partenaires/assets/angelcare-original-logo.png'),
    logoAlt: String(row.logo_alt || 'AngelCare'),
    logoWidthPx: n(row.logo_width_px, 52),
    logoHeightPx: n(row.logo_height_px, 52),
    logoDisplayMode: row.logo_display_mode === 'symbol-only' || row.logo_display_mode === 'wordmark-only' ? row.logo_display_mode : 'symbol-and-wordmark',
    customerLogoMaxWidthPx: n(row.customer_logo_max_width_px, 180),
    announcementEnabled: row.announcement_enabled !== false,
    announcementText: String(row.announcement_text || 'Marketplace public sans login • Catalogue réel • Devis wholesale • Prix de gros'),
    announcementCtaLabel: String(row.announcement_cta_label || 'Demande rapide'),
    announcementCtaHref: String(row.announcement_cta_href || '/b2b-marketplace/request-quote'),
    announcementBackground: String(row.announcement_background || '#092e63'),
    announcementTextColor: String(row.announcement_text_color || '#ffffff'),
    headerLayout: row.header_layout === 'split' || row.header_layout === 'compact' ? row.header_layout : 'centered',
    menuStyle: row.menu_style === 'underline' || row.menu_style === 'mega' ? row.menu_style : 'pill',
    stickyQuoteEnabled: row.sticky_quote_enabled !== false,
  }
}

function mapSection(row: DbRow): MarketplaceHomeSection {
  return {
    id: String(row.section_key || row.id),
    type: String(row.section_type || row.type || 'custom'),
    title: String(row.title || ''),
    subtitle: String(row.subtitle || ''),
    ctaLabel: row.cta_label ? String(row.cta_label) : undefined,
    ctaHref: row.cta_href ? String(row.cta_href) : undefined,
    visible: row.is_visible !== false,
    order: n(row.display_order ?? row.order, 100),
    layoutStyle: String(row.layout_style || 'premium'),
    settings: row.settings && typeof row.settings === 'object' ? row.settings : {},
  }
}

function mapGateway(row: DbRow): MarketplaceGateway {
  return {
    id: String(row.gateway_key || row.id),
    title: String(row.title || ''),
    slug: String(row.slug || row.gateway_key || row.id),
    subtitle: String(row.subtitle || ''),
    icon: String(row.icon || '◆'),
    tags: arr(row.tags),
    ctaLabel: String(row.cta_label || 'Explorer'),
    secondaryCtaLabel: String(row.secondary_cta_label || 'Devis B2B'),
    href: String(row.href || '/b2b-marketplace/categories'),
    featuredBadge: row.featured_badge ? String(row.featured_badge) : undefined,
    order: n(row.display_order ?? row.order, 100),
    status: status(row.status),
    accent: ['navy', 'blue', 'gold', 'green', 'orange', 'rose', 'purple'].includes(row.accent) ? row.accent : 'navy',
  }
}

function mapCategory(row: DbRow): MarketplaceCategory {
  return {
    id: String(row.category_key || row.id),
    title: String(row.title || ''),
    slug: String(row.slug || row.category_key || row.id),
    gatewaySlug: String(row.gateway_slug || ''),
    shortDescription: String(row.short_description || ''),
    promise: String(row.promise || ''),
    useCases: arr(row.use_cases),
    tags: arr(row.tags),
    heroNote: String(row.hero_note || ''),
    layoutTemplate: ['dense-wholesale', 'pack-first', 'training-linked'].includes(row.layout_template) ? row.layout_template : 'premium-editorial',
    status: status(row.status),
    catalogueCategory: row.catalogue_category ? String(row.catalogue_category) : undefined,
    sourcePage: row.source_page ? n(row.source_page) : undefined,
    sourceImage: row.source_image ? String(row.source_image) : undefined,
  }
}

function mapProduct(row: DbRow): MarketplaceProduct {
  return {
    id: String(row.reference_code || row.reference || row.id),
    reference: String(row.reference_code || row.reference || ''),
    title: String(row.title || ''),
    slug: String(row.slug || row.reference_code || row.reference || row.id),
    categorySlug: String(row.category_slug || ''),
    setName: String(row.set_name || ''),
    shortDescription: String(row.short_description || ''),
    longDescription: String(row.long_description || row.short_description || ''),
    startingPriceMad: n(row.starting_price_mad),
    priceNote: String(row.price_note || ''),
    tags: arr(row.tags),
    bestFor: arr(row.best_for),
    schoolArea: String(row.school_area || ''),
    eventType: String(row.event_type || ''),
    format: String(row.format || ''),
    leadTime: String(row.lead_time || ''),
    personalizable: Boolean(row.is_personalizable ?? row.personalizable),
    wholesaleAvailable: row.is_wholesale_available !== false && row.wholesaleAvailable !== false,
    minQuantity: n(row.min_quantity, 1),
    relatedTrainingSlugs: arr(row.related_training_slugs),
    relatedPackSlugs: arr(row.related_pack_slugs),
    status: status(row.status),
    catalogueCategory: row.catalogue_category ? String(row.catalogue_category) : undefined,
    sourcePage: row.source_page ? n(row.source_page) : undefined,
    sourceImage: row.source_image ? String(row.source_image) : undefined,
  }
}

function mapAcademy(row: DbRow): AcademyModule {
  return {
    id: String(row.reference_code || row.reference || row.id),
    reference: String(row.reference_code || row.reference || ''),
    title: String(row.title || ''),
    slug: String(row.slug || row.reference_code || row.id),
    category: String(row.category || ''),
    categorySlug: String(row.category_slug || ''),
    shortDescription: String(row.short_description || ''),
    objectives: arr(row.objectives),
    duration: String(row.duration || ''),
    participants: String(row.participants || ''),
    format: String(row.format || ''),
    startingPriceMad: n(row.starting_price_mad),
    includesCertificate: row.includes_certificate !== false,
    includesElearning: Boolean(row.includes_elearning),
    relatedProductRefs: arr(row.related_product_refs),
    relatedPackSlugs: arr(row.related_pack_slugs),
    status: status(row.status),
    sourcePage: row.source_page ? n(row.source_page) : undefined,
    sourceImage: row.source_image ? String(row.source_image) : undefined,
  }
}

function mapPack(row: DbRow): MarketplacePack {
  const variants = Array.isArray(row.variants) ? row.variants : []
  return {
    id: String(row.pack_key || row.id),
    title: String(row.title || ''),
    slug: String(row.slug || row.pack_key || row.id),
    objective: String(row.objective || ''),
    shortDescription: String(row.short_description || ''),
    startingPriceMad: n(row.starting_price_mad),
    bestFor: arr(row.best_for),
    includedProductRefs: arr(row.included_product_refs),
    includedTrainingSlugs: arr(row.included_training_slugs),
    variants: variants.map((v: DbRow) => ({ name: String(v.name || 'Option'), priceMad: n(v.priceMad ?? v.price_mad), note: String(v.note || '') })),
    customizable: row.is_customizable !== false && row.customizable !== false,
    status: status(row.status),
  }
}

function mapNavigation(row: DbRow): MarketplaceNavigationItem {
  return {
    id: String(row.id || row.label),
    label: String(row.label || ''),
    href: String(row.href || '/b2b-marketplace'),
    location: String(row.location || 'main-horizontal'),
    order: n(row.display_order ?? row.order, 100),
    status: status(row.status),
    parentId: row.parent_item_id ? String(row.parent_item_id) : null,
    badge: row.badge ? String(row.badge) : undefined,
    isPrimary: Boolean(row.is_primary),
  }
}

function mergeRows<T>(base: T[], incoming: T[], mergeKey?: (row: T) => string) {
  if (!incoming.length) return base
  if (!mergeKey) return incoming
  const merged = new Map<string, T>()
  for (const row of base) merged.set(mergeKey(row), row)
  for (const row of incoming) merged.set(mergeKey(row), row)
  return Array.from(merged.values())
}

async function queryRows<T>(table: string, mapper: (row: DbRow) => T, fallback: T[], options?: { order?: string; eq?: [string, string | number | boolean]; mergeKey?: (row: T) => string }) {
  let resolved = fallback

  try {
    const localRows = listLocalAdminRows(table)
    const filteredLocalRows = options?.eq ? localRows.filter((row) => row[options.eq![0]] === options.eq![1]) : localRows
    resolved = mergeRows(resolved, filteredLocalRows.map(mapper), options?.mergeKey)
  } catch {}

  if (!isSupabaseServerConfigured()) return resolved

  try {
    const supabase = await createClient()
    let query = supabase.from(table).select('*')
    if (options?.eq) query = query.eq(options.eq[0], options.eq[1])
    if (options?.order) query = query.order(options.order, { ascending: true })
    const { data, error } = await query
    if (error || !data?.length) return resolved
    return mergeRows(resolved, data.map(mapper), options?.mergeKey)
  } catch {
    return resolved
  }
}

async function querySingle<T>(table: string, mapper: (row: DbRow) => T, fallback: T, options?: { eq?: [string, string | number | boolean]; order?: string }) {
  const rows = await queryRows(table, mapper, [], options)
  return rows[0] ?? fallback
}

export async function getMarketplaceTheme(): Promise<MarketplaceThemeSettings> {
  return querySingle('b2b_marketplace_theme_settings', mapTheme, activeThemeFallback(), { eq: ['is_active', true] })
}

export async function listNavigation(): Promise<MarketplaceNavigationItem[]> {
  const rows = await queryRows('b2b_marketplace_navigation_items', mapNavigation, fallbackNavigation(), { order: 'display_order' })
  return rows.filter((item) => item.status === 'published').sort((a, b) => a.order - b.order)
}

export async function getMarketplaceHome(): Promise<MarketplaceHomePayload> {
  const [theme, sections, nav, gatewayRows, categoryRows, productRows, packRows, academyRows] = await Promise.all([
    getMarketplaceTheme(),
    queryRows('b2b_marketplace_home_sections', mapSection, homeSections, { order: 'display_order' }),
    listNavigation(),
    listGateways(),
    listCategories(),
    listProducts(),
    listPacks(),
    listAcademyModules(),
  ])
  return {
    theme,
    sections: sections.filter((section) => section.visible).sort((a, b) => a.order - b.order),
    gateways: gatewayRows,
    categories: categoryRows,
    featuredProducts: productRows.slice(0, 6),
    featuredPacks: packRows.slice(0, 6),
    academyModules: academyRows.slice(0, 4),
    navigation: nav,
  }
}

export async function listGateways(): Promise<MarketplaceGateway[]> {
  const rows = await queryRows('b2b_marketplace_gateway_cards', mapGateway, gateways, { order: 'display_order', mergeKey: (row) => row.slug })
  return rows.filter((gateway) => gateway.status === 'published').sort((a, b) => a.order - b.order)
}

export async function listCategories(): Promise<MarketplaceCategory[]> {
  const rows = await queryRows('b2b_marketplace_categories', mapCategory, categories, { mergeKey: (row) => row.slug })
  return rows.filter((category) => category.status === 'published')
}

export async function getCategory(slug: string): Promise<MarketplaceCategory | undefined> {
  return (await listCategories()).find((category) => category.slug === slug)
}

export async function listProducts(filters?: { categorySlug?: string; query?: string }): Promise<MarketplaceProduct[]> {
  const query = (filters?.query || '').trim().toLowerCase()
  const rows = await queryRows('b2b_marketplace_products', mapProduct, products, { mergeKey: (row) => row.reference })
  return rows
    .filter((product) => product.status === 'published')
    .filter((product) => !filters?.categorySlug || product.categorySlug === filters.categorySlug)
    .filter((product) => {
      if (!query) return true
      return [product.reference, product.title, product.shortDescription, product.categorySlug, product.setName, ...product.tags, ...product.bestFor]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
}

export async function getProduct(refOrSlug: string): Promise<MarketplaceProduct | undefined> {
  const value = refOrSlug.toLowerCase()
  return (await listProducts()).find(
    (product) => product.reference.toLowerCase() === value || product.slug.toLowerCase() === value,
  )
}

export async function listAcademyModules(filters?: { categorySlug?: string; query?: string }): Promise<AcademyModule[]> {
  const query = (filters?.query || '').trim().toLowerCase()
  const rows = await queryRows('b2b_marketplace_academy_modules', mapAcademy, academyModules, { mergeKey: (row) => row.slug })
  return rows
    .filter((module) => module.status === 'published')
    .filter((module) => !filters?.categorySlug || module.categorySlug === filters.categorySlug || module.slug === filters.categorySlug)
    .filter((module) => {
      if (!query) return true
      return [module.reference, module.title, module.category, module.shortDescription, ...module.objectives]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
}

export async function listAcademyCategories() {
  const map = new Map<string, { slug: string; title: string; count: number }>()
  for (const module of await listAcademyModules()) {
    const current = map.get(module.categorySlug)
    map.set(module.categorySlug, { slug: module.categorySlug, title: module.category, count: (current?.count || 0) + 1 })
  }
  return Array.from(map.values())
}

export async function getAcademyModule(slug: string): Promise<AcademyModule | undefined> {
  return (await listAcademyModules()).find((module) => module.slug === slug)
}

export async function listAcademyModulesByCategory(categorySlug: string): Promise<AcademyModule[]> {
  return listAcademyModules({ categorySlug })
}

export async function listPacks(filters?: { query?: string }): Promise<MarketplacePack[]> {
  const query = (filters?.query || '').trim().toLowerCase()
  const rows = await queryRows('b2b_marketplace_packs', mapPack, packs, { mergeKey: (row) => row.slug })
  return rows
    .filter((pack) => pack.status === 'published')
    .filter((pack) => {
      if (!query) return true
      return [pack.title, pack.objective, pack.shortDescription, ...pack.bestFor].join(' ').toLowerCase().includes(query)
    })
}

export async function getPack(slug: string): Promise<MarketplacePack | undefined> {
  return (await listPacks()).find((pack) => pack.slug === slug)
}

export async function searchMarketplace(query: string) {
  const q = query.trim()
  const [products, categories, academyModules, packs] = await Promise.all([
    listProducts({ query: q }),
    listCategories(),
    listAcademyModules({ query: q }),
    listPacks({ query: q }),
  ])
  return {
    query: q,
    products,
    categories: categories.filter((category) => [category.title, category.shortDescription, ...category.tags].join(' ').toLowerCase().includes(q.toLowerCase())),
    academyModules,
    packs,
  }
}


export async function getQuoteSettings() {
  const fallback = {
    id: 'quote-settings-default',
    setting_key: 'default',
    title: 'Demande de devis professionnelle',
    subtitle: 'Configurez votre sélection, transmettez vos besoins, et recevez une proposition AngelCare adaptée aux quantités, formats, personnalisation et délais.',
    sales_email: 'partenaires@angelcarehub.ma',
    quote_cart_enabled: true,
    allow_anonymous_quote_request: true,
    require_school_name: true,
    require_phone: true,
    require_city: true,
    enable_logo_upload_placeholder: true,
    is_active: true,
    settings: {},
  }
  return querySingle('b2b_marketplace_quote_settings', (row) => row, fallback, { eq: ['is_active', true] })
}

export function normalizeQuotePayload(payload: Partial<QuoteRequestPayload>): QuoteRequestPayload {
  return {
    schoolName: String(payload.schoolName || '').trim(),
    contactName: String(payload.contactName || '').trim(),
    phone: String(payload.phone || '').trim(),
    email: String(payload.email || '').trim(),
    city: String(payload.city || '').trim(),
    message: String(payload.message || '').trim(),
    lines: Array.isArray(payload.lines) ? payload.lines : [],
  }
}

export function validateQuotePayload(payload: QuoteRequestPayload): string[] {
  const errors: string[] = []
  if (!payload.schoolName) errors.push('schoolName is required')
  if (!payload.contactName) errors.push('contactName is required')
  if (!payload.phone) errors.push('phone is required')
  if (!payload.email) errors.push('email is required')
  if (!payload.city) errors.push('city is required')
  if (!payload.lines.length) errors.push('at least one quote line is required')
  return errors
}



function themeToAdminRow(theme: MarketplaceThemeSettings): DbRow {
  return {
    id: theme.id,
    theme_key: 'angelcare-premium-white',
    name: theme.name,
    primary_color: theme.primaryColor,
    accent_color: theme.accentColor,
    background_style: theme.backgroundStyle,
    card_radius: theme.cardRadius,
    button_style: theme.buttonStyle,
    hero_style: theme.heroStyle,
    product_card_style: theme.productCardStyle,
    grid_density: theme.gridDensity,
    marketplace_mode: theme.marketplaceMode,
    logo_url: theme.logoUrl || '/b2b-plaquette-partenaires/assets/angelcare-original-logo.png',
    logo_alt: theme.logoAlt || 'AngelCare',
    logo_width_px: theme.logoWidthPx || 52,
    logo_height_px: theme.logoHeightPx || 52,
    logo_display_mode: theme.logoDisplayMode || 'symbol-and-wordmark',
    customer_logo_max_width_px: theme.customerLogoMaxWidthPx || 180,
    announcement_enabled: theme.announcementEnabled !== false,
    announcement_text: theme.announcementText || '',
    announcement_cta_label: theme.announcementCtaLabel || '',
    announcement_cta_href: theme.announcementCtaHref || '',
    announcement_background: theme.announcementBackground || '#092e63',
    announcement_text_color: theme.announcementTextColor || '#ffffff',
    header_layout: theme.headerLayout || 'centered',
    menu_style: theme.menuStyle || 'pill',
    sticky_quote_enabled: theme.stickyQuoteEnabled !== false,
    is_active: true,
  }
}

function productToAdminRow(product: MarketplaceProduct): DbRow {
  return {
    id: product.id,
    reference_code: product.reference,
    title: product.title,
    slug: product.slug,
    category_slug: product.categorySlug,
    set_name: product.setName,
    short_description: product.shortDescription,
    long_description: product.longDescription,
    starting_price_mad: product.startingPriceMad,
    price_note: product.priceNote,
    tags: product.tags,
    best_for: product.bestFor,
    school_area: product.schoolArea,
    event_type: product.eventType,
    format: product.format,
    lead_time: product.leadTime,
    catalogue_category: product.catalogueCategory || '',
    source_page: product.sourcePage || null,
    source_image: product.sourceImage || '',
    is_personalizable: product.personalizable,
    is_wholesale_available: product.wholesaleAvailable,
    min_quantity: product.minQuantity,
    related_training_slugs: product.relatedTrainingSlugs,
    related_pack_slugs: product.relatedPackSlugs,
    status: product.status,
  }
}

function academyToAdminRow(module: AcademyModule): DbRow {
  return {
    id: module.id,
    reference_code: module.reference,
    title: module.title,
    slug: module.slug,
    category: module.category,
    category_slug: module.categorySlug,
    short_description: module.shortDescription,
    objectives: module.objectives,
    duration: module.duration,
    participants: module.participants,
    format: module.format,
    starting_price_mad: module.startingPriceMad,
    includes_certificate: module.includesCertificate,
    includes_elearning: module.includesElearning,
    related_product_refs: module.relatedProductRefs,
    related_pack_slugs: module.relatedPackSlugs,
    source_page: module.sourcePage || null,
    source_image: module.sourceImage || '',
    status: module.status,
  }
}

function categoryToAdminRow(category: MarketplaceCategory): DbRow {
  return {
    id: category.id,
    category_key: category.id,
    title: category.title,
    slug: category.slug,
    gateway_slug: category.gatewaySlug,
    short_description: category.shortDescription,
    promise: category.promise,
    use_cases: category.useCases,
    tags: category.tags,
    hero_note: category.heroNote,
    layout_template: category.layoutTemplate,
    catalogue_category: category.catalogueCategory || '',
    source_page: category.sourcePage || null,
    source_image: category.sourceImage || '',
    status: category.status,
  }
}

function gatewayToAdminRow(gateway: MarketplaceGateway): DbRow {
  return {
    id: gateway.id,
    gateway_key: gateway.id,
    title: gateway.title,
    slug: gateway.slug,
    subtitle: gateway.subtitle,
    icon: gateway.icon,
    tags: gateway.tags,
    cta_label: gateway.ctaLabel,
    secondary_cta_label: gateway.secondaryCtaLabel,
    href: gateway.href,
    featured_badge: gateway.featuredBadge || '',
    accent: gateway.accent,
    display_order: gateway.order,
    status: gateway.status,
  }
}

function sectionToAdminRow(section: MarketplaceHomeSection): DbRow {
  return {
    id: section.id,
    section_key: section.id,
    section_type: section.type,
    title: section.title,
    subtitle: section.subtitle,
    cta_label: section.ctaLabel || '',
    cta_href: section.ctaHref || '',
    layout_style: section.layoutStyle,
    display_order: section.order,
    is_visible: section.visible,
    settings: section.settings || {},
  }
}

function packToAdminRow(pack: MarketplacePack): DbRow {
  return {
    id: pack.id,
    pack_key: pack.id,
    title: pack.title,
    slug: pack.slug,
    objective: pack.objective,
    short_description: pack.shortDescription,
    starting_price_mad: pack.startingPriceMad,
    best_for: pack.bestFor,
    included_product_refs: pack.includedProductRefs,
    included_training_slugs: pack.includedTrainingSlugs,
    variants: pack.variants,
    is_customizable: pack.customizable,
    status: pack.status,
  }
}

function navToAdminRow(item: MarketplaceNavigationItem): DbRow {
  return {
    id: item.id,
    nav_key: item.id,
    label: item.label,
    href: item.href,
    location: item.location,
    display_order: item.order,
    badge: item.badge || '',
    is_primary: item.isPrimary || false,
    status: item.status,
  }
}

export async function getAdminResource(resource: string) {
  switch (resource) {
    case 'theme': return queryRows('b2b_marketplace_theme_settings', (row) => row, [themeToAdminRow(activeThemeFallback())], { mergeKey: (row) => String(row.theme_key || row.id) })
    case 'home-sections': return queryRows('b2b_marketplace_home_sections', (row) => row, homeSections.map(sectionToAdminRow), { order: 'display_order', mergeKey: (row) => String(row.section_key || row.id) })
    case 'gateway-cards': return queryRows('b2b_marketplace_gateway_cards', (row) => row, gateways.map(gatewayToAdminRow), { order: 'display_order', mergeKey: (row) => String(row.gateway_key || row.slug || row.id) })
    case 'categories': return queryRows('b2b_marketplace_categories', (row) => row, categories.map(categoryToAdminRow), { mergeKey: (row) => String(row.category_key || row.slug || row.id) })
    case 'products': return queryRows('b2b_marketplace_products', (row) => row, products.map(productToAdminRow), { mergeKey: (row) => String(row.reference_code || row.id) })
    case 'academy': return queryRows('b2b_marketplace_academy_modules', (row) => row, academyModules.map(academyToAdminRow), { mergeKey: (row) => String(row.reference_code || row.slug || row.id) })
    case 'packs': return queryRows('b2b_marketplace_packs', (row) => row, packs.map(packToAdminRow), { mergeKey: (row) => String(row.pack_key || row.slug || row.id) })
    case 'navigation': return queryRows('b2b_marketplace_navigation_items', (row) => row, fallbackNavigation().map(navToAdminRow), { order: 'display_order', mergeKey: (row) => String(row.id || row.label) })
    case 'templates': return queryRows('b2b_marketplace_page_templates', (row) => row, [
      { id: 'tpl-product-card', template_key: 'tpl-product-card', name: 'Premium B2B Product Card', template_type: 'product-listing', status: 'published', settings: {} },
      { id: 'tpl-product-page', template_key: 'tpl-product-page', name: 'Product Detail Quote Page', template_type: 'product-page', status: 'published', settings: {} },
      { id: 'tpl-category', template_key: 'tpl-category', name: 'Category Walkaround Page', template_type: 'category', status: 'published', settings: {} },
    ])
    case 'quote-settings': return queryRows('b2b_marketplace_quote_settings', (row) => row, [{
      id: 'quote-settings-default', setting_key: 'quote-settings-default', title: 'Demande de devis wholesale', subtitle: 'Configurez votre sélection et envoyez votre demande à AngelCare.', sales_email: 'partenaires@angelcarehub.ma', quote_cart_enabled: true, allow_anonymous_quote_request: true, require_school_name: true, require_phone: true, require_city: true, enable_logo_upload_placeholder: true, is_active: true, settings: {},
    }])
    case 'media': return queryRows('b2b_marketplace_product_media', (row) => row, [])
    default: return null
  }
}
