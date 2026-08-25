export type CommerceLocale = 'fr' | 'en' | 'ar'
export type CommerceResource =
  | 'media'
  | 'media-folders'
  | 'homepage-sections'
  | 'homepage-campaigns'
  | 'homepage-collections'
  | 'homepage-collection-items'
  | 'homepage-placements'
  | 'navigation-menus'
  | 'navigation-items'
  | 'catalog-items'
  | 'catalog-media'
  | 'catalog-variants'
  | 'catalog-availability'
  | 'catalog-categories'
  | 'catalog-item-categories'
  | 'catalog-attributes'
  | 'price-rules'
  | 'merchandising-rules'
  | 'versions'
  | 'publication-events'
  | 'cache-events'

export type CommerceObjectType =
  | 'media'
  | 'homepage'
  | 'homepage_section'
  | 'homepage_campaign'
  | 'navigation_menu'
  | 'navigation_item'
  | 'catalog_item'
  | 'catalog_category'
  | 'catalog_collection'
  | 'catalog_placement'
  | 'merchandising_rule'

export interface CommerceRecord {
  id: string
  status?: string
  name?: string
  title?: string
  label?: string
  item_key?: string
  category_key?: string
  collection_key?: string
  section_key?: string
  placement_key?: string
  menu_key?: string
  asset_key?: string
  locale?: string
  sort_order?: number
  updated_at?: string
  [key: string]: unknown
}

export interface CommerceStudioSummary {
  liveHomepageSections: number
  activeCampaigns: number
  publishedProducts: number
  publishedCategories: number
  activeNavigationItems: number
  mediaAssets: number
  missingMedia: number
  missingPrice: number
  missingCategory: number
  missingTranslation: number
  featuredProducts: number
  popularProducts: number
  bestPickProducts: number
  availableNowProducts: number
  recentPublications: CommerceRecord[]
  failedPublications: CommerceRecord[]
}

export interface MediaAsset extends CommerceRecord {
  id: string
  asset_key: string
  folder_id: string | null
  file_name: string
  media_type: string
  mime_type: string
  storage_bucket: string
  storage_path: string
  public_url: string
  desktop_url: string
  tablet_url: string | null
  mobile_url: string | null
  square_url: string | null
  alt_text_fr: string
  alt_text_en: string | null
  alt_text_ar: string | null
  focal_point: Record<string, unknown>
  rights_status: string
  rights_expires_at: string | null
  usage_count: number
  status: string
  created_at: string
  updated_at: string
}

export interface HomepageSectionRecord extends CommerceRecord {
  id: string
  section_key: string
  section_type: string
  locale: CommerceLocale
  title: string
  subtitle: string | null
  layout_variant: string
  sort_order: number
  settings: Record<string, unknown>
  visible: boolean
  audience: string
  starts_at: string | null
  ends_at: string | null
  background_variant: string
  accent: string
  status: string
}

export interface NavigationMenuRecord extends CommerceRecord {
  id: string
  menu_key: string
  name: string
  locale: CommerceLocale
  territory_id: string | null
  status: string
  items: NavigationItemRecord[]
}

export interface NavigationItemRecord extends CommerceRecord {
  id: string
  menu_id: string
  label: string
  label_fr: string | null
  label_en: string | null
  label_ar: string | null
  href: string
  parent_id: string | null
  sort_order: number
  visibility: string
  icon_key: string | null
  image_asset_id: string | null
  desktop_visible: boolean
  mobile_visible: boolean
  status: string
}

export interface CatalogAdminItem extends CommerceRecord {
  id: string
  public_reference: string
  item_key: string
  sku: string | null
  slug: string
  kind: string
  sellable_type: string
  name_fr: string
  name_en: string | null
  name_ar: string | null
  short_description_fr: string | null
  short_description_en: string | null
  short_description_ar: string | null
  description_fr: string | null
  description_en: string | null
  description_ar: string | null
  price_mode: string
  price_amount: number | null
  currency_label: string
  featured: boolean
  availability_status: string
  status: string
  commercial_metadata: Record<string, unknown>
  seo_metadata: Record<string, unknown>
  attributes: Record<string, unknown>
  experience_config?: Record<string, unknown>
  territory_config?: Record<string, unknown>
  fulfillment_config?: Record<string, unknown>
  trust_config?: Record<string, unknown>
  relation_config?: Record<string, unknown>
  variants?: CommerceRecord[]
  media?: CommerceRecord[]
  availability?: CommerceRecord[]
  categories?: CommerceRecord[]
  priceRules?: CommerceRecord[]
}

export interface CatalogCategoryAdmin extends CommerceRecord {
  id: string
  category_key: string
  locale: CommerceLocale
  title: string
  short_description: string | null
  slug: string
  parent_category_id: string | null
  cover_asset_url: string | null
  mobile_cover_asset_url: string | null
  icon_key: string | null
  visual_theme: string
  storefront_template: string
  sort_order: number
  visible: boolean
  status: string
  seo_metadata: Record<string, unknown>
  experience_config?: Record<string, unknown>
  hero_content?: Record<string, unknown>
  storefront_sections?: Array<Record<string, unknown>>
  filter_config?: Record<string, unknown>
  item_count: number
}

export interface MerchandisingAssignment extends CommerceRecord {
  id: string
  placement_key: string
  catalog_item_id: string | null
  section_id: string | null
  collection_id: string | null
  locale: CommerceLocale
  audience: string
  merchandising_badge: string | null
  priority: number
  sort_order: number
  starts_at: string | null
  ends_at: string | null
  status: string
}

export interface CommerceStudioData {
  summary: CommerceStudioSummary
  media: MediaAsset[]
  sections: HomepageSectionRecord[]
  campaigns: CommerceRecord[]
  collections: CommerceRecord[]
  placements: MerchandisingAssignment[]
  menus: NavigationMenuRecord[]
  catalogItems: CatalogAdminItem[]
  categories: CatalogCategoryAdmin[]
  priceBooks: CommerceRecord[]
  territories: CommerceRecord[]
  versions: CommerceRecord[]
  publicationEvents: CommerceRecord[]
}

export interface CommerceMutationResult {
  record: CommerceRecord
  affectedPaths: string[]
  publicationEventId: string | null
}
