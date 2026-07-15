import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const mailboxId = url.searchParams.get("mailboxId")
    const db = createEmailOSCoreDb()

    let query = db.from("email_os_core_mailbox_permissions").select("*").order("updated_at", { ascending: false })
    if (mailboxId) query = query.eq("mailbox_id", mailboxId)

    const { data, error } = await query.limit(250)
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load permissions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.mailboxId || !body.principalId) {
      return NextResponse.json({ ok: false, error: "mailboxId and principalId are required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const row = {
      id: body.id || makeEmailOSId(),
      mailbox_id: body.mailboxId,
      principal_type: body.principalType || "role",
      principal_id: body.principalId,
      can_read: body.canRead !== false,
      can_compose: Boolean(body.canCompose),
      can_send: Boolean(body.canSend),
      can_manage: Boolean(body.canManage),
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_mailbox_permissions").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create permission" }, { status: 500 })
  }
}
