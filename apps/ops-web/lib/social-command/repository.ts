import crypto from "node:crypto"
import { socialDb, nowIso, cleanString, jsonObject, stringArray } from "@/lib/social-command/db"
import { createDeliveryUrl } from "@/lib/social-command/storage"
import type {
  BulkSlotDraft,
  SocialActionOperation,
  SocialCampaign,
  SocialConnection,
  SocialExecutionJob,
  SocialMediaAsset,
  SocialPublication,
  SocialChannel,
  SocialFormat,
} from "@/lib/social-command/types"

const SOCIAL_CONNECTION_SAFE_FIELDS = [
  "id",
  "status",
  "facebook_page_id",
  "facebook_page_name",
  "instagram_business_id",
  "instagram_username",
  "granted_scopes",
  "token_expires_at",
  "last_verified_at",
  "last_refresh_at",
  "connection_health",
  "meta_json",
  "connected_by",
  "connected_at",
  "disconnected_at",
  "created_at",
  "updated_at",
].join(",")

/** Browser-safe connection projection. Never returns encrypted token columns. */
export async function getActiveConnection() {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_connections").select(SOCIAL_CONNECTION_SAFE_FIELDS).eq("status", "connected").order("connected_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return (data || null) as SocialConnection | null
}

/** Server-only connection record used by Meta adapters. Never expose this return value to clients. */
export async function getActiveConnectionWithSecrets() {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_connections").select("*").eq("status", "connected").order("connected_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data || null
}

export async function listMedia(limit = 240) {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_media_assets").select("*").neq("status", "deleted").eq("lifecycle_status", "active").order("created_at", { ascending: false }).limit(limit)
  if (error) throw error
  return ((data || []) as SocialMediaAsset[]).map((asset) => {
    let previewUrl: string | null = null
    if (asset.status === "ready") {
      try { previewUrl = createDeliveryUrl(asset, 6 * 60 * 60 * 1000) } catch {}
    }
    return { ...asset, preview_url: previewUrl }
  })
}

export async function listCampaigns(limit = 120) {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_campaigns").select("*").neq("status", "deleted").order("updated_at", { ascending: false }).limit(limit)
  if (error) throw error
  return (data || []) as SocialCampaign[]
}

export async function listJobs(limit = 160) {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_execution_jobs").select("*").order("due_at", { ascending: true }).limit(limit)
  if (error) throw error
  return (data || []) as SocialExecutionJob[]
}

export async function listOperations(limit = 30) {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_action_operations").select("*").order("created_at", { ascending: false }).limit(limit)
  if (error) throw error
  return (data || []) as SocialActionOperation[]
}

export async function listPublications(limit = 260) {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_publications").select("*").neq("status", "archived").order("scheduled_at", { ascending: true, nullsFirst: false }).limit(limit)
  if (error) throw error
  const pubs = (data || []) as SocialPublication[]
  if (!pubs.length) return []
  const ids = pubs.map((p) => p.id)
  const [{ data: links }, { data: media }, { data: jobs }] = await Promise.all([
    db.from("social_command_publication_media").select("publication_id,asset_id,sort_order").in("publication_id", ids).order("sort_order", { ascending: true }),
    db.from("social_command_media_assets").select("*").neq("status", "deleted"),
    db.from("social_command_execution_jobs").select("*").in("publication_id", ids).order("created_at", { ascending: true }),
  ])
  const mediaMap = new Map((media || []).map((row: any) => [row.id, row]))
  const linksByPub = new Map<string, any[]>()
  for (const link of links || []) {
    const arr = linksByPub.get((link as any).publication_id) || []
    arr.push(link)
    linksByPub.set((link as any).publication_id, arr)
  }
  const jobsByPub = new Map<string, any[]>()
  for (const job of jobs || []) {
    const arr = jobsByPub.get((job as any).publication_id) || []
    arr.push(job)
    jobsByPub.set((job as any).publication_id, arr)
  }
  return pubs.map((pub) => ({
    ...pub,
    media: (linksByPub.get(pub.id) || []).map((link) => mediaMap.get(link.asset_id)).filter(Boolean).map((asset: any) => {
      let preview_url: string | null = null
      try { preview_url = asset.status === "ready" ? createDeliveryUrl(asset, 6 * 60 * 60 * 1000) : null } catch {}
      return { ...asset, preview_url }
    }),
    jobs: jobsByPub.get(pub.id) || [],
  }))
}

export async function createMediaPlaceholder(input: { filename: string; mimeType: string; sizeBytes: number; actorUserId: string }) {
  const db = await socialDb()
  const id = crypto.randomUUID()
  const safe = cleanString(input.filename, 180).replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_") || "asset"
  const row = {
    id,
    status: "uploading",
    storage_provider: "windows_node",
    storage_key: null,
    original_filename: cleanString(input.filename, 180),
    safe_filename: safe,
    mime_type: cleanString(input.mimeType, 120) || "application/octet-stream",
    size_bytes: Number(input.sizeBytes) || 0,
    width: null,
    height: null,
    duration_seconds: null,
    sha256_hash: null,
    thumbnail_key: null,
    campaign_id: null,
    tags: [],
    metadata: {},
    usage_count: 0,
    created_by: input.actorUserId,
    created_at: nowIso(),
    archived_at: null,
    title: cleanString(input.filename, 260),
    description: "",
    lifecycle_status: "active",
    favorite: false,
    updated_by: input.actorUserId,
    updated_at: nowIso(),
  }
  const { error } = await db.from("social_command_media_assets").insert(row)
  if (error) throw error
  return row as SocialMediaAsset
}

export async function completeMediaAsset(assetId: string, gateway: Record<string, any>) {
  const db = await socialDb()
  const updates = {
    status: "ready",
    storage_key: cleanString(gateway.storageKey || gateway.storage_key, 1000),
    safe_filename: cleanString(gateway.safeFilename || gateway.safe_filename || gateway.filename, 180),
    mime_type: cleanString(gateway.mimeType || gateway.mime_type, 120),
    size_bytes: Number(gateway.sizeBytes || gateway.size_bytes || 0),
    sha256_hash: cleanString(gateway.sha256 || gateway.sha256_hash, 128) || null,
    metadata: jsonObject(gateway.metadata || {}),
    updated_at: nowIso(),
  }
  const { data, error } = await db.from("social_command_media_assets").update(updates).eq("id", assetId).select("*").single()
  if (error) throw error
  return data as SocialMediaAsset
}

export async function createCampaign(input: Record<string, unknown>, actorUserId: string) {
  const db = await socialDb()
  const row = {
    id: crypto.randomUUID(),
    title: cleanString(input.title, 240) || "Nouvelle campagne",
    objective: cleanString(input.objective, 4000) || null,
    status: cleanString(input.status, 60) || "active",
    start_at: cleanString(input.startAt || input.start_at, 80) || null,
    end_at: cleanString(input.endAt || input.end_at, 80) || null,
    owner_user_id: cleanString(input.ownerUserId || actorUserId, 120) || actorUserId,
    channels: stringArray(input.channels).filter((v) => v === "facebook" || v === "instagram"),
    internal_tags: stringArray(input.internalTags || input.internal_tags),
    created_by: actorUserId,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  const { data, error } = await db.from("social_command_campaigns").insert(row).select("*").single()
  if (error) throw error
  return data as SocialCampaign
}

export async function createPublication(input: Record<string, unknown>, actorUserId: string) {
  const db = await socialDb()
  const format = (["post", "story", "reel", "carousel"].includes(cleanString(input.format, 40)) ? cleanString(input.format, 40) : "post") as SocialFormat
  const channels = stringArray(input.channels).filter((v) => v === "facebook" || v === "instagram") as SocialChannel[]
  if (!channels.length) throw new Error("At least one channel is required")
  const row = {
    id: crypto.randomUUID(),
    title: cleanString(input.title, 260) || `Publication ${format}`,
    format,
    status: cleanString(input.status, 60) || "draft",
    channels,
    caption: cleanString(input.caption, 20000),
    hashtags: stringArray(input.hashtags),
    campaign_id: cleanString(input.campaignId || input.campaign_id, 120) || null,
    owner_user_id: cleanString(input.ownerUserId || actorUserId, 120) || actorUserId,
    scheduled_at: cleanString(input.scheduledAt || input.scheduled_at, 80) || null,
    published_at: null,
    platform_variants: jsonObject(input.platformVariants || input.platform_variants),
    internal_tags: stringArray(input.internalTags || input.internal_tags),
    metadata: jsonObject(input.metadata),
    created_by: actorUserId,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  const { data, error } = await db.from("social_command_publications").insert(row).select("*").single()
  if (error) throw error
  const assetIds = stringArray(input.assetIds || input.asset_ids)
  if (assetIds.length) {
    const links = assetIds.map((assetId, index) => ({ publication_id: row.id, asset_id: assetId, sort_order: index }))
    const { error: linkError } = await db.from("social_command_publication_media").insert(links)
    if (linkError) throw linkError
  }
  return data as SocialPublication
}

export async function updatePublication(publicationId: string, input: Record<string, unknown>) {
  const db = await socialDb()
  const updates: Record<string, unknown> = { updated_at: nowIso() }
  if (input.title !== undefined) updates.title = cleanString(input.title, 260)
  if (input.caption !== undefined) updates.caption = cleanString(input.caption, 20000)
  if (input.status !== undefined) updates.status = cleanString(input.status, 60)
  if (input.scheduledAt !== undefined || input.scheduled_at !== undefined) updates.scheduled_at = cleanString(input.scheduledAt ?? input.scheduled_at, 80) || null
  if (input.channels !== undefined) updates.channels = stringArray(input.channels).filter((v) => v === "facebook" || v === "instagram")
  if (input.hashtags !== undefined) updates.hashtags = stringArray(input.hashtags)
  if (input.campaignId !== undefined || input.campaign_id !== undefined) updates.campaign_id = cleanString(input.campaignId ?? input.campaign_id, 120) || null
  if (input.platformVariants !== undefined || input.platform_variants !== undefined) updates.platform_variants = jsonObject(input.platformVariants ?? input.platform_variants)
  if (input.internalTags !== undefined || input.internal_tags !== undefined) updates.internal_tags = stringArray(input.internalTags ?? input.internal_tags)
  const { data, error } = await db.from("social_command_publications").update(updates).eq("id", publicationId).select("*").single()
  if (error) throw error
  if (input.assetIds !== undefined || input.asset_ids !== undefined) {
    const assetIds = stringArray(input.assetIds ?? input.asset_ids)
    await db.from("social_command_publication_media").delete().eq("publication_id", publicationId)
    if (assetIds.length) {
      const links = assetIds.map((assetId, index) => ({ publication_id: publicationId, asset_id: assetId, sort_order: index }))
      const { error: linkError } = await db.from("social_command_publication_media").insert(links)
      if (linkError) throw linkError
    }
  }
  return data as SocialPublication
}

export async function createJobsForPublication(publication: SocialPublication, dueAt: string) {
  const db = await socialDb()
  const now = nowIso()
  const rows = publication.channels.map((channel) => ({
    id: crypto.randomUUID(),
    publication_id: publication.id,
    channel,
    status: "queued",
    due_at: dueAt,
    locked_at: null,
    attempt_count: 0,
    max_attempts: 5,
    last_error: null,
    provider_reference: null,
    provider_state: {},
    next_attempt_at: dueAt,
    created_at: now,
    updated_at: now,
  }))
  const { data, error } = await db.from("social_command_execution_jobs").insert(rows).select("*")
  if (error) throw error
  return (data || []) as SocialExecutionJob[]
}

export async function replaceFutureJobs(publication: SocialPublication, dueAt: string) {
  const db = await socialDb()
  await db.from("social_command_execution_jobs").delete().eq("publication_id", publication.id).in("status", ["queued", "retrying", "preparing"])
  return createJobsForPublication(publication, dueAt)
}

export async function createOperation(input: {
  type: string
  label: string
  actorUserId: string
  totalItems?: number
  metadata?: Record<string, unknown>
}) {
  const db = await socialDb()
  const now = nowIso()
  const row = {
    id: crypto.randomUUID(),
    operation_key: crypto.randomUUID(),
    operation_type: input.type,
    label: input.label,
    status: "preparing",
    progress: 0,
    current_step: "Préparation",
    total_items: input.totalItems || 1,
    completed_items: 0,
    failed_items: 0,
    error_message: null,
    metadata: input.metadata || {},
    created_by: input.actorUserId,
    created_at: now,
    updated_at: now,
    completed_at: null,
  }
  const { data, error } = await db.from("social_command_action_operations").insert(row).select("*").single()
  if (error) throw error
  return data as SocialActionOperation
}

export async function updateOperation(id: string, patch: Partial<SocialActionOperation>) {
  const db = await socialDb()
  const updates: Record<string, unknown> = { ...patch, updated_at: nowIso() }
  if (patch.status === "completed" && !patch.completed_at) updates.completed_at = nowIso()
  const { data, error } = await db.from("social_command_action_operations").update(updates).eq("id", id).select("*").single()
  if (error) throw error
  return data as SocialActionOperation
}

export async function auditSocial(actorUserId: string | null, action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown> = {}) {
  const db = await socialDb()
  await db.from("social_command_audit_events").insert({
    id: crypto.randomUUID(), actor_user_id: actorUserId, action, entity_type: entityType, entity_id: entityId,
    metadata, created_at: nowIso(),
  })
}

export async function createBulkPlan(input: {
  title: string
  format: SocialFormat
  channels: SocialChannel[]
  slots: BulkSlotDraft[]
  campaignId?: string | null
  actorUserId: string
}) {
  const db = await socialDb()
  const planId = crypto.randomUUID()
  const now = nowIso()
  const { error } = await db.from("social_command_bulk_plans").insert({
    id: planId,
    title: input.title,
    format: input.format,
    channels: input.channels,
    campaign_id: input.campaignId || null,
    slot_count: input.slots.length,
    status: "draft",
    configuration: {},
    created_by: input.actorUserId,
    created_at: now,
    updated_at: now,
  })
  if (error) throw error
  if (input.slots.length) {
    const rows = input.slots.map((slot) => ({
      id: crypto.randomUUID(), bulk_plan_id: planId, slot_no: slot.slotNo, format: slot.format,
      channels: slot.channels, scheduled_at: slot.scheduledAt, title: slot.title, caption: slot.caption,
      hashtags: slot.hashtags, asset_ids: slot.assetIds, platform_variants: slot.platformVariants || {},
      internal_tags: slot.internalTags || [], status: "draft", created_at: now, updated_at: now,
    }))
    const { error: slotError } = await db.from("social_command_bulk_slots").insert(rows)
    if (slotError) throw slotError
  }
  return { id: planId }
}
