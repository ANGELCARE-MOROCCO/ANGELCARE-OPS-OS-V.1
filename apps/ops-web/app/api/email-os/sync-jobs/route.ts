import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_sync_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load sync jobs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.mailboxId) {
      return NextResponse.json({ ok: false, error: "mailboxId is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      mailbox_id: body.mailboxId,
      schedule_id: body.scheduleId || null,
      status: "queued",
      requested_by: body.requestedBy || "operations",
      started_at: null,
      completed_at: null,
      error: null,
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_sync_jobs").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create sync job" }, { status: 500 })
  }
}
