import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_team_workloads")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load workloads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: body.id || makeEmailOSId(),
      agent_key: body.agentKey || "operations-agent",
      team_key: body.teamKey || "operations",
      active_threads: Number(body.activeThreads || 0),
      capacity: Number(body.capacity || 20),
      status: body.status || "available",
      updated_at: nowIso()
    }

    const { data, error } = await db
      .from("email_os_core_team_workloads")
      .upsert(row)
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to update workload" }, { status: 500 })
  }
}
