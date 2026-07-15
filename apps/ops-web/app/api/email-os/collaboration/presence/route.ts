import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_presence")
      .select("*")
      .order("last_seen_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load presence" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const agentKey = body.agentKey || "operations-agent"
    const db = createEmailOSCoreDb()

    const row = {
      id: body.id || makeEmailOSId(),
      agent_key: agentKey,
      team_key: body.teamKey || "operations",
      status: body.status || "online",
      current_thread_id: body.currentThreadId || null,
      last_seen_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_presence").upsert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to update presence" }, { status: 500 })
  }
}
