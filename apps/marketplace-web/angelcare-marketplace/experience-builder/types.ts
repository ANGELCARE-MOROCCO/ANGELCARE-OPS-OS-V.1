export type CmsPageStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'retired' | 'archived'
export type CmsPublicationState = 'never_published' | 'published' | 'unpublished'
export type CmsBlockType =
  | 'hero' | 'split_hero' | 'video_hero' | 'audience_router' | 'service_grid' | 'product_grid' | 'collection_rail' | 'category_grid'
  | 'trust_strip' | 'proof_grid' | 'stats' | 'editorial' | 'story' | 'testimonials' | 'partner_logos' | 'comparison' | 'pricing'
  | 'timeline' | 'process' | 'cta_band' | 'faq' | 'inquiry_form' | 'marketplace_entry' | 'partner_os_entry' | 'academy_entry'
  | 'family_story' | 'media_gallery' | 'video' | 'territory_map' | 'quote' | 'download' | 'contact'
  | 'section' | 'container' | 'stack' | 'columns' | 'grid' | 'symbol'

export interface CmsPage {
  id: string
  public_reference: string
  route_key: string
  locale: 'fr' | 'en' | 'ar'
  territory_id: string | null
  title: string
  navigation_label: string | null
  slug: string
  description: string | null
  status: CmsPageStatus
  publication_state?: CmsPublicationState
  draft_revision_id?: string | null
  published_revision_id?: string | null
  published_slug?: string | null
  published_locale?: 'fr' | 'en' | 'ar' | null
  published_territory_id?: string | null
  source_template_id?: string | null
  source_template_revision_id?: string | null
  translation_status: 'source' | 'missing' | 'draft' | 'reviewed' | 'approved' | 'stale'
  sensitive: boolean
  owner_id: string | null
  reviewer_id: string | null
  current_version: number
  published_version: number | null
  seo_title: string | null
  seo_description: string | null
  canonical_url: string | null
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CmsBlock {
  id: string
  page_id: string
  block_key: string
  block_type: CmsBlockType
  sort_order: number
  status: 'draft' | 'active' | 'hidden' | 'archived'
  content: Record<string, unknown>
  settings: Record<string, unknown>
  audience: string[]
  territory_id: string | null
  locale: string
  parent_block_key?: string | null
  slot_key?: string
  schema_version?: number
  created_at: string
  updated_at: string
}

export interface CmsRevision {
  id: string
  page_id: string
  revision_number: number
  state: 'draft' | 'published' | 'archived'
  schema_version: number
  document: { schemaVersion?: number; blocks?: CmsBlock[] } & Record<string, unknown>
  page_snapshot: Record<string, unknown>
  dependency_manifest: Record<string, unknown>
  checksum: string
  change_summary: string | null
  created_by: string | null
  created_at: string
}

export interface CmsPageDetail {
  page: CmsPage
  blocks: CmsBlock[]
  versions: CmsPageVersion[]
  revisions?: CmsRevision[]
}

export interface CmsPageVersion {
  id: string
  page_id: string
  version_number: number
  title: string
  description: string | null
  slug: string
  status: string
  snapshot: Record<string, unknown>
  change_summary: string | null
  created_by: string | null
  created_at: string
}

export interface CmsMenu {
  id: string
  menu_key: string
  name: string
  locale: string
  territory_id: string | null
  status: string
  items?: CmsMenuItem[]
}

export interface CmsMenuItem {
  id: string
  menu_id: string
  label: string
  href: string
  page_id: string | null
  parent_id: string | null
  sort_order: number
  visibility: string
  status: string
}

export interface CmsCta {
  id: string
  cta_key: string
  label: string
  href: string
  intent: string
  audience: string[]
  locale: string
  territory_id: string | null
  status: string
  analytics_event: string | null
}

export interface PublicationJob {
  id: string
  public_reference: string
  page_id: string
  revision_id?: string | null
  action: 'publish' | 'unpublish' | 'rollback'
  status: 'queued' | 'validating' | 'blocked' | 'ready' | 'completed' | 'failed' | 'cancelled'
  scheduled_at: string | null
  blocker: string | null
  requested_by: string | null
  approved_by: string | null
  attempt_count?: number
  claimed_at?: string | null
  claimed_by?: string | null
  last_error?: string | null
  executed_at?: string | null
  created_at: string
  completed_at: string | null
}

export interface PreviewSession {
  id: string
  preview_token: string
  page_id: string
  revision_id?: string | null
  version_number: number
  locale: string
  territory_id: string | null
  expires_at: string
  revoked_at?: string | null
  created_by: string
}

export interface ExperienceMediaAsset {
  id: string
  asset_key: string
  file_name: string
  media_type: string
  mime_type: string
  width: number | null
  height: number | null
  public_url: string
  desktop_url: string
  tablet_url: string | null
  mobile_url: string | null
  alt_text_fr: string
  alt_text_en: string | null
  alt_text_ar: string | null
  rights_status: string
  rights_expires_at: string | null
  optimization_status: string
  status: string
}

export interface CmsDependencyEdge {
  id: string
  page_id: string
  revision_id: string
  source_type: string
  source_key: string
  source_field: string | null
  relation_type: string
  target_type: string
  target_id: string | null
  target_key: string | null
  target_route: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface CmsTemplate {
  id: string
  public_reference: string
  template_key: string
  name: string
  description: string | null
  category: string
  status: 'draft' | 'published' | 'archived'
  current_revision_id: string | null
  published_revision_id: string | null
  created_at: string
  updated_at: string
}

export interface CmsSymbol {
  id: string
  public_reference: string
  symbol_key: string
  name: string
  description: string | null
  propagation_policy: 'follow_published' | 'pinned'
  status: 'draft' | 'published' | 'archived'
  current_revision_id: string | null
  published_revision_id: string | null
  created_at: string
  updated_at: string
}
