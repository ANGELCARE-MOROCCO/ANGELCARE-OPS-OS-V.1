import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { loadStorageFileMetadata, type StorageFileMetadata } from "@/lib/email-os-core/storage-gateway"

export const EMAIL_OS_MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
export const EMAIL_OS_MAX_TOTAL_ATTACHMENT_BYTES = 15 * 1024 * 1024
export const EMAIL_OS_MAX_ATTACHMENT_COUNT = 10

const ALLOWED_STORAGE_STATUSES = new Set(["active", "deduplicated"])
const BLOCKED_STORAGE_STATUSES = new Set(["quarantined", "deleted", "destroyed", "permanently_deleted"])

export type CanonicalComposeAttachment = {
  filename: string
  contentType: string
  contentBase64?: string
  storageFileId?: string
  fileId?: string
  sizeBytes: number
  storageBucket?: string
  storageKey?: string
  sha256Hash?: string
  source: "storage" | "legacy_inline"
}

export class EmailOSAttachmentError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "EmailOSAttachmentError"
    this.code = code
    this.status = status
  }
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function safeFilename(value: unknown) {
  return (clean(value).replace(/[\\/:*?"<>|]/g, "_").slice(0, 160) || "attachment")
}

function estimateBase64Bytes(value: string) {
  const normalized = value.replace(/\s/g, "")
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor(normalized.length * 3 / 4) - padding)
}

function rawAttachmentRows(value: unknown) {
  if (!Array.isArray(value)) return []
  if (value.length > EMAIL_OS_MAX_ATTACHMENT_COUNT) {
    throw new EmailOSAttachmentError("ATTACHMENT_COUNT_EXCEEDED", `Maximum ${EMAIL_OS_MAX_ATTACHMENT_COUNT} attachments are allowed.`)
  }
  return value
}

function normalizedStorageId(item: any) {
  return clean(item?.storageFileId || item?.storage_file_id || item?.fileId || item?.file_id)
}

function validateStorageRow(row: StorageFileMetadata | null, mailboxId: string, requestedFilename: string) {
  if (!row) {
    throw new EmailOSAttachmentError("ATTACHMENT_STORAGE_NOT_FOUND", `Attachment ${requestedFilename || "file"} was not found in AngelCare storage.`, 404)
  }

  const status = clean(row.status).toLowerCase()
  if (BLOCKED_STORAGE_STATUSES.has(status)) {
    const code = status === "quarantined" ? "ATTACHMENT_QUARANTINED" : "ATTACHMENT_DELETED"
    throw new EmailOSAttachmentError(code, `Attachment ${row.original_filename || requestedFilename} is not available for sending.`, status === "quarantined" ? 423 : 410)
  }
  if (!ALLOWED_STORAGE_STATUSES.has(status)) {
    throw new EmailOSAttachmentError("ATTACHMENT_INVALID", `Attachment ${row.original_filename || requestedFilename} has unsupported storage status ${status || "unknown"}.`, 409)
  }
  if (clean(row.module_key).toLowerCase() !== "email_os") {
    throw new EmailOSAttachmentError("ATTACHMENT_ACCESS_DENIED", "Attachment does not belong to Email OS storage.", 403)
  }
  if (!clean(row.mailbox_id) || clean(row.mailbox_id) !== clean(mailboxId)) {
    throw new EmailOSAttachmentError("ATTACHMENT_ACCESS_DENIED", "Attachment does not belong to the selected mailbox.", 403)
  }
  if (!clean(row.storage_key) || !clean(row.storage_bucket) || !clean(row.storage_provider)) {
    throw new EmailOSAttachmentError("ATTACHMENT_INVALID", `Attachment ${row.original_filename || requestedFilename} has incomplete storage metadata.`, 409)
  }

  const size = Number(row.size_bytes || 0)
  if (!Number.isFinite(size) || size <= 0) {
    throw new EmailOSAttachmentError("ATTACHMENT_INVALID", `Attachment ${row.original_filename || requestedFilename} has invalid size metadata.`, 409)
  }
  if (size > EMAIL_OS_MAX_ATTACHMENT_BYTES) {
    throw new EmailOSAttachmentError("ATTACHMENT_TOO_LARGE", `Attachment ${row.original_filename || requestedFilename} exceeds the 8 MB limit.`, 413)
  }

  return row
}

export async function validateComposeAttachments(input: {
  db?: any
  mailboxId: string
  attachments: unknown
}) {
  const db = input.db || createEmailOSCoreDb()
  const mailboxId = clean(input.mailboxId)
  if (!mailboxId) {
    throw new EmailOSAttachmentError("ATTACHMENT_ACCESS_DENIED", "Mailbox scope is required for attachments.", 403)
  }

  const rows = rawAttachmentRows(input.attachments)
  const canonical: CanonicalComposeAttachment[] = []
  let totalBytes = 0

  for (const item of rows) {
    const filename = safeFilename(item?.filename || item?.name || item?.original_filename)
    const contentType = clean(item?.contentType || item?.content_type || item?.mimeType || item?.type) || "application/octet-stream"
    const storageFileId = normalizedStorageId(item)
    const contentBase64 = clean(item?.contentBase64 || item?.content_base64 || item?.base64 || item?.content)

    if (storageFileId) {
      const row = validateStorageRow(await loadStorageFileMetadata(db, storageFileId), mailboxId, filename)
      const sizeBytes = Number(row.size_bytes || 0)
      totalBytes += sizeBytes
      if (totalBytes > EMAIL_OS_MAX_TOTAL_ATTACHMENT_BYTES) {
        throw new EmailOSAttachmentError("ATTACHMENT_TOTAL_LIMIT_EXCEEDED", "Total attachments exceed the 15 MB limit.", 413)
      }
      canonical.push({
        filename: safeFilename(row.original_filename || filename),
        contentType: clean(row.content_type || contentType) || "application/octet-stream",
        storageFileId,
        fileId: storageFileId,
        sizeBytes,
        storageBucket: clean(row.storage_bucket),
        storageKey: clean(row.storage_key),
        sha256Hash: clean(row.sha256_hash),
        source: "storage",
      })
      continue
    }

    if (!contentBase64) {
      throw new EmailOSAttachmentError("ATTACHMENT_INVALID", `Attachment ${filename} has no storage reference or inline content.`)
    }
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(contentBase64)) {
      throw new EmailOSAttachmentError("ATTACHMENT_INVALID", `Attachment ${filename} is not valid base64.`)
    }
    const sizeBytes = estimateBase64Bytes(contentBase64)
    if (!sizeBytes) {
      throw new EmailOSAttachmentError("ATTACHMENT_INVALID", `Attachment ${filename} has no file content.`)
    }
    if (sizeBytes > EMAIL_OS_MAX_ATTACHMENT_BYTES) {
      throw new EmailOSAttachmentError("ATTACHMENT_TOO_LARGE", `Attachment ${filename} exceeds the 8 MB limit.`, 413)
    }
    totalBytes += sizeBytes
    if (totalBytes > EMAIL_OS_MAX_TOTAL_ATTACHMENT_BYTES) {
      throw new EmailOSAttachmentError("ATTACHMENT_TOTAL_LIMIT_EXCEEDED", "Total attachments exceed the 15 MB limit.", 413)
    }
    canonical.push({
      filename,
      contentType,
      contentBase64,
      sizeBytes,
      source: "legacy_inline",
    })
  }

  return canonical
}

function composeRowFromAttachment(input: {
  mailboxId: string
  draftId?: string | null
  outboxId?: string | null
  attachment: CanonicalComposeAttachment
  metadata?: Record<string, unknown>
}) {
  const attachment = input.attachment
  return {
    id: makeEmailOSId(),
    draft_id: clean(input.draftId) || null,
    outbox_id: clean(input.outboxId) || null,
    mailbox_id: clean(input.mailboxId),
    filename: attachment.filename,
    size_bytes: attachment.sizeBytes,
    mime_type: attachment.contentType || null,
    storage_file_id: clean(attachment.storageFileId) || null,
    storage_bucket: clean(attachment.storageBucket) || null,
    storage_key: clean(attachment.storageKey) || null,
    source: attachment.source,
    sha256_hash: clean(attachment.sha256Hash) || null,
    status: "attached",
    metadata: {
      ...(input.metadata || {}),
      source: attachment.source,
      storageFileId: clean(attachment.storageFileId) || null,
      storageBucket: clean(attachment.storageBucket) || null,
      storageKey: clean(attachment.storageKey) || null,
      sha256Hash: clean(attachment.sha256Hash) || null,
    },
    updated_at: nowIso(),
  }
}

export async function persistComposeAttachments(input: {
  db?: any
  mailboxId: string
  draftId?: string | null
  outboxId?: string | null
  attachments: CanonicalComposeAttachment[]
  metadata?: Record<string, unknown>
}) {
  const db = input.db || createEmailOSCoreDb()
  const mailboxId = clean(input.mailboxId)
  const draftId = clean(input.draftId) || null
  const outboxId = clean(input.outboxId) || null
  if (!mailboxId) throw new EmailOSAttachmentError("ATTACHMENT_ACCESS_DENIED", "Mailbox scope is required for attachment persistence.", 403)
  if (!draftId && !outboxId) throw new EmailOSAttachmentError("ATTACHMENT_INVALID", "draftId or outboxId is required for attachment persistence.")

  const rows = input.attachments.map((attachment) => composeRowFromAttachment({ mailboxId, draftId, outboxId, attachment, metadata: input.metadata }))
  if (!rows.length) return []

  const results: any[] = []
  for (const row of rows) {
    let query = db.from("email_os_core_compose_attachments").select("*").eq("mailbox_id", mailboxId)
    query = draftId ? query.eq("draft_id", draftId) : query.eq("outbox_id", outboxId)
    if (row.storage_file_id) query = query.eq("storage_file_id", row.storage_file_id)
    else query = query.eq("filename", row.filename).eq("size_bytes", row.size_bytes).eq("source", row.source)

    const { data: existing, error: existingError } = await query.limit(1).maybeSingle()
    if (existingError) throw existingError

    if (existing?.id) {
      const { data, error } = await db
        .from("email_os_core_compose_attachments")
        .update({
          filename: row.filename,
          size_bytes: row.size_bytes,
          mime_type: row.mime_type,
          storage_file_id: row.storage_file_id,
          storage_bucket: row.storage_bucket,
          storage_key: row.storage_key,
          source: row.source,
          sha256_hash: row.sha256_hash,
          status: "attached",
          metadata: row.metadata,
          updated_at: row.updated_at,
        })
        .eq("id", existing.id)
        .select("*")
        .single()
      if (error) throw error
      results.push(data)
    } else {
      const { data, error } = await db.from("email_os_core_compose_attachments").insert(row).select("*").single()
      if (error) throw error
      results.push(data)
    }
  }
  return results
}

export async function loadComposeAttachments(input: {
  db?: any
  mailboxId: string
  draftId?: string | null
  outboxId?: string | null
}) {
  const db = input.db || createEmailOSCoreDb()
  const mailboxId = clean(input.mailboxId)
  const draftId = clean(input.draftId) || null
  const outboxId = clean(input.outboxId) || null
  if (!mailboxId || (!draftId && !outboxId)) return []

  let query = db.from("email_os_core_compose_attachments").select("*").eq("mailbox_id", mailboxId).eq("status", "attached")
  query = draftId ? query.eq("draft_id", draftId) : query.eq("outbox_id", outboxId)
  const { data, error } = await query.order("created_at", { ascending: true })
  if (error) throw error

  return (data || []).map((row: any) => ({
    fileId: clean(row.storage_file_id) || undefined,
    storageFileId: clean(row.storage_file_id) || undefined,
    filename: clean(row.filename) || "attachment",
    name: clean(row.filename) || "attachment",
    contentType: clean(row.mime_type) || "application/octet-stream",
    mimeType: clean(row.mime_type) || "application/octet-stream",
    sizeBytes: Number(row.size_bytes || 0),
    storageBucket: clean(row.storage_bucket) || undefined,
    storageKey: clean(row.storage_key) || undefined,
    sha256Hash: clean(row.sha256_hash) || undefined,
    source: clean(row.source) || "storage",
    status: clean(row.status) || "attached",
    downloadUrl: clean(row.storage_file_id) ? `/api/storage/download/${encodeURIComponent(clean(row.storage_file_id))}?mailboxId=${encodeURIComponent(mailboxId)}` : undefined,
  }))
}

export function attachmentErrorResponse(error: unknown) {
  if (error instanceof EmailOSAttachmentError) {
    return { code: error.code, message: error.message, status: error.status }
  }
  return null
}
