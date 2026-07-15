import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_intervention_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load interventions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: makeEmailOSId(),
      intervention_type: body.interventionType || "manual_review",
      target_type: body.targetType || "thread",
      target_id: body.targetId || null,
      actor: body.actor || "executive-office",
      outcome: body.outcome || "logged",
      notes: body.notes || null,
      metadata: body.metadata || {},
      created_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_intervention_logs").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create intervention" }, { status: 500 })
  }
}
