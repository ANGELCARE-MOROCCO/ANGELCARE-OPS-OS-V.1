import type { CmsMenuItem } from '../experience-builder/types'

export type HomepageLocale = 'fr' | 'en' | 'ar'
export type HomepageAudience = 'family' | 'organization' | 'professional'

export interface HomepageCampaign {
  id: string
  campaign_key: string
  locale: HomepageLocale
  title: string
  eyebrow: string | null
  subtitle: string | null
  primary_cta_label: string
  primary_cta_href: string
  secondary_cta_label: string | null
  secondary_cta_href: string | null
  desktop_asset_url: string
  tablet_asset_url: string | null
  mobile_asset_url: string | null
  audience: HomepageAudience | 'all'
  priority: number
  status: string
}

export interface HomepageCategory {
  id: string
  category_key: string
  locale: HomepageLocale
  title: string
  short_description: string | null
  slug: string
  cover_asset_url: string | null
  icon_key: string | null
  visual_theme: string
  item_count: number
}

export interface HomepageItem {
  id: string
  public_reference: string
  item_key: string
  slug: string
  kind: 'service' | 'product' | 'training' | 'audit' | 'saas_module' | 'kit'
  name: string
  short_description: string | null
  status: string
  territory_id: string | null
  currency_label: string
  price_mode: 'fixed' | 'starting_from' | 'quote_only' | 'subscription'
  price_amount: number | null
  featured: boolean
  availability_status: string
  category_key: string | null
  category_title: string | null
  media_url: string | null
  trust_labels: string[]
  metadata: Record<string, unknown>
  experience_schema_key: string | null
  experience_schema_version: number
  experience_configuration: Record<string, unknown>
}

export interface HomepageCollection {
  id: string
  collection_key: string
  locale: HomepageLocale
  title: string
  subtitle: string | null
  selection_method: string
  layout_variant: string
  items: HomepageItem[]
}

export interface HomepageAcademyCohort {
  id: string
  name: string
  status: string
  capacity: number
  enrolled_count: number
  starts_at: string | null
  course_title: string
  course_slug: string
  delivery_mode: string
}

export interface HomepagePartnerPlan {
  id: string
  plan_key: string
  name: string
  description: string | null
  billing_period: string
  base_price: number | null
  currency_label: string
  modules: string[]
}

export interface HomepageTrustSignal {
  id: string
  name: string
  verification_reference: string
  valid_until: string | null
  public_claims: string[]
}

export interface HomepageTerritory {
  id: string
  territory_code: string
  name: string
  currency_label: string
  status: string
  readiness_score: number
  active_locales: string[]
  cities: Array<{ id: string; city_name: string; zone_name: string | null; coverage_status: string }>
}


export interface HomepageSectionDefinition {
  id: string
  section_key: string
  section_type: string
  title: string
  subtitle: string | null
  sort_order: number
  layout_variant: string
  visible: boolean
  accent: string
  background_variant: string
  settings: Record<string, unknown>
  items: HomepageItem[]
}

export interface HomepageExperience {
  locale: HomepageLocale
  territory: HomepageTerritory | null
  navigation: CmsMenuItem[]
  campaigns: HomepageCampaign[]
  categories: HomepageCategory[]
  collections: HomepageCollection[]
  composition: HomepageSectionDefinition[]
  popularItems: HomepageItem[]
  bestPickItems: HomepageItem[]
  newArrivalItems: HomepageItem[]
  featuredItems: HomepageItem[]
  availableItems: HomepageItem[]
  familyItems: HomepageItem[]
  developmentItems: HomepageItem[]
  academyItems: HomepageItem[]
  organizationItems: HomepageItem[]
  academyCohorts: HomepageAcademyCohort[]
  partnerPlans: HomepagePartnerPlan[]
  trustSignals: HomepageTrustSignal[]
  selection: { saved: string[]; compare: string[] }
  generatedAt: string
}

export type HomepageAdminKind = 'campaigns' | 'sections' | 'collections' | 'placements' | 'audience-rules' | 'territory-rules' | 'assets'

export interface HomepageAdminRecord {
  id: string
  status?: string
  locale?: string
  title?: string
  name?: string
  key?: string
  sort_order?: number
  updated_at?: string
  [key: string]: unknown
}

export interface HomepageAdminData {
  campaigns: HomepageAdminRecord[]
  sections: HomepageAdminRecord[]
  collections: HomepageAdminRecord[]
  placements: HomepageAdminRecord[]
  rules: HomepageAdminRecord[]
  assets: HomepageAdminRecord[]
  interactions: HomepageAdminRecord[]
  catalogItems: Array<{ id: string; name_fr: string; kind: string; status: string }>
  territoryId: string | null
}
