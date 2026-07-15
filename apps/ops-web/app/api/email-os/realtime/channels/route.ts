import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db.from("email_os_core_realtime_channels").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load realtime channels" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      channel_key: body.channelKey || "email-os.workspace",
      channel_type: body.channelType || "workspace",
      enabled: body.enabled !== false,
      created_at: nowIso()
    }
    const { data, error } = await db.from("email_os_core_realtime_channels").upsert(row, { onConflict: "channel_key" }).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create channel" }, { status: 500 })
  }
}
