import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: body.id || makeEmailOSId(),
      channel_key: body.channelKey || "email-os.command",
      last_event_id: body.lastEventId || null,
      subscriber_key: body.subscriberKey || "operations-agent",
      acknowledged_at: nowIso(),
      metadata: body.metadata || {},
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_live_refresh_states").upsert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Realtime ack failed" }, { status: 500 })
  }
}
