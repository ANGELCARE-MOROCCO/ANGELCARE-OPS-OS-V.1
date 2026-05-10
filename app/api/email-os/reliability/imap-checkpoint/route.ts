import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db.from("email_os_core_imap_sync_checkpoints").select("*").order("updated_at", { ascending: false }).limit(250)
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load checkpoints" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.mailboxId) return NextResponse.json({ ok: false, error: "mailboxId is required" }, { status: 400 })

    const db = createEmailOSCoreDb()
    const row = {
      id: body.id || makeEmailOSId(),
      mailbox_id: body.mailboxId,
      provider_uid_validity: body.providerUidValidity || null,
      last_uid: body.lastUid || null,
      last_synced_at: body.lastSyncedAt || nowIso(),
      status: body.status || "active",
      metadata: body.metadata || {},
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_imap_sync_checkpoints").upsert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to save checkpoint" }, { status: 500 })
  }
}
