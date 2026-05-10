import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const row = {
      id: body.id || makeEmailOSId(),
      channel_key: body.channelKey || "email-os.workspace",
      subscriber_key: body.subscriberKey || "operations-agent",
      status: "active",
      last_seen_at: nowIso()
    }
    const { data, error } = await db.from("email_os_core_realtime_subscriptions").upsert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Realtime subscribe failed" }, { status: 500 })
  }
}
