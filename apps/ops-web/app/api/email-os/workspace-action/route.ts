import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

type MessageAction =
  | "delete"
  | "archive"
  | "restore"
  | "spam"
  | "mark_read"
  | "mark_unread"
  | "star"
  | "unstar"
  | "tag"
  | "label"
  | "move_folder"

type SourceType = "inbox" | "outbox" | "drafts"

function normalizeSource(value: unknown): SourceType {
  const source = String(value || "inbox").toLowerCase()
  if (["outbox", "sent", "queue"].includes(source)) return "outbox"
  if (["draft", "drafts", "saved_drafts", "saved-drafts"].includes(source)) return "drafts"
  return "inbox"
}

function candidateTables(source: SourceType) {
  if (source === "outbox") return ["email_os_core_outbox"]
  if (source === "drafts") return ["email_os_core_drafts", "email_os_core_saved_drafts"]
  return ["email_os_core_inbox"]
}

function restoreStatusForSource(source: SourceType) {
  if (source === "outbox") return "sent"
  if (source === "drafts") return "draft"
  return "received"
}

function isAllowedAction(action: string): action is MessageAction {
  return ["delete", "archive", "restore", "spam", "mark_read", "mark_unread", "star", "unstar", "tag", "label", "move_folder"].includes(action)
}

function actionPatch(action: MessageAction, payload: any = {}, source: SourceType = "inbox") {
  const now = nowIso()
  const patch: Record<string, any> = { updated_at: now }

  if (action === "delete") {
    patch.status = "trash"
    patch.folder = "trash"
    patch.deleted_at = now
    patch.archived_at = null
  }

  if (action === "archive") {
    patch.status = "archived"
    patch.folder = "archive"
    patch.archived_at = now
    patch.deleted_at = null
  }

  if (action === "restore") {
    patch.status = restoreStatusForSource(source)
    patch.folder = null
    patch.deleted_at = null
    patch.archived_at = null
  }

  if (action === "spam") {
    patch.status = "spam"
    patch.folder = "spam"
  }

  if (action === "mark_read") {
    patch.status = "read"
    patch.read_at = now
  }

  if (action === "mark_unread") {
    patch.status = "unread"
    patch.read_at = null
  }

  if (action === "star") {
    patch.starred = true
    patch.starred_at = now
  }

  if (action === "unstar") {
    patch.starred = false
    patch.starred_at = null
  }

  if (action === "tag" || action === "label") {
    patch.tag = payload.tag || payload.label || "follow-up"
    patch.label = payload.label || payload.tag || "follow-up"
  }

  if (action === "move_folder") {
    patch.folder = payload.folder || "follow-up-folder"
    patch.tag = payload.folder || payload.tag || "foldered"
    patch.label = payload.label || payload.folder || payload.tag || "foldered"
  }

  return patch
}

function fallbackPatches(action: MessageAction, patch: Record<string, any>) {
  const minimal: Record<string, any> = {}
  for (const key of ["status", "folder", "starred", "read_at", "tag", "label"] as const) {
    if (key in patch) minimal[key] = patch[key]
  }

  const ultraMinimal: Record<string, any> = {}
  for (const key of ["status", "starred", "read_at"] as const) {
    if (key in patch) ultraMinimal[key] = patch[key]
  }

  if (action === "tag" || action === "label" || action === "move_folder") return [patch, minimal]
  return [patch, minimal, ultraMinimal].filter((item) => Object.keys(item).length > 0)
}

function debug(error: unknown) {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>
    return {
      message: String(e.message || e.error || "Unknown error"),
      code: e.code,
      details: e.details,
      hint: e.hint
    }
  }
  return { message: error instanceof Error ? error.message : "Unknown error" }
}

async function tryUpdate(db: ReturnType<typeof createEmailOSCoreDb>, tables: string[], id: string, action: MessageAction, patch: Record<string, any>) {
  let lastError: unknown = null
  const attempts: any[] = []

  for (const table of tables) {
    for (const candidate of fallbackPatches(action, patch)) {
      const result = await db.from(table).update(candidate).eq("id", id).select("*").maybeSingle()
      attempts.push({ table, keys: Object.keys(candidate), ok: !result.error && Boolean(result.data), error: result.error ? debug(result.error) : null })
      if (!result.error && result.data) {
        return { table, data: { ...result.data, ...candidate }, patch: candidate, attempts }
      }
      lastError = result.error || { message: `No row matched id ${id} in ${table}` }
    }
  }

  return { table: null, data: null, patch: null, attempts, error: lastError }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const messageId = body.messageId || body.targetId || body.id
    const action = String(body.action || "")
    const payload = body.payload || {}
    const source = normalizeSource(body.source || body.targetType || payload.source || payload.targetType)

    if (!messageId || !action) {
      return NextResponse.json({ ok: false, error: "messageId and action are required" }, { status: 400 })
    }

    if (!isAllowedAction(action)) {
      return NextResponse.json({ ok: false, error: `Unsupported Email-OS message action: ${action}` }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const patch = actionPatch(action, payload, source)
    const result = await tryUpdate(db, candidateTables(source), messageId, action, patch)

    if (!result.data || !result.table || !result.patch) {
      const d = debug(result.error)
      return NextResponse.json({ ok: false, error: d.message, debug: d, attempted: result.attempts, intendedPatch: patch, source }, { status: 500 })
    }

    await db.from("email_os_core_audit").insert({
      id: makeEmailOSId(),
      action: `message.${action}`,
      target_type: source,
      target_id: messageId,
      severity: action === "delete" || action === "spam" ? "warning" : "info",
      details: { ...payload, intendedPatch: patch, appliedPatch: result.patch, table: result.table, attempts: result.attempts },
      created_at: nowIso()
    }).then(() => null, () => null)

    return NextResponse.json({
      ok: true,
      data: { ...result.data, ...patch, __emailOsSource: source },
      patch,
      appliedPatch: result.patch,
      source,
      table: result.table
    })
  } catch (error) {
    const d = debug(error)
    return NextResponse.json({ ok: false, error: d.message, debug: d }, { status: 500 })
  }
}
