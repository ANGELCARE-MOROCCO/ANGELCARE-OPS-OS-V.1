import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

function mailboxIdFromEmail(email: string) {
  return `mbx_${String(email || "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`
}

async function insertWithFallback(db: any, table: string, rows: Record<string, any>[]) {
  let lastError: any = null
  for (const row of rows) {
    const { data, error } = await db.from(table).insert(row).select("*").single()
    if (!error && data) return { data, error: null, row }
    lastError = error
  }
  return { data: null, error: lastError, row: null }
}

async function updateWithFallback(db: any, table: string, id: string, rows: Record<string, any>[]) {
  let lastError: any = null
  for (const row of rows) {
    const { data, error } = await db.from(table).update(row).eq("id", id).select("*").maybeSingle()
    if (!error && data) return { data, error: null, row }
    lastError = error
  }
  return { data: null, error: lastError, row: null }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = clean(body.action || "upsert")
    const payload = body.payload || body
    const email = clean(payload.email || payload.email_address || payload.address).toLowerCase()
    const name = clean(payload.name || payload.label || payload.title) || email
    const department = clean(payload.department || payload.owner) || "operations"
    const status = clean(payload.status) || "active"
    const id = clean(payload.id || payload.mailbox_id) || mailboxIdFromEmail(email)

    if (!email && action !== "disable" && action !== "update") {
      return NextResponse.json({ ok: false, error: "Mailbox email is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const now = nowIso()

    if (action === "disable") {
      const result = await updateWithFallback(db, "email_os_core_mailboxes", id, [
        { status: "disabled", updated_at: now },
        { status: "disabled" }
      ])
      await db.from("email_os_core_audit").insert({ id: makeEmailOSId(), action: "mailbox.disable", target_type: "email_os_core_mailboxes", target_id: id, severity: "warning", details: payload, created_at: now }).then(() => null, () => null)
      return NextResponse.json({ ok: true, data: result.data || { id, status: "disabled" }, appliedPatch: result.row })
    }

    const fullRow = {
      id,
      name,
      label: name,
      email,
      email_address: email,
      address: email,
      department,
      owner: department,
      status,
      provider: clean(payload.provider) || "menara_smtp_pop",
      metadata: payload.metadata || {},
      created_at: payload.created_at || now,
      updated_at: now
    }

    const minimalRow = { id, name, email_address: email, department, status, created_at: now, updated_at: now }
    const ultraRow = { id, name, email_address: email, status }

    const exists = await db.from("email_os_core_mailboxes").select("id").eq("id", id).maybeSingle()
    const result = exists.data
      ? await updateWithFallback(db, "email_os_core_mailboxes", id, [fullRow, minimalRow, ultraRow])
      : await insertWithFallback(db, "email_os_core_mailboxes", [fullRow, minimalRow, ultraRow])

    await db.from("email_os_core_audit").insert({ id: makeEmailOSId(), action: exists.data ? "mailbox.update" : "mailbox.create", target_type: "email_os_core_mailboxes", target_id: id, severity: "info", details: { payload, appliedPatch: result.row }, created_at: now }).then(() => null, () => null)

    if (!result.data) {
      return NextResponse.json({ ok: false, error: result.error?.message || "Mailbox save failed", debug: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: result.data, appliedPatch: result.row })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Mailbox operation failed" }, { status: 500 })
  }
}
