import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_production_test_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(100)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load test sessions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: makeEmailOSId(),
      session_name: body.sessionName || `Email-OS Production QA ${new Date().toISOString()}`,
      environment: body.environment || process.env.VERCEL_ENV || "local",
      status: "open",
      started_by: body.startedBy || "operations",
      started_at: nowIso(),
      completed_at: null,
      summary: {}
    }

    const { data, error } = await db.from("email_os_core_production_test_sessions").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create test session" }, { status: 500 })
  }
}
