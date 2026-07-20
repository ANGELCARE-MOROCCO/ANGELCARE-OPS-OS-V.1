import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import type {
  WindowsStorageEmailInvestigationResult,
  WindowsStorageEmailReference,
  WindowsStorageMessageRecord,
} from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

type AnyRow = Record<string, any>

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function bounded(value: string | null, fallback = 100) {
  const parsed = Number(value || fallback)
  return Number.isFinite(parsed) ? Math.max(1, Math.min(250, Math.floor(parsed))) : fallback
}

function jsonSize(value: unknown) {
  try {
    return Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value ?? ""), "utf8")
  } catch {
    return 0
  }
}

function directionFromEntity(row: AnyRow) {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {}
  const explicit = clean(metadata.direction || row.direction).toLowerCase()
  if (["inbound", "outbound", "temp", "archive"].includes(explicit)) return explicit
  const entityType = clean(row.entity_type).toLowerCase()
  if (entityType.includes("pop3") || entityType.includes("inbox") || entityType.includes("incoming")) return "inbound"
  if (entityType.includes("draft") || entityType.includes("temp")) return "temp"
  return "outbound"
}

async function safeRows(queryPromise: PromiseLike<{ data: AnyRow[] | null; error: any }>, warning: string, warnings: string[]) {
  try {
    const { data, error } = await queryPromise
    if (error) {
      warnings.push(`${warning}: ${clean(error.message || error)}`)
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (error) {
    warnings.push(`${warning}: ${error instanceof Error ? error.message : String(error)}`)
    return []
  }
}

function messageShape(row: AnyRow, messageType: string): WindowsStorageMessageRecord {
  const raw = row.raw && typeof row.raw === "object" ? row.raw : {}
  const body = row.body_html || row.body_text || row.body || row.preview || raw.text || raw.html || ""
  return {
    id: clean(row.id || row.provider_uid),
    mailboxId: clean(row.mailbox_id) || null,
    messageType,
    direction: messageType === "inbox" ? "inbound" : messageType === "outbox" ? "outbound" : "temp",
    subject: clean(row.subject) || "Sans objet",
    sender: clean(row.from_email || row.sender_email || raw.from?.text || raw.from) || "Expéditeur indisponible",
    recipients: clean(row.to_email || row.recipient_email || raw.to?.text || raw.to) || "Destinataire indisponible",
    status: clean(row.status) || "unknown",
    createdAt: clean(row.created_at) || null,
    updatedAt: clean(row.updated_at) || null,
    sentAt: clean(row.sent_at) || null,
    bodySizeBytes: jsonSize(body),
    attachmentCount: 0,
    attachmentBytes: 0,
    providerReference: clean(row.provider_message_id || row.provider_uid || row.message_id) || null,
    storageReferences: [],
  }
}

function storageReference(row: AnyRow, message: WindowsStorageMessageRecord | null): WindowsStorageEmailReference {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {}
  return {
    id: clean(row.id) || clean(row.storage_key),
    fileId: clean(row.id) || null,
    mailboxId: clean(row.mailbox_id) || message?.mailboxId || null,
    direction: directionFromEntity(row),
    messageType: message?.messageType || clean(row.entity_type) || "storage_object",
    messageId: message?.id || clean(row.entity_id) || null,
    threadId: clean(metadata.threadId || metadata.thread_id || row.thread_id) || null,
    subject: message?.subject || clean(metadata.subject) || "Relation de message à confirmer",
    sender: message?.sender || clean(metadata.from || metadata.from_email) || "Non disponible",
    recipients: message?.recipients || clean(metadata.to || metadata.to_email) || "Non disponible",
    messageStatus: message?.status || clean(row.status) || "unknown",
    messageDate: message?.sentAt || message?.createdAt || clean(row.created_at) || null,
    filename: clean(row.original_filename || row.safe_filename) || "attachment",
    contentType: clean(row.content_type) || null,
    sizeBytes: Number(row.size_bytes || 0),
    storageBucket: clean(row.storage_bucket) || null,
    storageKey: clean(row.storage_key) || null,
    entityType: clean(row.entity_type) || null,
    entityId: clean(row.entity_id) || null,
    sha256Hash: clean(row.sha256_hash) || null,
    referenceState: message ? "referenced" : clean(row.entity_id) ? "business_reference_unresolved" : "entity_reference_missing",
    source: "angelcare_storage_files",
  }
}

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const mode = url.searchParams.get("mode") === "messages" ? "messages" : url.searchParams.get("mode") === "relationship" ? "relationship" : "attachments"
  const mailboxId = clean(url.searchParams.get("mailboxId"))
  const fileId = clean(url.searchParams.get("fileId"))
  const entityId = clean(url.searchParams.get("entityId"))
  const query = clean(url.searchParams.get("query")).slice(0, 120)
  const limit = bounded(url.searchParams.get("limit"), 120)
  const warnings: string[] = []
  const db = createEmailOSCoreDb()

  let storageQuery: any = db.from("angelcare_storage_files").select("*").order("created_at", { ascending: false }).limit(limit)
  storageQuery = storageQuery.eq("module_key", "email_os")
  if (mailboxId) storageQuery = storageQuery.eq("mailbox_id", mailboxId)
  if (fileId) storageQuery = storageQuery.eq("id", fileId)
  if (entityId) storageQuery = storageQuery.eq("entity_id", entityId)
  if (query) storageQuery = storageQuery.or(`original_filename.ilike.%${query.replace(/[,()]/g, " ")}%,safe_filename.ilike.%${query.replace(/[,()]/g, " ")}%,mailbox_id.ilike.%${query.replace(/[,()]/g, " ")}%`)
  const storageRows = await safeRows(storageQuery, "angelcare_storage_files", warnings)

  const entityIds = Array.from(new Set(storageRows.map((row) => clean(row.entity_id)).filter(Boolean))).slice(0, 250)
  const mailboxIds = Array.from(new Set(storageRows.map((row) => clean(row.mailbox_id)).filter(Boolean))).slice(0, 100)

  const inboxRows = entityIds.length
    ? await safeRows(db.from("email_os_core_inbox").select("*").in("provider_uid", entityIds).limit(250), "email_os_core_inbox relations", warnings)
    : []
  const outboxRows = entityIds.length
    ? await safeRows(db.from("email_os_core_outbox").select("*").in("id", entityIds).limit(250), "email_os_core_outbox relations", warnings)
    : []
  const draftRows = entityIds.length
    ? await safeRows(db.from("email_os_core_saved_drafts").select("*").in("id", entityIds).limit(250), "email_os_core_saved_drafts relations", warnings)
    : []

  const messageByReference = new Map<string, WindowsStorageMessageRecord>()
  for (const row of inboxRows) {
    const message = messageShape(row, "inbox")
    messageByReference.set(clean(row.provider_uid), message)
    messageByReference.set(clean(row.id), message)
  }
  for (const row of outboxRows) messageByReference.set(clean(row.id), messageShape(row, "outbox"))
  for (const row of draftRows) messageByReference.set(clean(row.id), messageShape(row, "draft"))

  const attachmentReferences = storageRows.map((row) => storageReference(row, messageByReference.get(clean(row.entity_id)) || null))

  let messages: WindowsStorageMessageRecord[] = []
  if (mode === "messages" || query || mailboxId) {
    const sanitized = query.replace(/[,()]/g, " ")
    let inboxQuery: any = db.from("email_os_core_inbox").select("*").order("created_at", { ascending: false }).limit(limit)
    let outboxQuery: any = db.from("email_os_core_outbox").select("*").order("created_at", { ascending: false }).limit(limit)
    let draftsQuery: any = db.from("email_os_core_saved_drafts").select("*").order("created_at", { ascending: false }).limit(Math.min(limit, 100))
    if (mailboxId) {
      inboxQuery = inboxQuery.eq("mailbox_id", mailboxId)
      outboxQuery = outboxQuery.eq("mailbox_id", mailboxId)
      draftsQuery = draftsQuery.eq("mailbox_id", mailboxId)
    }
    if (query) {
      inboxQuery = inboxQuery.or(`subject.ilike.%${sanitized}%,from_email.ilike.%${sanitized}%,to_email.ilike.%${sanitized}%`)
      outboxQuery = outboxQuery.or(`subject.ilike.%${sanitized}%,from_email.ilike.%${sanitized}%,to_email.ilike.%${sanitized}%`)
      draftsQuery = draftsQuery.or(`subject.ilike.%${sanitized}%,to_email.ilike.%${sanitized}%`)
    }
    const [inbox, outbox, drafts] = await Promise.all([
      safeRows(inboxQuery, "email_os_core_inbox", warnings),
      safeRows(outboxQuery, "email_os_core_outbox", warnings),
      safeRows(draftsQuery, "email_os_core_saved_drafts", warnings),
    ])
    messages = [
      ...inbox.map((row) => messageShape(row, "inbox")),
      ...outbox.map((row) => messageShape(row, "outbox")),
      ...drafts.map((row) => messageShape(row, "draft")),
    ].sort((left, right) => new Date(right.sentAt || right.createdAt || 0).getTime() - new Date(left.sentAt || left.createdAt || 0).getTime()).slice(0, limit)
  } else {
    messages = Array.from(new Map(Array.from(messageByReference.values()).map((message) => [message.id, message])).values())
  }

  const refsByMessage = new Map<string, WindowsStorageEmailReference[]>()
  for (const reference of attachmentReferences) {
    if (!reference.messageId) continue
    const rows = refsByMessage.get(reference.messageId) || []
    rows.push(reference)
    refsByMessage.set(reference.messageId, rows)
  }
  messages = messages.map((message) => {
    const refs = refsByMessage.get(message.providerReference || "") || refsByMessage.get(message.id) || []
    return {
      ...message,
      attachmentCount: refs.length,
      attachmentBytes: refs.reduce((sum, row) => sum + Number(row.sizeBytes || 0), 0),
      storageReferences: refs,
    }
  })

  const result: WindowsStorageEmailInvestigationResult = {
    phase: 2,
    readOnly: true,
    mode,
    attachments: attachmentReferences,
    messages,
    totalAttachments: attachmentReferences.length,
    totalMessages: messages.length,
    warnings,
    queriedAt: new Date().toISOString(),
  }

  return NextResponse.json({ ok: true, data: result }, { headers: { "cache-control": "no-store" } })
}
