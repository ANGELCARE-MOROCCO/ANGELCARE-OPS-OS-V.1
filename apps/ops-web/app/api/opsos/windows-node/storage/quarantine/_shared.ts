import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type {
  WindowsStorageQuarantineImpact,
  WindowsStorageQuarantineReference,
} from "@/lib/opsos/windows-node-types"

function clean(value: unknown) {
  return String(value ?? "").trim()
}

async function safeRows(query: PromiseLike<{ data: any[] | null; error: any }>) {
  try {
    const { data, error } = await query
    if (error) return []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function analyzeQuarantineImpact(input: {
  sourceId: string
  relativePath: string
  operator: string
  requestIp: string
}) {
  const endpoint = "/admin/storage/quarantine/impact"
  const result = await callWindowsBridgeAdmin<WindowsStorageQuarantineImpact>(endpoint, {
    method: "POST",
    body: JSON.stringify({ sourceId: input.sourceId, path: input.relativePath }),
  }, {
    operator: input.operator,
    requestIp: input.requestIp,
  })
  if (!result.ok) {
    return {
      ok: false as const,
      status: result.status,
      error: buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_quarantine_impact_failed"),
    }
  }

  const impact = { ...result.data }
  const db = createEmailOSCoreDb()
  const references: WindowsStorageQuarantineReference[] = Array.isArray(impact.references) ? [...impact.references] : []
  const warnings: string[] = [...(impact.restoreWarnings || [])]

  let storageRow: any = null
  if (impact.fileId) {
    const { data } = await db.from("angelcare_storage_files").select("*").eq("id", impact.fileId).maybeSingle()
    storageRow = data || null
  } else if (impact.entityId) {
    const { data } = await db.from("angelcare_storage_files").select("*").eq("entity_id", impact.entityId).limit(1).maybeSingle()
    storageRow = data || null
  }

  if (storageRow) {
    impact.fileId = clean(storageRow.id) || impact.fileId
    impact.mailboxId = clean(storageRow.mailbox_id) || impact.mailboxId
    impact.entityType = clean(storageRow.entity_type) || impact.entityType
    impact.entityId = clean(storageRow.entity_id) || impact.entityId
    impact.contentType = clean(storageRow.content_type) || impact.contentType
    impact.referenceState = clean(storageRow.status) === "quarantined" ? "already_quarantined" : impact.referenceState
    references.push({
      type: "storage_file",
      id: clean(storageRow.id),
      label: "Objet de stockage Email OS",
      detail: `${clean(storageRow.original_filename || storageRow.safe_filename)} · ${clean(storageRow.status) || "active"}`,
      mailboxId: clean(storageRow.mailbox_id) || null,
      active: !["deleted", "quarantined"].includes(clean(storageRow.status).toLowerCase()),
    })
  }

  const entityId = clean(storageRow?.entity_id || impact.entityId)
  const mailboxId = clean(storageRow?.mailbox_id || impact.mailboxId)
  if (entityId) {
    const [inboxRows, outboxRows, draftRows] = await Promise.all([
      safeRows(db.from("email_os_core_inbox").select("id,mailbox_id,subject,status,created_at").eq("id", entityId).limit(5)),
      safeRows(db.from("email_os_core_outbox").select("id,mailbox_id,subject,status,created_at,sent_at").eq("id", entityId).limit(5)),
      safeRows(db.from("email_os_core_saved_drafts").select("id,mailbox_id,subject,status,created_at").eq("id", entityId).limit(5)),
    ])
    for (const row of inboxRows) references.push({ type: "inbox_message", id: clean(row.id), label: "Message reçu", detail: `${clean(row.subject) || "Sans objet"} · ${clean(row.status) || "unknown"}`, mailboxId: clean(row.mailbox_id) || mailboxId || null, active: true })
    for (const row of outboxRows) references.push({ type: "outbox_message", id: clean(row.id), label: "Message envoyé", detail: `${clean(row.subject) || "Sans objet"} · ${clean(row.status) || "unknown"}`, mailboxId: clean(row.mailbox_id) || mailboxId || null, active: ["queued", "scheduled", "sending"].includes(clean(row.status).toLowerCase()) })
    for (const row of draftRows) references.push({ type: "draft_message", id: clean(row.id), label: "Brouillon Email OS", detail: `${clean(row.subject) || "Sans objet"} · ${clean(row.status) || "draft"}`, mailboxId: clean(row.mailbox_id) || mailboxId || null, active: true })
  }

  const objectReference = `${impact.sourceId}:${impact.relativePath}`
  let legalHold = false
  try {
    let holdQuery: any = db.from("opsos_storage_legal_holds").select("id,reason,status").eq("status", "active")
    if (impact.fileId) holdQuery = holdQuery.or(`file_id.eq.${impact.fileId},object_reference.eq.${objectReference}`)
    else holdQuery = holdQuery.eq("object_reference", objectReference)
    const { data } = await holdQuery.limit(5)
    legalHold = Array.isArray(data) && data.length > 0
    if (legalHold) {
      impact.blockedReasons = [...impact.blockedReasons, "A legal hold explicitly blocks quarantine for this object."]
      impact.riskReasons = [...impact.riskReasons, "Legal hold active"]
      impact.riskLevel = "blocked"
      impact.allowedModes = []
      impact.recommendedMode = null
      impact.restoreReadiness = "blocked"
    }
  } catch {
    warnings.push("Legal-hold table could not be checked; Phase 3 migration may not be applied yet.")
  }

  const unique = new Map<string, WindowsStorageQuarantineReference>()
  for (const reference of references) unique.set(`${reference.type}:${reference.id}`, reference)
  impact.references = Array.from(unique.values())
  impact.referenceCount = impact.references.length
  impact.activeReferenceCount = impact.references.filter((item) => item.active).length
  impact.legalHold = legalHold
  impact.restoreWarnings = warnings

  const activeQueueReference = impact.references.some((item) => item.type === "outbox_message" && item.active)
  if (activeQueueReference) {
    impact.riskLevel = "blocked"
    impact.blockedReasons = [...impact.blockedReasons, "An active outbound queue or scheduled send references this object."]
    impact.allowedModes = []
    impact.recommendedMode = null
    impact.restoreReadiness = "blocked"
  } else if (impact.activeReferenceCount > 0 && impact.riskLevel !== "blocked") {
    impact.riskLevel = "high"
    impact.allowedModes = ["logical"]
    impact.recommendedMode = "logical"
    impact.primaryStorageRecoveryByMode.physical = 0
    impact.estimatedRecoverableBytes = 0
  } else if (impact.referenceCount > 0 && impact.riskLevel === "low") {
    impact.riskLevel = "controlled"
    impact.recommendedMode = "logical"
  }

  return { ok: true as const, data: impact }
}

export function actorId(user: unknown, operator: string) {
  const row = user && typeof user === "object" ? user as Record<string, unknown> : {}
  return clean(row.id || row.email || row.full_name || row.name) || clean(operator) || "operator"
}
