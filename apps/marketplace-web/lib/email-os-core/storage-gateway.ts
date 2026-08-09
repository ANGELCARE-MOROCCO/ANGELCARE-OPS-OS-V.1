import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export type StorageDirection = "inbound" | "outbound" | "temp" | "archive"

export type StorageBridgeConfig = {
  bridgeUrl: string
  bridgeToken: string
  hasBridgeUrl: boolean
  hasBridgeToken: boolean
  bridgeUrlHost: string
}

export type StorageFileMetadata = {
  id: string
  module_key: string
  mailbox_id: string | null
  entity_type: string
  entity_id: string | null
  original_filename: string
  safe_filename: string
  content_type: string | null
  size_bytes: number
  sha256_hash: string
  storage_provider: string
  storage_node: string
  storage_bucket: string
  storage_key: string
  status: string
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  destruction_certificate_number?: string | null
  destroyed_at?: string | null
  metadata: Record<string, unknown>
}

export type StorageQuotaRow = {
  id: string
  module_key: string
  quota_bytes: number
  warning_threshold_bytes: number
  critical_threshold_bytes: number
  status: string
  created_at: string
  updated_at: string
}

export type StorageFileUsageSummary = {
  moduleKey: string
  totalFiles: number
  activeFiles: number
  archivedFiles: number
  deletedFiles: number
  usedBytes: number
  lastUpload: StorageEventSummary | null
  lastDownload: StorageEventSummary | null
  lastError: StorageEventSummary | null
  quota: StorageQuotaRow | null
}

export type StorageEventSummary = {
  id: string
  file_id: string | null
  action: string
  module_key: string
  actor_user_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type StorageBridgeUploadInput = {
  moduleKey: string
  mailboxId?: string | null
  entityType: string
  entityId?: string | null
  originalFilename: string
  contentType?: string | null
  contentBase64: string
  createdBy?: string | null
  direction?: StorageDirection
  metadata?: Record<string, unknown>
}

export type StorageBridgeUploadResult = StorageFileMetadata & {
  direction: StorageDirection
  freeBytes: number
  usedBytes: number
  totalBytes: number
  warning: boolean
  critical: boolean
}

export type StorageBridgeUsageResult = {
  ok: true
  data: {
    rootLabel: string
    usedBytes: number
    freeBytes: number
    totalBytes: number
    warning: boolean
    critical: boolean
    bucket: string
    rootDirectory: string
    directories: Record<StorageDirection, string>
  }
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function sanitizePathSegment(value: unknown) {
  return clean(value).replace(/[\\/:*?"<>|]+/g, "_").replace(/\.+/g, ".").replace(/^\.|\.?$/g, "").replace(/\s+/g, "_").slice(0, 80) || "item"
}

export function sanitizeStorageFilename(value: unknown) {
  const raw = clean(value).replace(/[\\/:*?"<>|]+/g, "_")
  const safe = raw.replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "")
  return safe.slice(0, 160) || "attachment"
}

export function normalizeStorageDirection(value: unknown): StorageDirection {
  const text = clean(value).toLowerCase()
  if (text === "inbound" || text === "archive" || text === "temp") return text
  return "outbound"
}

export function normalizeStorageModuleKey(value: unknown) {
  return sanitizePathSegment(clean(value).toLowerCase() || "email_os")
}

export function normalizeStorageEntityType(value: unknown) {
  return sanitizePathSegment(clean(value).toLowerCase() || "attachment")
}

export function readStorageBridgeConfig(): StorageBridgeConfig {
  const bridgeUrl = clean(process.env.EMAIL_OS_STORAGE_BRIDGE_URL || process.env.EMAIL_OS_BRIDGE_URL).replace(/\/+$/, "")
  const bridgeToken = clean(process.env.EMAIL_BRIDGE_ADMIN_TOKEN || process.env.EMAIL_OS_STORAGE_BRIDGE_TOKEN || process.env.EMAIL_OS_BRIDGE_TOKEN)
  return {
    bridgeUrl,
    bridgeToken,
    hasBridgeUrl: Boolean(bridgeUrl),
    hasBridgeToken: Boolean(bridgeToken),
    bridgeUrlHost: bridgeUrl ? (() => {
      try {
        return new URL(bridgeUrl).host
      } catch {
        return ""
      }
    })() : ""
  }
}

async function callStorageBridge(pathname: string, options: RequestInit = {}) {
  const config = readStorageBridgeConfig()
  if (!config.hasBridgeUrl || !/^https?:\/\//i.test(config.bridgeUrl)) {
    throw new Error("Storage bridge URL is not configured")
  }
  if (!config.hasBridgeToken) {
    throw new Error("Storage bridge admin token is not configured")
  }

  const headers = new Headers(options.headers || {})
  headers.set("x-email-bridge-admin-token", config.bridgeToken)
  if (!headers.has("content-type") && options.body && typeof options.body === "string") {
    headers.set("content-type", "application/json")
  }

  const response = await fetch(`${config.bridgeUrl}${pathname}`, {
    ...options,
    headers,
    cache: "no-store"
  })

  const text = await response.text().catch(() => "")
  let payload: any = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok || payload?.ok === false) {
    const message = payload?.error || `Storage bridge request failed with HTTP ${response.status}`
    throw new Error(message)
  }

  return { response, payload, text }
}

export async function uploadStorageFileToBridge(input: StorageBridgeUploadInput) {
  const payload = {
    moduleKey: normalizeStorageModuleKey(input.moduleKey),
    mailboxId: clean(input.mailboxId) || null,
    entityType: normalizeStorageEntityType(input.entityType),
    entityId: clean(input.entityId) || null,
    originalFilename: clean(input.originalFilename),
    contentType: clean(input.contentType) || null,
    contentBase64: clean(input.contentBase64),
    createdBy: clean(input.createdBy) || null,
    direction: normalizeStorageDirection(input.direction),
    metadata: input.metadata || {}
  }

  const result = await callStorageBridge("/admin/storage/upload", {
    method: "POST",
    body: JSON.stringify(payload)
  })

  return result.payload?.data as StorageBridgeUploadResult
}

export async function downloadStorageFileFromBridge(fileId: string) {
  const result = await callStorageBridge(`/admin/storage/download/${encodeURIComponent(clean(fileId))}`, {
    method: "GET"
  })

  return result.response
}

export async function deleteStorageFileFromBridge(input: {
  fileId: string
  reason?: string
  actorUserId?: string | null
  mailboxId?: string | null
  moduleKey?: string | null
}) {
  const result = await callStorageBridge("/admin/storage/delete", {
    method: "POST",
    body: JSON.stringify({
      fileId: clean(input.fileId),
      reason: clean(input.reason) || "requested_delete",
      actorUserId: clean(input.actorUserId) || null,
      mailboxId: clean(input.mailboxId) || null,
      moduleKey: clean(input.moduleKey) || null
    })
  })

  return result.payload?.data || null
}

export async function getStorageHealthFromBridge() {
  const result = await callStorageBridge("/admin/storage/health", { method: "GET" })
  return result.payload?.data || null
}

export async function getStorageUsageFromBridge() {
  const result = await callStorageBridge("/admin/storage/usage", { method: "GET" })
  return result.payload?.data || null
}

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function upsertStorageFileMetadata(db = createEmailOSCoreDb(), row: Partial<StorageFileMetadata> & { id: string }) {
  const payload = {
    id: clean(row.id) || makeEmailOSId(),
    module_key: normalizeStorageModuleKey(row.module_key || "email_os"),
    mailbox_id: clean(row.mailbox_id) || null,
    entity_type: normalizeStorageEntityType(row.entity_type || "attachment"),
    entity_id: clean(row.entity_id) || null,
    original_filename: clean(row.original_filename || "attachment"),
    safe_filename: sanitizeStorageFilename(row.safe_filename || row.original_filename || "attachment"),
    content_type: clean(row.content_type) || null,
    size_bytes: asNumber(row.size_bytes),
    sha256_hash: clean(row.sha256_hash),
    storage_provider: clean(row.storage_provider) || "windows_node",
    storage_node: clean(row.storage_node) || "angelcare-windows-node-01",
    storage_bucket: clean(row.storage_bucket) || "email-os-attachments",
    storage_key: clean(row.storage_key),
    status: clean(row.status) || "active",
    created_by: clean(row.created_by) || null,
    created_at: clean(row.created_at) || nowIso(),
    updated_at: clean(row.updated_at) || nowIso(),
    deleted_at: row.deleted_at ? clean(row.deleted_at) : null,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {}
  }

  const { data, error } = await db.from("angelcare_storage_files").upsert(payload).select("*").single()
  if (error) throw error
  return data as StorageFileMetadata
}

export async function recordStorageEvent(db = createEmailOSCoreDb(), row: {
  fileId?: string | null
  action: string
  moduleKey: string
  actorUserId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}) {
  const payload = {
    id: makeEmailOSId(),
    file_id: clean(row.fileId) || null,
    action: clean(row.action) || "unknown",
    module_key: normalizeStorageModuleKey(row.moduleKey || "email_os"),
    actor_user_id: clean(row.actorUserId) || null,
    ip_address: clean(row.ipAddress) || null,
    user_agent: clean(row.userAgent) || null,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    created_at: nowIso()
  }

  const { data, error } = await db.from("angelcare_storage_events").insert(payload).select("*").single()
  if (error) throw error
  return data as StorageEventSummary
}

export async function loadStorageFileMetadata(db = createEmailOSCoreDb(), fileId: string) {
  const { data, error } = await db.from("angelcare_storage_files").select("*").eq("id", clean(fileId)).maybeSingle()
  if (error) throw error
  return data as StorageFileMetadata | null
}

export async function loadStorageQuotaForModule(db = createEmailOSCoreDb(), moduleKey: string) {
  const key = normalizeStorageModuleKey(moduleKey || "email_os")
  const { data, error } = await db
    .from("angelcare_storage_quotas")
    .select("*")
    .eq("module_key", key)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data || null) as StorageQuotaRow | null
}

export async function loadStorageUsageSummary(db = createEmailOSCoreDb(), moduleKey: string): Promise<StorageFileUsageSummary> {
  const key = normalizeStorageModuleKey(moduleKey || "email_os")
  const [filesResult, eventsResult, quota] = await Promise.all([
    db.from("angelcare_storage_files").select("*").eq("module_key", key).order("created_at", { ascending: false }).limit(1000),
    db.from("angelcare_storage_events").select("*").eq("module_key", key).order("created_at", { ascending: false }).limit(250),
    loadStorageQuotaForModule(db, key)
  ])

  if (filesResult.error) throw filesResult.error
  if (eventsResult.error) throw eventsResult.error

  const files = (filesResult.data || []) as StorageFileMetadata[]
  const events = (eventsResult.data || []) as StorageEventSummary[]
  const activeFiles = files.filter((file) => clean(file.status) === "active" && !file.deleted_at)
  const archivedFiles = files.filter((file) => clean(file.status) === "archived").length
  const deletedFiles = files.filter((file) => clean(file.status) === "deleted" || Boolean(file.deleted_at)).length
  const usedBytes = activeFiles.reduce((sum, file) => sum + asNumber(file.size_bytes), 0)

  const pickEvent = (actions: string[]) => events.find((event) => actions.includes(clean(event.action).toLowerCase())) || null
  const lastUpload = pickEvent(["upload", "file_upload", "stored", "inbound_sync"])
  const lastDownload = pickEvent(["download", "file_download", "read"])
  const lastError = events.find((event) => /error|fail|blocked/i.test(clean(event.action) || clean(event.metadata?.status))) || null

  return {
    moduleKey: key,
    totalFiles: files.length,
    activeFiles: activeFiles.length,
    archivedFiles,
    deletedFiles,
    usedBytes,
    lastUpload,
    lastDownload,
    lastError,
    quota
  }
}

export function buildStorageRelativeKey(params: {
  direction: StorageDirection
  moduleKey: string
  entityType: string
  fileId: string
  safeFilename: string
}) {
  return [
    "email-os",
    "attachments",
    normalizeStorageDirection(params.direction),
    normalizeStorageModuleKey(params.moduleKey),
    normalizeStorageEntityType(params.entityType),
    clean(params.fileId) || makeEmailOSId(),
    sanitizeStorageFilename(params.safeFilename)
  ].join("/")
}

export function buildStorageBucket() {
  return "email-os-attachments"
}
