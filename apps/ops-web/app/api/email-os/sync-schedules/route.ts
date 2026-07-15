import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_sync_schedules")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load sync schedules" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.mailboxId) {
      return NextResponse.json({ ok: false, error: "mailboxId is required" }, { status: 400 })
    }

    const minutes = Number(body.frequencyMinutes || 15)
    const now = Date.now()

    const row = {
      id: makeEmailOSId(),
      mailbox_id: body.mailboxId,
      schedule_name: body.scheduleName || "Mailbox sync schedule",
      frequency_minutes: minutes,
      enabled: body.enabled !== false,
      last_run_at: null,
      next_run_at: new Date(now + minutes * 60_000).toISOString(),
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const db = createEmailOSCoreDb()
    const { data, error } = await db.from("email_os_core_sync_schedules").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create sync schedule" }, { status: 500 })
  }
}
