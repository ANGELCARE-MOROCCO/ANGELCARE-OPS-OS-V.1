import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_deployment_incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load incidents" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: makeEmailOSId(),
      incident_type: body.incidentType || "deployment",
      severity: body.severity || "medium",
      title: body.title || "Deployment incident",
      status: body.status || "open",
      root_cause: body.rootCause || null,
      resolution: body.resolution || null,
      metadata: body.metadata || {},
      created_at: nowIso(),
      resolved_at: null
    }

    const { data, error } = await db.from("email_os_core_deployment_incidents").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create incident" }, { status: 500 })
  }
}
