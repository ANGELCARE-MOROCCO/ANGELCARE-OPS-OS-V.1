import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { audit } from "@/lib/email-os-core/audit"
import {
  auditMailboxAccessEvent,
  getUserEmailOSAdminProfile,
  requireUnlockedMailboxAccess,
  resolveMailboxScopeForUser
} from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { deleteStorageFileFromBridge } from "@/lib/email-os-core/storage-gateway"
import {
  buildEmailOSInboundIdentityFromRow,
  recordEmailOSInboundSuppressions
} from "@/lib/email-os-core/inbound-identity"
import {
  emailOSOperatorDirectoryMap,
  emailOSOperatorSnapshot,
  identityFromSnapshot,
  loadEmailOSOperatorDirectory,
  normalizeEmailOSOperatorIdentity,
  resolveEmailOSOperatorIdentity,
  type EmailOSOperatorIdentity
} from "@/lib/email-os-core/operator-identity"

type WorkflowAction =
  | "mark_read"
  | "mark_unread"
  | "archive"
  | "restore"
  | "set_status"
  | "set_priority"
  | "set_category"
  | "assign_owner"
  | "add_internal_note"
  | "create_followup_task"
  | "link_entity"
  | "resolve"
  | "reopen"
  | "move_trash"
  | "mark_spam"
  | "delete_permanent"

type MessageSource = "inbox" | "outbox" | "drafts" | "saved_drafts"

const MESSAGE_STATUSES = new Set([
  "new",
  "triaged",
  "assigned",
  "in_progress",
  "waiting_client",
  "waiting_internal",
  "resolved",
  "archived",
  "trash",
  "trashed",
  "spam",
  "deleted"
])

const PRIORITIES = new Set(["low", "normal", "high", "urgent", "vip"])

const CATEGORIES = new Set([
  "parent_client",
  "b2b",
  "partnership",
  "recruitment",
  "finance_payment",
  "complaint",
  "supplier",
  "internal",
  "other"
])

const SOURCE_TABLES: Record<MessageSource, string[]> = {
  inbox: ["email_os_core_inbox"],
  outbox: ["email_os_core_outbox"],
  drafts: ["email_os_core_drafts"],
  saved_drafts: ["email_os_core_saved_drafts"]
}

const WORKFLOW_SOURCE_TABLES = [...SOURCE_TABLES.inbox, ...SOURCE_TABLES.outbox, ...SOURCE_TABLES.drafts, ...SOURCE_TABLES.saved_drafts]

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function cleanLower(value: unknown) {
  return clean(value).toLowerCase()
}

function parseAction(value: unknown): WorkflowAction | null {
  const action = cleanLower(value)
  if (
    action === "mark_read" ||
    action === "mark_unread" ||
    action === "archive" ||
    action === "restore" ||
    action === "set_status" ||
    action === "set_priority" ||
    action === "set_category" ||
    action === "assign_owner" ||
    action === "add_internal_note" ||
    action === "create_followup_task" ||
    action === "link_entity" ||
    action === "resolve" ||
    action === "reopen" ||
    action === "move_trash" ||
    action === "mark_spam" ||
    action === "delete_permanent"
  ) {
    return action
  }

  return null
}

function normalizeSource(value: unknown): MessageSource {
  const text = cleanLower(value)
  if (text === "outbox" || text === "sent" || text === "queue") return "outbox"
  if (text === "draft" || text === "drafts") return "drafts"
  if (text === "saved_drafts" || text === "saved-drafts") return "saved_drafts"
  return "inbox"
}

function normalizeStatus(value: unknown) {
  const text = cleanLower(value)
  if (MESSAGE_STATUSES.has(text)) return text as any
  return "triaged"
}

function normalizePriority(value: unknown) {
  const text = cleanLower(value)
  if (PRIORITIES.has(text)) return text
  return "normal"
}

function normalizeCategory(value: unknown) {
  const text = cleanLower(value)
  if (CATEGORIES.has(text)) return text
  return "other"
}

function dueMinutesFor(priority: string, category: string) {
  const normalizedPriority = normalizePriority(priority)
  const normalizedCategory = normalizeCategory(category)
  if (normalizedPriority === "vip" || normalizedPriority === "urgent" || normalizedCategory === "complaint") return 30
  if (normalizedCategory === "finance_payment") return 120
  if (normalizedCategory === "b2b" || normalizedCategory === "partnership") return 240
  if (normalizedPriority === "low") return 24 * 60
  return 8 * 60
}

function formatBodyPreview(row: any) {
  const source = clean(row?.preview || row?.body || row?.raw?.text || row?.raw?.html || row?.subject)
  return source.replace(/\s+/g, " ").trim().slice(0, 280)
}

function getSenderName(row: any) {
  return clean(row?.from_name || row?.sender_name || row?.raw?.fromName || row?.raw?.senderName || row?.from_email || row?.sender_email)
}

function getSenderEmail(row: any) {
  return clean(row?.from_email || row?.sender_email || row?.raw?.fromEmail || row?.raw?.senderEmail || row?.raw?.from)
}

function getMailboxLabel(mailbox: any) {
  return clean(mailbox?.name || mailbox?.label || mailbox?.address || mailbox?.email || mailbox?.email_address || mailbox?.id || "Mailbox")
}

function getMailboxEmail(mailbox: any) {
  return clean(mailbox?.address || mailbox?.email || mailbox?.email_address || mailbox?.from_email || "")
}

function safeAttachmentList(row: any) {
  const raw = row?.raw || {}
  const attachments = Array.isArray(raw?.attachments) ? raw.attachments : Array.isArray(row?.attachments) ? row.attachments : []
  return attachments.map((attachment: any) => ({
    filename: clean(attachment?.filename || attachment?.name || "attachment"),
    size: Number(attachment?.size || attachment?.size_bytes || 0),
    contentType: clean(attachment?.contentType || attachment?.content_type || attachment?.mimeType || attachment?.type || "application/octet-stream"),
    storageFileId: clean(attachment?.storageFileId || attachment?.storage_file_id || attachment?.fileId || attachment?.file_id || ""),
    storageBucket: clean(attachment?.storageBucket || attachment?.storage_bucket || ""),
    storageKey: clean(attachment?.storageKey || attachment?.storage_key || ""),
    storageStatus: clean(attachment?.storageStatus || attachment?.storage_status || ""),
    source: clean(attachment?.source || "")
  }))
}

function statusFromRow(row: any) {
  return cleanLower(row?.status || (row?.read_at ? "read" : "new"))
}

function sourceTableCandidates(source?: MessageSource | null) {
  if (source && SOURCE_TABLES[source]) return SOURCE_TABLES[source]
  return WORKFLOW_SOURCE_TABLES
}

async function safeSelect(db: ReturnType<typeof createEmailOSCoreDb>, table: string, builder?: (query: any) => any) {
  try {
    let query = db.from(table).select("*")
    if (builder) query = builder(query)
    const { data, error } = await query
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

async function findMessageRow(db: ReturnType<typeof createEmailOSCoreDb>, mailboxId: string | null, messageId: string) {
  for (const table of WORKFLOW_SOURCE_TABLES) {
    let query = db.from(table).select("*").eq("id", messageId).limit(1)
    if (mailboxId) query = query.eq("mailbox_id", mailboxId)
    const { data, error } = await query.maybeSingle()
    if (!error && data) {
      return { table, row: data }
    }
  }

  return { table: null, row: null }
}

function inferInitialStatus(row: any, source: MessageSource) {
  const rowStatus = statusFromRow(row)
  if (rowStatus === "archived") return "archived"
  if (rowStatus === "resolved") return "resolved"
  if (rowStatus === "read" || row?.read_at) return "triaged"
  if (source === "outbox") return "triaged"
  return "new"
}

function inferMessageTimestamp(row: any) {
  return clean(row?.created_at || row?.updated_at || row?.raw?.date || nowIso())
}

function buildWorkflowRow(row: any, table: string, mailboxId: string) {
  const source = normalizeSource(table === "email_os_core_outbox" ? "outbox" : table === "email_os_core_drafts" ? "drafts" : table === "email_os_core_saved_drafts" ? "saved_drafts" : "inbox")
  const subject = clean(row?.subject || "(Sans objet)")
  const priority = normalizePriority(row?.priority || row?.raw?.priority || "normal")
  const category = normalizeCategory(row?.category || row?.tag || row?.label || row?.raw?.category || "other")
  const timestamp = inferMessageTimestamp(row)
  const dueMinutes = dueMinutesFor(priority, category)
  const dueAt = new Date(new Date(timestamp).getTime() + dueMinutes * 60 * 1000).toISOString()

  return {
    id: makeEmailOSId(),
    mailbox_id: mailboxId,
    message_id: clean(row?.id),
    external_id: clean(row?.provider_uid || row?.external_id || row?.raw?.externalId || row?.raw?.providerUid || row?.raw?.messageId || row?.id),
    source_table: table,
    thread_id: clean(row?.thread_id || row?.raw?.threadId || row?.raw?.thread_id || ""),
    subject,
    sender_name: getSenderName(row) || null,
    sender_email: getSenderEmail(row) || null,
    recipient_email: clean(row?.to_email || row?.raw?.to?.[0] || row?.raw?.toEmail || ""),
    status: inferInitialStatus(row, source),
    priority,
    category,
    owner_user_id: clean(row?.owner_user_id || row?.owner || row?.assigned_to || ""),
    owner_name_snapshot: clean(row?.owner_name_snapshot || row?.owner_name || ""),
    owner_email_snapshot: clean(row?.owner_email_snapshot || row?.owner_email || ""),
    owner_role_snapshot: clean(row?.owner_role_snapshot || row?.owner_role || ""),
    owner_department_snapshot: clean(row?.owner_department_snapshot || row?.owner_department || ""),
    owner_title_snapshot: clean(row?.owner_title_snapshot || row?.owner_title || ""),
    assigned_by: clean(row?.assigned_by || ""),
    assigned_by_name_snapshot: clean(row?.assigned_by_name_snapshot || ""),
    assigned_by_email_snapshot: clean(row?.assigned_by_email_snapshot || ""),
    assigned_by_role_snapshot: clean(row?.assigned_by_role_snapshot || ""),
    assigned_by_department_snapshot: clean(row?.assigned_by_department_snapshot || ""),
    assigned_by_title_snapshot: clean(row?.assigned_by_title_snapshot || ""),
    assigned_at: row?.assigned_at || null,
    read_at: row?.read_at || null,
    archived_at: row?.archived_at || null,
    resolved_at: row?.resolved_at || null,
    reopened_count: Number(row?.reopened_count || 0),
    first_response_due_at: row?.first_response_due_at || dueAt,
    waiting_since_at: row?.waiting_since_at || null,
    last_operator_action_at: row?.last_operator_action_at || null,
    last_handled_by_user_id: clean(row?.last_handled_by_user_id || ""),
    last_handled_by_name_snapshot: clean(row?.last_handled_by_name_snapshot || ""),
    last_handled_by_email_snapshot: clean(row?.last_handled_by_email_snapshot || ""),
    last_handled_by_role_snapshot: clean(row?.last_handled_by_role_snapshot || ""),
    last_handled_by_department_snapshot: clean(row?.last_handled_by_department_snapshot || ""),
    last_handled_by_title_snapshot: clean(row?.last_handled_by_title_snapshot || ""),
    last_action: clean(row?.last_action || ""),
    last_action_at: row?.last_action_at || null,
    linked_entity_type: clean(row?.linked_entity_type || ""),
    linked_entity_id: clean(row?.linked_entity_id || ""),
    linked_entity_label: clean(row?.linked_entity_label || ""),
    metadata_json: {
      inferred: true,
      source,
      timestamp,
      bodyPreview: formatBodyPreview(row)
    },
    created_at: timestamp,
    updated_at: timestamp
  }
}

function mergeWorkflowMessage(row: any, workflow: any, mailbox: any) {
  const source = normalizeSource(row?.__source || workflow?.source_table || row?.source)
  const subject = clean(row?.subject || workflow?.subject || "(Sans objet)")
  const senderEmail = clean(row?.from_email || workflow?.sender_email || row?.sender_email || row?.raw?.fromEmail)
  const senderName = clean(row?.from_name || workflow?.sender_name || row?.raw?.fromName || senderEmail)
  const createdAt = inferMessageTimestamp(row)
  const workflowStatus = normalizeStatus(workflow?.status || inferInitialStatus(row, source))
  const priority = normalizePriority(workflow?.priority || row?.priority || "normal")
  const category = normalizeCategory(workflow?.category || row?.category || row?.tag || row?.label || "other")
  const dueMinutes = dueMinutesFor(priority, category)
  const firstResponseDueAt = clean(workflow?.first_response_due_at || new Date(new Date(createdAt).getTime() + dueMinutes * 60 * 1000).toISOString())
  const hasAttachments = Boolean((Array.isArray(row?.attachments) && row.attachments.length) || (Array.isArray(row?.raw?.attachments) && row.raw.attachments.length) || row?.raw?.hasAttachments)

  return {
    id: clean(row?.id),
    messageId: clean(row?.id),
    mailboxId: clean(row?.mailbox_id || mailbox?.id),
    mailbox_id: clean(row?.mailbox_id || mailbox?.id),
    source,
    sourceTable: workflow?.source_table || row?.source_table || sourceTableCandidates(source)[0],
    externalId: clean(workflow?.external_id || row?.provider_uid || row?.external_id || row?.raw?.externalId || row?.raw?.providerUid || row?.id),
    threadId: clean(workflow?.thread_id || row?.thread_id || row?.raw?.threadId || ""),
    subject,
    fromName: senderName || null,
    fromEmail: senderEmail || null,
    toEmail: clean(row?.to_email || workflow?.recipient_email || row?.raw?.toEmail || row?.raw?.to?.join?.(", ") || ""),
    preview: formatBodyPreview(row),
    body: clean(row?.body || row?.raw?.text || row?.raw?.html || row?.preview || ""),
    bodyHtml: row?.raw?.html || row?.html || null,
    bodyText: row?.raw?.text || row?.body || row?.text || null,
    receivedAt: createdAt,
    createdAt,
    updatedAt: clean(row?.updated_at || createdAt),
    hasAttachments,
    attachments: safeAttachmentList(row),
    readAt: row?.read_at || workflow?.read_at || null,
    archivedAt: row?.archived_at || workflow?.archived_at || null,
    deletedAt: row?.deleted_at || workflow?.deleted_at || null,
    spamAt: row?.spam_at || workflow?.spam_at || null,
    permanentlyDeletedAt: row?.permanently_deleted_at || workflow?.permanently_deleted_at || null,
    status: workflowStatus,
    priority,
    category,
    ownerUserId: clean(workflow?.owner_user_id || row?.owner_user_id || row?.owner || row?.assigned_to || ""),
    ownerName: clean(workflow?.owner_name_snapshot || row?.owner_name_snapshot || row?.owner_name || ""),
    ownerEmail: clean(workflow?.owner_email_snapshot || row?.owner_email_snapshot || row?.owner_email || ""),
    ownerRole: clean(workflow?.owner_role_snapshot || row?.owner_role_snapshot || row?.owner_role || ""),
    ownerDepartment: clean(workflow?.owner_department_snapshot || row?.owner_department_snapshot || row?.owner_department || ""),
    ownerTitle: clean(workflow?.owner_title_snapshot || row?.owner_title_snapshot || row?.owner_title || ""),
    assignedBy: clean(workflow?.assigned_by || row?.assigned_by || ""),
    assignedByName: clean(workflow?.assigned_by_name_snapshot || row?.assigned_by_name_snapshot || ""),
    assignedByEmail: clean(workflow?.assigned_by_email_snapshot || row?.assigned_by_email_snapshot || ""),
    assignedAt: workflow?.assigned_at || row?.assigned_at || null,
    sentByUserId: clean(row?.sent_by_user_id || row?.diagnostics?.operator?.userId || ""),
    sentByName: clean(row?.sent_by_name || row?.diagnostics?.operator?.name || row?.diagnostics?.operator?.fullName || ""),
    sentByEmail: clean(row?.sent_by_email || row?.diagnostics?.operator?.email || ""),
    sentByRole: clean(row?.sent_by_role || row?.diagnostics?.operator?.role || ""),
    sentByDepartment: clean(row?.sent_by_department || row?.diagnostics?.operator?.department || ""),
    lastHandledByUserId: clean(workflow?.last_handled_by_user_id || row?.last_handled_by_user_id || ""),
    lastHandledByName: clean(workflow?.last_handled_by_name_snapshot || row?.last_handled_by_name_snapshot || ""),
    lastHandledByEmail: clean(workflow?.last_handled_by_email_snapshot || row?.last_handled_by_email_snapshot || ""),
    lastHandledByRole: clean(workflow?.last_handled_by_role_snapshot || row?.last_handled_by_role_snapshot || ""),
    lastHandledByDepartment: clean(workflow?.last_handled_by_department_snapshot || row?.last_handled_by_department_snapshot || ""),
    lastAction: clean(workflow?.last_action || row?.last_action || ""),
    lastActionAt: workflow?.last_action_at || row?.last_action_at || null,
    lastOperatorActionAt: workflow?.last_operator_action_at || null,
    waitingSinceAt: workflow?.waiting_since_at || null,
    firstResponseDueAt,
    reopenedCount: Number(workflow?.reopened_count || 0),
    linkedEntityType: workflow?.linked_entity_type || null,
    linkedEntityId: workflow?.linked_entity_id || null,
    linkedEntityLabel: workflow?.linked_entity_label || null,
    trackingEnabled: Boolean(row?.tracking_enabled || row?.diagnostics?.tracking?.enabled),
    trackingId: clean(row?.tracking_id || row?.diagnostics?.tracking?.trackingId || row?.diagnostics?.tracking?.tracking_id || ""),
    firstOpenedAt: row?.first_opened_at || row?.diagnostics?.tracking?.firstOpenedAt || row?.diagnostics?.tracking?.first_opened_at || null,
    lastOpenedAt: row?.last_opened_at || row?.diagnostics?.tracking?.lastOpenedAt || row?.diagnostics?.tracking?.last_opened_at || null,
    openCount: Number(row?.open_count || row?.diagnostics?.tracking?.openCount || row?.diagnostics?.tracking?.open_count || 0),
    mailboxName: getMailboxLabel(mailbox),
    mailboxEmail: getMailboxEmail(mailbox),
    sla: {
      dueAt: firstResponseDueAt,
      overdue: new Date(firstResponseDueAt).getTime() < Date.now(),
      dueInMinutes: Math.max(0, Math.floor((new Date(firstResponseDueAt).getTime() - Date.now()) / 60000))
    }
  }
}

function isHardDeletedMergedMessage(row: any) {
  const status = cleanLower(row?.status || row?.workflowStatus || row?.state)
  return Boolean(row?.permanentlyDeletedAt || row?.permanently_deleted_at) || status === "deleted" || status === "deleted_permanent" || status === "permanently_deleted"
}

function computeStats(messages: any[], workflowRows: any[], mailboxId?: string | null) {
  const rows = mailboxId ? messages.filter((row) => clean(row.mailboxId) === mailboxId) : messages
  const workflowMap = new Map<string, any>()
  for (const row of workflowRows) {
    workflowMap.set(`${clean(row.mailbox_id)}:${clean(row.message_id)}:${clean(row.source_table)}`, row)
  }

  const assignedToMe = rows.filter((row) => row.ownerUserId).length
  const unread = rows.filter((row) => !row.readAt && row.source === "inbox").length
  const overdue = rows.filter((row) => row.sla?.overdue).length
  const waiting = rows.filter((row) => ["waiting_client", "waiting_internal"].includes(cleanLower(row.status))).length

  return {
    inbox: rows.filter((row) => row.source === "inbox").length,
    unread,
    drafts: rows.filter((row) => row.source === "drafts" || row.source === "saved_drafts").length,
    outbox: rows.filter((row) => row.source === "outbox").length,
    failed: rows.filter((row) => cleanLower(row.status).includes("fail")).length,
    assigned_to_me: assignedToMe,
    overdue,
    waiting,
    total: rows.length,
    workflowRows: workflowMap.size
  }
}

async function loadMailboxMap(db: ReturnType<typeof createEmailOSCoreDb>, mailboxIds: string[]) {
  if (!mailboxIds.length) return new Map<string, any>()
  const { data } = await db.from("email_os_core_mailboxes").select("*").in("id", mailboxIds)
  const map = new Map<string, any>()
  for (const row of data || []) {
    map.set(clean(row.id), row)
  }
  return map
}

async function loadWorkflowRows(db: ReturnType<typeof createEmailOSCoreDb>, mailboxId: string | null) {
  let query = db.from("email_os_message_workflow").select("*").order("updated_at", { ascending: false }).limit(1000)
  if (mailboxId) query = query.eq("mailbox_id", mailboxId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function loadMessages(db: ReturnType<typeof createEmailOSCoreDb>, mailboxId: string | null) {
  const fetchTable = async (table: string) => {
    let query = db.from(table).select("*").order("created_at", { ascending: false }).limit(500)
    if (mailboxId) query = query.eq("mailbox_id", mailboxId)
    const { data, error } = await query
    if (error) return []
    return data || []
  }

  const [inbox, outbox, drafts, savedDrafts] = await Promise.all([
    fetchTable("email_os_core_inbox"),
    fetchTable("email_os_core_outbox"),
    fetchTable("email_os_core_drafts"),
    fetchTable("email_os_core_saved_drafts")
  ])

  return { inbox, outbox, drafts, savedDrafts }
}

async function loadWorkspaceDetail(db: ReturnType<typeof createEmailOSCoreDb>, mailboxId: string | null, messageId: string) {
  const message = await findMessageRow(db, mailboxId, messageId)
  if (!message.row) return { message: null, workflow: null, notes: [], tasks: [], links: [], audit: [] }

  const workflowQuery = db.from("email_os_message_workflow").select("*").eq("mailbox_id", clean(message.row.mailbox_id || mailboxId || "")).eq("message_id", clean(messageId))
  const workflow = await workflowQuery.eq("source_table", message.table || "").maybeSingle()

  const [notes, tasks, links, auditRows] = await Promise.all([
    safeSelect(db, "email_os_message_notes", (query) => query.eq("mailbox_id", clean(message.row.mailbox_id || mailboxId || "")).eq("message_id", clean(messageId)).order("created_at", { ascending: false }).limit(100)),
    safeSelect(db, "email_os_message_tasks", (query) => query.eq("mailbox_id", clean(message.row.mailbox_id || mailboxId || "")).eq("message_id", clean(messageId)).order("created_at", { ascending: false }).limit(100)),
    safeSelect(db, "email_os_message_entity_links", (query) => query.eq("mailbox_id", clean(message.row.mailbox_id || mailboxId || "")).eq("message_id", clean(messageId)).order("created_at", { ascending: false }).limit(100)),
    safeSelect(db, "email_os_message_audit_events", (query) => query.eq("mailbox_id", clean(message.row.mailbox_id || mailboxId || "")).eq("message_id", clean(messageId)).order("created_at", { ascending: false }).limit(100))
  ])

  return {
    message,
    workflow: workflow.data || null,
    notes,
    tasks,
    links,
    audit: auditRows
  }
}

async function ensureWorkflowRow(db: ReturnType<typeof createEmailOSCoreDb>, mailboxId: string, table: string, row: any) {
  const source = normalizeSource(table === "email_os_core_outbox" ? "outbox" : table === "email_os_core_drafts" ? "drafts" : table === "email_os_core_saved_drafts" ? "saved_drafts" : "inbox")
  const defaults = buildWorkflowRow(row, table, mailboxId)

  const { data, error } = await db
    .from("email_os_message_workflow")
    .upsert(defaults, { onConflict: "mailbox_id,message_id,source_table" })
    .select("*")
    .maybeSingle()

  if (error) throw error
  return data || defaults
}

async function updateSourceRow(
  db: ReturnType<typeof createEmailOSCoreDb>,
  table: string,
  mailboxId: string,
  messageId: string,
  patch: Record<string, unknown>
) {
  const { data, error } = await db
    .from(table)
    .update(patch)
    .eq("id", messageId)
    .eq("mailbox_id", mailboxId)
    .select("*")
    .maybeSingle()

  if (error) return { data: null, error }
  return { data, error: null }
}

function collectStorageFileIdsFromValue(value: any, ids = new Set<string>()) {
  if (!value) return ids

  if (Array.isArray(value)) {
    for (const item of value) collectStorageFileIdsFromValue(item, ids)
    return ids
  }

  if (typeof value === "object") {
    const candidates = [
      value.storageFileId,
      value.storage_file_id,
      value.fileId,
      value.file_id,
      value.storageId,
      value.storage_id,
      value.id && (value.storage_provider || value.storage_key || value.storageBucket) ? value.id : ""
    ]

    for (const candidate of candidates) {
      const id = clean(candidate)
      if (id) ids.add(id)
    }

    for (const nested of Object.values(value)) {
      if (nested && (Array.isArray(nested) || typeof nested === "object")) {
        collectStorageFileIdsFromValue(nested, ids)
      }
    }
  }

  return ids
}

function collectMessageStorageFileIds(row: any) {
  const ids = new Set<string>()
  collectStorageFileIdsFromValue(row?.attachments, ids)
  collectStorageFileIdsFromValue(row?.raw?.attachments, ids)
  collectStorageFileIdsFromValue(row?.metadata, ids)
  collectStorageFileIdsFromValue(row?.metadata_json, ids)
  return Array.from(ids)
}

async function deleteMessageStorageFiles(params: {
  db: ReturnType<typeof createEmailOSCoreDb>
  mailboxId: string
  messageId: string
  row: any
  actorUserId: string
}) {
  const ids = new Set<string>(collectMessageStorageFileIds(params.row))

  const { data: metadataRows } = await params.db
    .from("angelcare_storage_files")
    .select("id")
    .eq("module_key", "email_os")
    .eq("mailbox_id", params.mailboxId)
    .or(`entity_id.eq.${params.messageId},metadata->>messageId.eq.${params.messageId},metadata->>message_id.eq.${params.messageId}`)
    .then((result: any) => result, () => ({ data: [] }))

  for (const row of metadataRows || []) {
    const id = clean(row?.id)
    if (id) ids.add(id)
  }

  const deleted: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const fileId of ids) {
    try {
      await deleteStorageFileFromBridge({
        fileId,
        reason: "email_os_permanent_message_delete",
        actorUserId: params.actorUserId,
        mailboxId: params.mailboxId,
        moduleKey: "email_os"
      })
      deleted.push(fileId)
    } catch (error) {
      failed.push({ id: fileId, error: error instanceof Error ? error.message : "storage delete failed" })
    }
  }

  if (ids.size > 0) {
    await params.db
      .from("angelcare_storage_files")
      .delete()
      .in("id", Array.from(ids))
      .then(() => null, () => null)

    await params.db
      .from("angelcare_storage_events")
      .delete()
      .in("file_id", Array.from(ids))
      .then(() => null, () => null)
  }

  return { requested: Array.from(ids), deleted, failed }
}

async function eraseEmailMessageCompletely(params: {
  db: ReturnType<typeof createEmailOSCoreDb>
  mailboxId: string
  messageId: string
  sourceTable: string
  sourceRow: any
  actorUserId: string
}) {
  const storage = await deleteMessageStorageFiles({
    db: params.db,
    mailboxId: params.mailboxId,
    messageId: params.messageId,
    row: params.sourceRow,
    actorUserId: params.actorUserId
  })

  const ids = Array.from(new Set([
    clean(params.messageId),
    clean(params.sourceRow?.id),
    clean(params.sourceRow?.message_id),
    clean(params.sourceRow?.source_id),
    clean(params.sourceRow?.external_id),
    clean(params.sourceRow?.provider_uid),
    clean(params.sourceRow?.provider_message_id),
    clean(params.sourceRow?.tracking_id)
  ].filter(Boolean)))

  const workflowTables = [
    "email_os_message_notes",
    "email_os_message_tasks",
    "email_os_message_entity_links",
    "email_os_message_assignments",
    "email_os_message_audit_events",
    "email_os_message_workflow"
  ]

  for (const table of workflowTables) {
    for (const id of ids) {
      await params.db.from(table).delete().eq("mailbox_id", params.mailboxId).eq("message_id", id).then(() => null, () => null)
      await params.db.from(table).delete().eq("mailbox_id", params.mailboxId).eq("external_id", id).then(() => null, () => null)
    }
  }

  for (const table of WORKFLOW_SOURCE_TABLES) {
    for (const id of ids) {
      await params.db.from(table).delete().eq("mailbox_id", params.mailboxId).eq("id", id).then(() => null, () => null)
      await params.db.from(table).delete().eq("mailbox_id", params.mailboxId).eq("provider_uid", id).then(() => null, () => null)
      await params.db.from(table).delete().eq("mailbox_id", params.mailboxId).eq("provider_message_id", id).then(() => null, () => null)
      await params.db.from(table).delete().eq("mailbox_id", params.mailboxId).eq("tracking_id", id).then(() => null, () => null)
    }
  }

  for (const id of ids) {
    await params.db.from("email_os_tracking_events").delete().eq("tracking_id", id).then(() => null, () => null)
  }

  return { ...storage, erasedIds: ids }
}

function requiredPermission(action: WorkflowAction) {
  if (action === "archive" || action === "restore" || action === "resolve" || action === "reopen" || action === "move_trash" || action === "mark_spam" || action === "delete_permanent") return "can_archive" as const
  return "can_read" as const
}

function sourcePatchForAction(action: WorkflowAction, workflow: any) {
  const now = nowIso()
  const patch: Record<string, unknown> = { updated_at: now }

  if (action === "mark_read") {
    patch.status = "read"
    patch.read_at = now
  }

  if (action === "mark_unread") {
    patch.status = "unread"
    patch.read_at = null
  }

  if (action === "archive") {
    patch.status = "archived"
    patch.archived_at = now
  }

  if (action === "move_trash") {
    patch.status = "trash"
    patch.deleted_at = now
  }

  if (action === "mark_spam") {
    patch.status = "spam"
    patch.spam_at = now
  }

  if (action === "delete_permanent") {
    patch.status = "deleted"
    patch.deleted_at = now
    patch.permanently_deleted_at = now
  }

  if (action === "restore") {
    patch.status = workflow?.source_table === "email_os_core_outbox" ? "sent" : workflow?.source_table === "email_os_core_drafts" || workflow?.source_table === "email_os_core_saved_drafts" ? "draft" : "received"
    patch.archived_at = null
    patch.deleted_at = null
    patch.spam_at = null
    patch.permanently_deleted_at = null
  }

  return patch
}

async function recordWorkflowAudit(db: ReturnType<typeof createEmailOSCoreDb>, payload: {
  mailboxId: string
  messageId: string
  externalId?: string | null
  threadId?: string | null
  action: string
  actorUserId?: string | null
  actorIdentity?: EmailOSOperatorIdentity | null
  severity?: string
  details?: Record<string, unknown>
}) {
  const row = {
    id: makeEmailOSId(),
    mailbox_id: payload.mailboxId,
    message_id: payload.messageId,
    external_id: payload.externalId || null,
    thread_id: payload.threadId || null,
    action: payload.action,
    actor_user_id: payload.actorUserId || payload.actorIdentity?.id || null,
    actor_name_snapshot: payload.actorIdentity?.fullName || null,
    actor_email_snapshot: payload.actorIdentity?.email || null,
    actor_role_snapshot: payload.actorIdentity?.role || null,
    actor_department_snapshot: payload.actorIdentity?.department || null,
    actor_title_snapshot: payload.actorIdentity?.title || null,
    severity: payload.severity || "info",
    details_json: payload.details || {},
    created_at: nowIso()
  }

  await db.from("email_os_message_audit_events").insert(row).then(() => null, () => null)
  await audit(`message.${payload.action}`, {
    targetType: "message",
    targetId: payload.messageId,
    mailboxId: payload.mailboxId,
    severity: payload.severity || "info",
    action: payload.action,
    details: payload.details || {}
  }).catch(() => null)
}

async function applyWorkflowAction(params: {
  db: ReturnType<typeof createEmailOSCoreDb>
  userId: string
  mailboxId: string
  messageId: string
  action: WorkflowAction
  sourceTable: string
  sourceRow: any
  workflowRow: any
  payload: Record<string, any>
  request?: Request | null
  actorIdentity: EmailOSOperatorIdentity
}) {
  const now = nowIso()
  const action = params.action
  const workflow = params.workflowRow || (await ensureWorkflowRow(params.db, params.mailboxId, params.sourceTable, params.sourceRow))
  const sourcePatch = sourcePatchForAction(action, workflow)
  const actorSnapshot = emailOSOperatorSnapshot(params.actorIdentity)
  const workflowPatch: Record<string, unknown> = {
    updated_at: now,
    last_action: action,
    last_action_at: now,
    last_operator_action_at: now,
    last_handled_by_user_id: actorSnapshot.userId,
    last_handled_by_name_snapshot: actorSnapshot.name,
    last_handled_by_email_snapshot: actorSnapshot.email,
    last_handled_by_role_snapshot: actorSnapshot.role,
    last_handled_by_department_snapshot: actorSnapshot.department,
    last_handled_by_title_snapshot: actorSnapshot.title
  }

  if (action === "mark_read") {
    workflowPatch.status = "triaged"
    workflowPatch.read_at = now
  }

  if (action === "mark_unread") {
    workflowPatch.status = "new"
    workflowPatch.read_at = null
  }

  if (action === "archive") {
    workflowPatch.status = "archived"
    workflowPatch.archived_at = now
  }

  if (action === "move_trash") {
    // Keep status inside the original DB check constraint; folder projection uses deleted_at.
    workflowPatch.status = "archived"
    workflowPatch.deleted_at = now
  }

  if (action === "mark_spam") {
    // Keep status inside the original DB check constraint; folder projection uses spam_at.
    workflowPatch.status = "archived"
    workflowPatch.spam_at = now
  }

  if (action === "delete_permanent") {
    // Keep status inside the original DB check constraint; folder projection uses permanently_deleted_at.
    workflowPatch.status = "archived"
    workflowPatch.deleted_at = now
    workflowPatch.permanently_deleted_at = now
  }

  if (action === "restore") {
    workflowPatch.status = "triaged"
    workflowPatch.archived_at = null
    workflowPatch.deleted_at = null
    workflowPatch.spam_at = null
    workflowPatch.permanently_deleted_at = null
  }

  if (action === "set_status") {
    workflowPatch.status = normalizeStatus(params.payload.status)
    if (workflowPatch.status === "waiting_client" || workflowPatch.status === "waiting_internal") {
      workflowPatch.waiting_since_at = now
    }
    if (workflowPatch.status === "resolved") {
      workflowPatch.resolved_at = now
    }
    if (workflowPatch.status === "archived") {
      workflowPatch.archived_at = now
    }
  }

  if (action === "set_priority") {
    workflowPatch.priority = normalizePriority(params.payload.priority)
  }

  if (action === "set_category") {
    workflowPatch.category = normalizeCategory(params.payload.category)
  }

  if (action === "assign_owner") {
    const ownerUserId = clean(params.payload.ownerUserId || params.payload.owner_user_id || params.payload.owner || "")
    const ownerIdentity = ownerUserId ? await resolveEmailOSOperatorIdentity(params.db, ownerUserId) : null
    const ownerSnapshot = emailOSOperatorSnapshot(ownerIdentity)
    workflowPatch.owner_user_id = ownerUserId || null
    workflowPatch.owner_name_snapshot = ownerSnapshot.name
    workflowPatch.owner_email_snapshot = ownerSnapshot.email
    workflowPatch.owner_role_snapshot = ownerSnapshot.role
    workflowPatch.owner_department_snapshot = ownerSnapshot.department
    workflowPatch.owner_title_snapshot = ownerSnapshot.title
    workflowPatch.assigned_by = params.userId
    workflowPatch.assigned_by_name_snapshot = actorSnapshot.name
    workflowPatch.assigned_by_email_snapshot = actorSnapshot.email
    workflowPatch.assigned_by_role_snapshot = actorSnapshot.role
    workflowPatch.assigned_by_department_snapshot = actorSnapshot.department
    workflowPatch.assigned_by_title_snapshot = actorSnapshot.title
    workflowPatch.assigned_at = now
    workflowPatch.status = "assigned"

    if (ownerUserId) {
      await params.db.from("email_os_message_assignments").insert({
        id: makeEmailOSId(),
        mailbox_id: params.mailboxId,
        message_id: params.messageId,
        external_id: clean(workflow?.external_id || params.sourceRow?.provider_uid || params.sourceRow?.external_id || ""),
        thread_id: clean(workflow?.thread_id || params.sourceRow?.thread_id || ""),
        owner_user_id: ownerUserId,
        assignee_name_snapshot: ownerSnapshot.name,
        assignee_email_snapshot: ownerSnapshot.email,
        assignee_role_snapshot: ownerSnapshot.role,
        assignee_department_snapshot: ownerSnapshot.department,
        assignee_title_snapshot: ownerSnapshot.title,
        assigned_by: params.userId,
        assigned_by_name_snapshot: actorSnapshot.name,
        assigned_by_email_snapshot: actorSnapshot.email,
        assigned_by_role_snapshot: actorSnapshot.role,
        assigned_by_department_snapshot: actorSnapshot.department,
        assigned_by_title_snapshot: actorSnapshot.title,
        status: "active",
        note: clean(params.payload.note || params.payload.reason || ""),
        metadata_json: {
          source: clean(params.payload.source || "team-operations"),
          handoff: Boolean(params.payload.handoff)
        },
        assigned_at: now,
        created_at: now,
        updated_at: now
      }).then(() => null, () => null)
    }
  }

  if (action === "resolve") {
    workflowPatch.status = "resolved"
    workflowPatch.resolved_at = now
    workflowPatch.last_operator_action_at = now
    workflowPatch.waiting_since_at = null
  }

  if (action === "reopen") {
    workflowPatch.status = "in_progress"
    workflowPatch.reopened_count = Number(workflow?.reopened_count || 0) + 1
    workflowPatch.resolved_at = null
    workflowPatch.last_operator_action_at = now
  }

  if (action === "link_entity") {
    workflowPatch.linked_entity_type = clean(params.payload.entityType || params.payload.entity_type || "")
    workflowPatch.linked_entity_id = clean(params.payload.entityId || params.payload.entity_id || "")
    workflowPatch.linked_entity_label = clean(params.payload.entityLabel || params.payload.entity_label || "")
  }

  if (action === "add_internal_note") {
    const note = clean(params.payload.body || params.payload.note || "")
    if (!note) {
      throw new Error("Note body is required")
    }

    const noteRow = {
      id: makeEmailOSId(),
      mailbox_id: params.mailboxId,
      message_id: params.messageId,
      external_id: clean(workflow?.external_id || ""),
      thread_id: clean(workflow?.thread_id || ""),
      body: note,
      author_user_id: params.userId,
      author_name: params.actorIdentity.fullName,
      author_email: params.actorIdentity.email,
      author_role: params.actorIdentity.role,
      author_department: params.actorIdentity.department,
      author_title: params.actorIdentity.title,
      visibility: "internal",
      metadata_json: {
        source: "message-detail",
        status: params.payload.status || null
      },
      created_at: now,
      updated_at: now
    }

    const { data: noteData, error: noteError } = await params.db.from("email_os_message_notes").insert(noteRow).select("*").single()
    if (noteError) throw noteError

    workflowPatch.last_operator_action_at = now
    await recordWorkflowAudit(params.db, {
      mailboxId: params.mailboxId,
      messageId: params.messageId,
      externalId: workflow?.external_id || null,
      threadId: workflow?.thread_id || null,
      action,
      actorUserId: params.userId,
      actorIdentity: params.actorIdentity,
      details: { noteId: noteData?.id, body: note }
    })

    return { workflowPatch, sourcePatch, extra: { note: noteData } }
  }

  if (action === "create_followup_task") {
    const title = clean(params.payload.title || params.payload.subject || `Follow-up: ${clean(params.sourceRow?.subject || workflow?.subject || "Message")}`)
    if (!title) throw new Error("Task title is required")

    const taskOwnerUserId = clean(params.payload.ownerUserId || params.payload.owner_user_id || params.payload.owner || workflow?.owner_user_id || "")
    const taskOwnerIdentity = taskOwnerUserId ? await resolveEmailOSOperatorIdentity(params.db, taskOwnerUserId) : null
    const taskOwnerSnapshot = emailOSOperatorSnapshot(taskOwnerIdentity)

    const taskRow = {
      id: makeEmailOSId(),
      mailbox_id: params.mailboxId,
      message_id: params.messageId,
      external_id: clean(workflow?.external_id || ""),
      thread_id: clean(workflow?.thread_id || ""),
      title,
      description: clean(params.payload.description || params.payload.body || ""),
      owner_user_id: taskOwnerUserId,
      owner_name_snapshot: taskOwnerSnapshot.name,
      owner_email_snapshot: taskOwnerSnapshot.email,
      owner_role_snapshot: taskOwnerSnapshot.role,
      owner_department_snapshot: taskOwnerSnapshot.department,
      owner_title_snapshot: taskOwnerSnapshot.title,
      created_by_user_id: actorSnapshot.userId,
      created_by_name_snapshot: actorSnapshot.name,
      created_by_email_snapshot: actorSnapshot.email,
      created_by_role_snapshot: actorSnapshot.role,
      created_by_department_snapshot: actorSnapshot.department,
      created_by_title_snapshot: actorSnapshot.title,
      due_at: params.payload.dueAt || params.payload.due_at || null,
      priority: normalizePriority(params.payload.priority || workflow?.priority || "normal"),
      status: "open",
      note: clean(params.payload.note || ""),
      metadata_json: { source: "message-detail" },
      created_at: now,
      updated_at: now,
      completed_at: null
    }

    const { data: taskData, error: taskError } = await params.db.from("email_os_message_tasks").insert(taskRow).select("*").single()
    if (taskError) throw taskError

    workflowPatch.last_operator_action_at = now
    await recordWorkflowAudit(params.db, {
      mailboxId: params.mailboxId,
      messageId: params.messageId,
      externalId: workflow?.external_id || null,
      threadId: workflow?.thread_id || null,
      action,
      actorUserId: params.userId,
      actorIdentity: params.actorIdentity,
      details: { taskId: taskData?.id, title }
    })

    return { workflowPatch, sourcePatch, extra: { task: taskData } }
  }

  if (action === "set_status" || action === "set_priority" || action === "set_category" || action === "assign_owner" || action === "resolve" || action === "reopen" || action === "link_entity" || action === "archive" || action === "restore" || action === "mark_read" || action === "mark_unread" || action === "move_trash" || action === "mark_spam" || action === "delete_permanent") {
    const workflowNote = clean(params.payload.note || params.payload.reason || "")
    if (workflowNote) {
      await params.db.from("email_os_message_notes").insert({
        id: makeEmailOSId(),
        mailbox_id: params.mailboxId,
        message_id: params.messageId,
        external_id: workflow?.external_id || clean(params.sourceRow?.provider_uid || params.sourceRow?.external_id || ""),
        thread_id: workflow?.thread_id || clean(params.sourceRow?.thread_id || ""),
        body: workflowNote,
        author_user_id: params.userId,
        author_name: params.actorIdentity.fullName,
        author_email: params.actorIdentity.email,
        author_role: params.actorIdentity.role,
        author_department: params.actorIdentity.department,
        author_title: params.actorIdentity.title,
        visibility: "internal",
        metadata_json: { source: "workflow-modal", action },
        created_at: now,
        updated_at: now
      }).then(() => null, () => null)
    }

    await recordWorkflowAudit(params.db, {
      mailboxId: params.mailboxId,
      messageId: params.messageId,
      externalId: workflow?.external_id || null,
      threadId: workflow?.thread_id || null,
      action,
      actorUserId: params.userId,
      actorIdentity: params.actorIdentity,
      severity: action === "archive" ? "warning" : "info",
      details: {
        payload: params.payload,
        sourceTable: params.sourceTable,
        status: workflowPatch.status || workflow?.status || null,
        priority: workflowPatch.priority || workflow?.priority || null,
        category: workflowPatch.category || workflow?.category || null
      }
    })
  }

  return { workflowPatch, sourcePatch, extra: null }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const admin = await getUserEmailOSAdminProfile(user.id)
    const url = new URL(request.url)
    const requestedMailboxId = clean(url.searchParams.get("mailboxId") || url.searchParams.get("mailbox_id"))
    const messageId = clean(url.searchParams.get("messageId") || url.searchParams.get("message_id"))
    const adminMode = !requestedMailboxId && admin.isAdmin
    const scope = adminMode ? null : await resolveMailboxScopeForUser(user.id, requestedMailboxId || null)

    if (scope) {
      await requireUnlockedMailboxAccess({
        userId: user.id,
        mailboxId: scope.mailboxId,
        requiredPermission: "can_read",
        request,
      })
    }

    const db = createEmailOSCoreDb()
    const operatorDirectory = await loadEmailOSOperatorDirectory(db, { limit: 1000 })
    const operatorMap = emailOSOperatorDirectoryMap(operatorDirectory)
    const currentOperator = operatorMap.get(user.id) || normalizeEmailOSOperatorIdentity(null, {
      id: user.id,
      name: user.name || undefined,
      email: user.email || undefined,
      role: user.role || undefined
    })

    const mailboxQuery = adminMode
      ? db.from("email_os_core_mailboxes").select("*").order("updated_at", { ascending: false }).limit(250)
      : db.from("email_os_core_mailboxes").select("*").eq("id", scope?.mailboxId || requestedMailboxId).limit(10)

    const [mailboxesRes, workflowRows, slaRules, syncLogs, teamWorkloads, notes, tasks, links, auditRows, inbox, outbox, drafts, savedDrafts] = await Promise.all([
      mailboxQuery,
      loadWorkflowRows(db, scope?.mailboxId || requestedMailboxId || null),
      safeSelect(db, "email_os_core_sla_rules", (query) => query.order("updated_at", { ascending: false }).limit(50)),
      adminMode ? safeSelect(db, "email_os_core_sync_logs", (query) => query.order("created_at", { ascending: false }).limit(100)) : safeSelect(db, "email_os_core_sync_logs", (query) => scope ? query.eq("mailbox_id", scope.mailboxId).order("created_at", { ascending: false }).limit(100) : query.limit(0)),
      adminMode ? safeSelect(db, "email_os_core_team_workloads", (query) => query.order("updated_at", { ascending: false }).limit(100)) : [],
      messageId ? safeSelect(db, "email_os_message_notes", (query) => query.eq("message_id", messageId).order("created_at", { ascending: false }).limit(100)) : safeSelect(db, "email_os_message_notes", (query) => query.order("created_at", { ascending: false }).limit(100)),
      messageId ? safeSelect(db, "email_os_message_tasks", (query) => query.eq("message_id", messageId).order("created_at", { ascending: false }).limit(100)) : safeSelect(db, "email_os_message_tasks", (query) => query.order("created_at", { ascending: false }).limit(100)),
      messageId ? safeSelect(db, "email_os_message_entity_links", (query) => query.eq("message_id", messageId).order("created_at", { ascending: false }).limit(100)) : safeSelect(db, "email_os_message_entity_links", (query) => query.order("created_at", { ascending: false }).limit(100)),
      messageId ? safeSelect(db, "email_os_message_audit_events", (query) => query.eq("message_id", messageId).order("created_at", { ascending: false }).limit(100)) : safeSelect(db, "email_os_message_audit_events", (query) => query.order("created_at", { ascending: false }).limit(100)),
      loadMessages(db, scope?.mailboxId || requestedMailboxId || null).then((value) => value.inbox),
      loadMessages(db, scope?.mailboxId || requestedMailboxId || null).then((value) => value.outbox),
      loadMessages(db, scope?.mailboxId || requestedMailboxId || null).then((value) => value.drafts),
      loadMessages(db, scope?.mailboxId || requestedMailboxId || null).then((value) => value.savedDrafts)
    ])

    const mailboxes = (mailboxesRes.data || []).map((row: any) => row)
    const mailboxMap = await loadMailboxMap(db, mailboxes.map((row: any) => clean(row.id)))
    const workflowByKey = new Map<string, any>()
    for (const workflow of workflowRows || []) {
      workflowByKey.set(`${clean(workflow.mailbox_id)}:${clean(workflow.message_id)}:${clean(workflow.source_table)}`, workflow)
    }

    const rawMessages = [
      ...inbox.map((row: any) => ({ ...row, __source: "inbox" })),
      ...outbox.map((row: any) => ({ ...row, __source: "outbox" })),
      ...drafts.map((row: any) => ({ ...row, __source: "drafts" })),
      ...savedDrafts.map((row: any) => ({ ...row, __source: "saved_drafts" }))
    ]

    const messages = rawMessages.map((row: any) => {
      const mailbox = mailboxMap.get(clean(row.mailbox_id)) || null
      const sourceTable = row.__source === "outbox" ? "email_os_core_outbox" : row.__source === "drafts" ? "email_os_core_drafts" : row.__source === "saved_drafts" ? "email_os_core_saved_drafts" : "email_os_core_inbox"
      const workflow = workflowByKey.get(`${clean(row.mailbox_id)}:${clean(row.id)}:${sourceTable}`) || null
      const merged = mergeWorkflowMessage(row, workflow, mailbox)
      const resolveIdentity = (id: unknown, snapshot: any) => operatorMap.get(clean(id)) || identityFromSnapshot({ id, ...snapshot })
      const owner = resolveIdentity(merged.ownerUserId, { name: merged.ownerName, email: merged.ownerEmail, role: merged.ownerRole, department: merged.ownerDepartment, title: merged.ownerTitle })
      const sentBy = resolveIdentity(merged.sentByUserId, { name: merged.sentByName, email: merged.sentByEmail, role: merged.sentByRole, department: merged.sentByDepartment })
      const handledBy = resolveIdentity(merged.lastHandledByUserId, { name: merged.lastHandledByName, email: merged.lastHandledByEmail, role: merged.lastHandledByRole, department: merged.lastHandledByDepartment })
      return {
        ...merged,
        ownerIdentity: merged.ownerUserId ? owner : null,
        ownerName: merged.ownerUserId ? owner.fullName : "",
        ownerEmail: merged.ownerUserId ? owner.email : "",
        ownerRole: merged.ownerUserId ? owner.role : "",
        ownerDepartment: merged.ownerUserId ? owner.department : "",
        sentByIdentity: merged.sentByUserId ? sentBy : null,
        sentByName: merged.sentByUserId ? sentBy.fullName : merged.sentByName,
        sentByEmail: merged.sentByUserId ? sentBy.email : merged.sentByEmail,
        sentByRole: merged.sentByUserId ? sentBy.role : merged.sentByRole,
        sentByDepartment: merged.sentByUserId ? sentBy.department : merged.sentByDepartment,
        lastHandledByIdentity: merged.lastHandledByUserId ? handledBy : null,
        lastHandledByName: merged.lastHandledByUserId ? handledBy.fullName : merged.lastHandledByName,
        lastHandledByEmail: merged.lastHandledByUserId ? handledBy.email : merged.lastHandledByEmail,
        lastHandledByRole: merged.lastHandledByUserId ? handledBy.role : merged.lastHandledByRole,
        lastHandledByDepartment: merged.lastHandledByUserId ? handledBy.department : merged.lastHandledByDepartment
      }
    })

    const rawDetail = messageId
      ? await loadWorkspaceDetail(db, scope?.mailboxId || requestedMailboxId || null, messageId)
      : null
    const detail = rawDetail ? {
      ...rawDetail,
      notes: (rawDetail.notes || []).map((row: any) => {
        const identity = operatorMap.get(clean(row.author_user_id)) || identityFromSnapshot({ id: row.author_user_id, name: row.author_name, email: row.author_email, role: row.author_role, department: row.author_department, title: row.author_title })
        return { ...row, author_name: identity.fullName, author_identity: identity }
      }),
      tasks: (rawDetail.tasks || []).map((row: any) => {
        const owner = operatorMap.get(clean(row.owner_user_id)) || identityFromSnapshot({ id: row.owner_user_id, name: row.owner_name_snapshot, email: row.owner_email_snapshot, role: row.owner_role_snapshot, department: row.owner_department_snapshot, title: row.owner_title_snapshot })
        const creator = operatorMap.get(clean(row.created_by_user_id)) || identityFromSnapshot({ id: row.created_by_user_id, name: row.created_by_name_snapshot, email: row.created_by_email_snapshot, role: row.created_by_role_snapshot, department: row.created_by_department_snapshot, title: row.created_by_title_snapshot })
        return { ...row, owner_name: row.owner_user_id ? owner.fullName : "", owner_identity: row.owner_user_id ? owner : null, created_by_name: creator.fullName, created_by_identity: creator }
      }),
      audit: (rawDetail.audit || []).map((row: any) => {
        const identity = operatorMap.get(clean(row.actor_user_id)) || identityFromSnapshot({ id: row.actor_user_id, name: row.actor_name_snapshot, email: row.actor_email_snapshot, role: row.actor_role_snapshot, department: row.actor_department_snapshot, title: row.actor_title_snapshot })
        return { ...row, actor_name: identity.fullName, actor_identity: identity }
      })
    } : null

    const visibleMessages = messages.filter((row: any) => !isHardDeletedMergedMessage(row))
    const filteredMessages = scope ? visibleMessages.filter((row: any) => clean(row.mailboxId) === scope.mailboxId) : visibleMessages
    const stats = adminMode && !scope
      ? (mailboxes as any[]).map((mailbox) => {
          const rows = visibleMessages.filter((message) => clean(message.mailboxId) === clean(mailbox.id))
          return {
            mailboxId: clean(mailbox.id),
            mailboxName: getMailboxLabel(mailbox),
            mailboxEmail: getMailboxEmail(mailbox),
            ...computeStats(rows, workflowRows, clean(mailbox.id))
          }
        })
      : computeStats(filteredMessages, workflowRows, scope?.mailboxId || requestedMailboxId || null)

    const workloadMap = new Map((teamWorkloads || []).map((row: any) => [clean(row.user_id || row.owner_user_id || row.id), row]))
    const resolvedTeamWorkloads = operatorDirectory.map((identity) => {
      const assignedRows = filteredMessages.filter((row: any) => clean(row.ownerUserId) === identity.id)
      const existing = workloadMap.get(identity.id) || {}
      return {
        ...existing,
        user_id: identity.id,
        owner_user_id: identity.id,
        full_name: identity.fullName,
        name: identity.fullName,
        email: identity.email,
        role: identity.role,
        department: identity.department,
        title: identity.title,
        initials: identity.initials,
        avatar_url: identity.avatarUrl,
        active_count: assignedRows.filter((row: any) => !["resolved", "archived"].includes(cleanLower(row.status))).length,
        urgent_count: assignedRows.filter((row: any) => ["urgent", "vip", "high"].includes(cleanLower(row.priority))).length,
        overdue_count: assignedRows.filter((row: any) => Boolean(row.sla?.overdue)).length
      }
    })

    const assignedToMe = filteredMessages.filter((row: any) => clean(row.ownerUserId) === clean(user.id)).length
    const lastSync = syncLogs.length ? syncLogs[0] : null
    const source = lastSync?.message?.includes("bridge") ? "windows-bridge-pop3" : "windows-bridge-pop3"

    return NextResponse.json({
      ok: true,
      data: {
        currentUser: currentOperator,
        operatorDirectory,
        mailboxScope: scope ? { mailboxId: scope.mailboxId, mailbox: scope.mailbox, assignment: scope.assignment, session: scope.session } : null,
        mailboxes,
        messages: filteredMessages,
        detail,
        workflowRows,
        notes,
        tasks,
        links,
        audit: auditRows,
        slaRules,
        syncHistory: syncLogs,
        teamWorkloads: resolvedTeamWorkloads,
        stats,
        metrics: {
          assignedToMe,
          source,
          lastSync,
          totalMailboxes: mailboxes.length,
          totalMessages: filteredMessages.length
        },
        diagnostics: {
          adminMode,
          requestedMailboxId: requestedMailboxId || null,
          workflowCount: workflowRows.length,
          noteCount: notes.length,
          taskCount: tasks.length,
          linkCount: links.length,
          auditCount: auditRows.length
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Email workflow load failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const action = parseAction(body.action)
    const messageId = clean(body.messageId || body.message_id || body.id)
    const requestedMailboxId = clean(body.mailboxId || body.mailbox_id || body.payload?.mailboxId || body.payload?.mailbox_id)
    const payload = body.payload || {}

    if (!action || !messageId) {
      return NextResponse.json({ ok: false, error: "messageId and action are required" }, { status: 400 })
    }

    const admin = await getUserEmailOSAdminProfile(user.id)
    const scope = admin.isAdmin && requestedMailboxId
      ? { mailboxId: requestedMailboxId }
      : await resolveMailboxScopeForUser(user.id, requestedMailboxId || null)

    if (!admin.isAdmin) {
      await requireUnlockedMailboxAccess({
        userId: user.id,
        mailboxId: scope.mailboxId,
        requiredPermission: requiredPermission(action),
        request,
      })
    }

    const db = createEmailOSCoreDb()
    const actorIdentity = await resolveEmailOSOperatorIdentity(db, user.id, {
      id: user.id,
      name: user.name || undefined,
      email: user.email || undefined,
      role: user.role || undefined
    })
    const message = await findMessageRow(db, scope.mailboxId, messageId)
    if (!message.row) {
      return NextResponse.json({ ok: false, error: "Message not found" }, { status: 404 })
    }

    const workflow = await ensureWorkflowRow(db, scope.mailboxId, message.table || "email_os_core_inbox", message.row)

    const sourceTable = message.table || workflow.source_table || "email_os_core_inbox"
    const archiveMeansErase = action === "archive" && (sourceTable === "email_os_core_outbox" || sourceTable === "email_os_core_drafts" || sourceTable === "email_os_core_saved_drafts")
    if (action === "delete_permanent" || archiveMeansErase) {
      if (action === "delete_permanent" && payload.confirm !== true && payload.confirmPermanentDelete !== true) {
        return NextResponse.json({ ok: false, error: "Permanent delete requires explicit confirmation" }, { status: 400 })
      }

      const suppression = action === "delete_permanent" && sourceTable === "email_os_core_inbox"
        ? await recordEmailOSInboundSuppressions(db, {
            mailboxId: scope.mailboxId,
            messageId,
            identity: buildEmailOSInboundIdentityFromRow(message.row),
            actorUserId: user.id,
            reason: "permanent_delete"
          })
        : null

      const storage = await eraseEmailMessageCompletely({
        db,
        mailboxId: scope.mailboxId,
        messageId,
        sourceTable,
        sourceRow: message.row,
        actorUserId: user.id
      })

      return NextResponse.json({
        ok: true,
        data: {
          erased: true,
          messageId,
          sourceTable,
          storage,
          suppression,
          action,
          archiveMeansErase
        }
      })
    }

    const result = await applyWorkflowAction({
      db,
      userId: user.id,
      mailboxId: scope.mailboxId,
      messageId,
      action,
      sourceTable: message.table || workflow.source_table || "email_os_core_inbox",
      sourceRow: message.row,
      workflowRow: workflow,
      payload,
      request,
      actorIdentity
    })

    const updatedWorkflow = await db
      .from("email_os_message_workflow")
      .update(result.workflowPatch)
      .eq("mailbox_id", scope.mailboxId)
      .eq("message_id", messageId)
      .eq("source_table", message.table || workflow.source_table || "email_os_core_inbox")
      .select("*")
      .maybeSingle()

    if (result.sourcePatch && message.table) {
      await updateSourceRow(db, message.table, scope.mailboxId, messageId, result.sourcePatch).catch(() => null)
    }

    if (action === "assign_owner") {
      const assignedOwnerId = clean(payload.ownerUserId || payload.owner_user_id || payload.owner || "")
      const assignedOwnerIdentity = assignedOwnerId ? await resolveEmailOSOperatorIdentity(db, assignedOwnerId) : null
      const assignedOwnerSnapshot = emailOSOperatorSnapshot(assignedOwnerIdentity)
      const actorSnapshot = emailOSOperatorSnapshot(actorIdentity)
      await db.from("email_os_message_assignments").insert({
        id: makeEmailOSId(),
        mailbox_id: scope.mailboxId,
        message_id: messageId,
        external_id: clean(workflow.external_id || message.row.provider_uid || message.row.external_id || ""),
        thread_id: clean(workflow.thread_id || message.row.thread_id || ""),
        owner_user_id: assignedOwnerId,
        assignee_name_snapshot: assignedOwnerSnapshot.name,
        assignee_email_snapshot: assignedOwnerSnapshot.email,
        assignee_role_snapshot: assignedOwnerSnapshot.role,
        assignee_department_snapshot: assignedOwnerSnapshot.department,
        assignee_title_snapshot: assignedOwnerSnapshot.title,
        assigned_by: user.id,
        assigned_by_name_snapshot: actorSnapshot.name,
        assigned_by_email_snapshot: actorSnapshot.email,
        assigned_by_role_snapshot: actorSnapshot.role,
        assigned_by_department_snapshot: actorSnapshot.department,
        assigned_by_title_snapshot: actorSnapshot.title,
        assigned_at: nowIso(),
        metadata_json: { source: "workflow-action" },
        created_at: nowIso(),
        updated_at: nowIso()
      }).then(() => null, () => null)
    }

    if (action === "link_entity") {
      await db.from("email_os_message_entity_links").insert({
        id: makeEmailOSId(),
        mailbox_id: scope.mailboxId,
        message_id: messageId,
        external_id: clean(workflow.external_id || message.row.provider_uid || message.row.external_id || ""),
        thread_id: clean(workflow.thread_id || message.row.thread_id || ""),
        entity_type: clean(payload.entityType || payload.entity_type || ""),
        entity_id: clean(payload.entityId || payload.entity_id || ""),
        entity_label: clean(payload.entityLabel || payload.entity_label || ""),
        created_by: user.id,
        metadata_json: { source: "workflow-action", note: clean(payload.note || "") },
        created_at: nowIso(),
        updated_at: nowIso()
      }).then(() => null, () => null)

      const linkNote = clean(payload.note || "")
      if (linkNote) {
        await db.from("email_os_message_notes").insert({
          id: makeEmailOSId(),
          mailbox_id: scope.mailboxId,
          message_id: messageId,
          external_id: clean(workflow.external_id || message.row.provider_uid || message.row.external_id || ""),
          thread_id: clean(workflow.thread_id || message.row.thread_id || ""),
          body: linkNote,
          author_user_id: user.id,
          author_name: actorIdentity.fullName,
          author_email: actorIdentity.email,
          author_role: actorIdentity.role,
          author_department: actorIdentity.department,
          author_title: actorIdentity.title,
          visibility: "internal",
          metadata_json: { source: "crm-link", entityType: clean(payload.entityType || payload.entity_type || ""), entityId: clean(payload.entityId || payload.entity_id || "") },
          created_at: nowIso(),
          updated_at: nowIso()
        }).then(() => null, () => null)
      }
    }

    const detail = await loadWorkspaceDetail(db, scope.mailboxId, messageId)

    return NextResponse.json({
      ok: true,
      data: {
        message: message.row,
        workflow: updatedWorkflow.data || workflow,
        detail,
        action,
        sourceTable: message.table
      }
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Workflow action failed" }, { status: 500 })
  }
}
