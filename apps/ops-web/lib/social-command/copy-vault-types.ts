import type { SocialChannel, SocialFormat } from "@/lib/social-command/types"

export type CopyVaultStatus = "draft" | "in_review" | "approved" | "rejected" | "archived" | "expired"
export type CopyVaultLifecycle = "active" | "archived"
export type CopyVaultType =
  | "post_caption"
  | "opening_hook"
  | "cta"
  | "promotional_message"
  | "service_description"
  | "offer_text"
  | "hashtag_pack"
  | "story_text"
  | "reel_caption"
  | "carousel_intro"
  | "carousel_closing"
  | "b2b_message"
  | "faq_answer"
  | "comment_reply"
  | "dm_reply"
  | "complaint_response"
  | "lead_response"
  | "disclaimer"
  | "terms_block"
  | "location_block"
  | "contact_block"
  | "seasonal_message"
  | "brand_signature"

export type CopyVaultCategory = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  description: string
  status: "active" | "archived"
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type CopyVaultVersion = {
  id: string
  item_id: string
  version_no: number
  status: CopyVaultStatus
  body: string
  short_version: string
  cta: string
  hashtags: string[]
  tags: string[]
  channels: SocialChannel[]
  formats: SocialFormat[]
  language: string
  country: string
  city: string
  tone: string
  purpose: string
  audience: string
  collection_name: string
  valid_from: string | null
  valid_until: string | null
  approval_policy: string
  change_summary: string
  body_fingerprint: string
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  decision_note: string | null
}

export type CopyVaultItem = {
  id: string
  code: string
  title: string
  copy_type: CopyVaultType
  business_unit: string
  campaign_id: string | null
  owner_user_id: string | null
  lifecycle_status: CopyVaultLifecycle
  current_version_no: number
  approved_version_no: number | null
  usage_count: number
  last_used_at: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string
  categories: CopyVaultCategory[]
  current_version: CopyVaultVersion | null
  approved_version: CopyVaultVersion | null
  versions?: CopyVaultVersion[]
  usage?: CopyVaultUsage[]
  approvals?: CopyVaultApprovalEvent[]
  usage_summary?: CopyVaultUsageSummary
}

export type CopyVaultApprovalEvent = {
  id: string
  item_id: string
  version_no: number
  action: "submitted" | "approved" | "rejected" | "archived" | "restored"
  stage: string
  note: string
  actor_user_id: string | null
  actor_role: string
  created_at: string
}

export type CopyVaultUsage = {
  id: string
  item_id: string
  version_no: number
  surface: string
  publication_id: string | null
  bulk_plan_id: string | null
  actor_user_id: string | null
  content_snapshot: string
  customized: boolean
  context: Record<string, unknown>
  created_at: string
}

export type CopyVaultUsageSummary = {
  total: number
  publicationUses: number
  publishedUses: number
  lastUsedAt: string | null
  metricEvidence: number
  metricCodes: string[]
}

export type CopyVaultPermissions = {
  view: boolean
  use: boolean
  create: boolean
  edit: boolean
  editOwn: boolean
  editAll: boolean
  submit: boolean
  import: boolean
  approve: boolean
  reject: boolean
  manageCategories: boolean
  archive: boolean
  governance: boolean
  rbacEnforced: boolean
  actorRole: string
  actorId: string
}

export type CopyVaultStats = {
  items: number
  approved: number
  inReview: number
  drafts: number
  rejected: number
  archived: number
  categories: number
  usageEvents: number
}

export type CopyVaultBootstrap = {
  items: CopyVaultItem[]
  categories: CopyVaultCategory[]
  stats: CopyVaultStats
  permissions: CopyVaultPermissions
}

export type CopyVaultSelection = {
  itemId: string
  versionNo: number
  code: string
  title: string
  copyType: CopyVaultType
  body: string
  shortVersion: string
  cta: string
  hashtags: string[]
  tags: string[]
  language: string
  businessUnit: string
  campaignId: string | null
  categoryIds: string[]
  categories: string[]
  mode: "exact" | "customize"
}

export type CopyVaultImportMapping = Record<string, string>

export type CopyVaultImportPreviewRow = {
  rowNo: number
  valid: boolean
  duplicate: boolean
  errors: string[]
  normalized: Record<string, unknown>
}

export type CopyVaultImportPreview = {
  headers: string[]
  mapping: CopyVaultImportMapping
  rows: CopyVaultImportPreviewRow[]
  total: number
  valid: number
  invalid: number
  duplicates: number
}

export const COPY_VAULT_TYPES: CopyVaultType[] = [
  "post_caption","opening_hook","cta","promotional_message","service_description","offer_text","hashtag_pack","story_text","reel_caption","carousel_intro","carousel_closing","b2b_message","faq_answer","comment_reply","dm_reply","complaint_response","lead_response","disclaimer","terms_block","location_block","contact_block","seasonal_message","brand_signature",
]
