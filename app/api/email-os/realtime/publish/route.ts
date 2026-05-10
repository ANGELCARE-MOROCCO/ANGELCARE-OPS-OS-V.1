import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: makeEmailOSId(),
      event_type: body.eventType || "workspace.event",
      entity_type: body.entityType || null,
      entity_id: body.entityId || null,
      payload: body.payload || {},
      created_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_realtime_events").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Realtime publish failed" }, { status: 500 })
  }
}
