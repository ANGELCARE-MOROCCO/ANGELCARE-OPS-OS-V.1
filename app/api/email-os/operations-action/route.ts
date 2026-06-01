import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { kind, emailId, payload = {} } = body

    if (!kind) {
      return NextResponse.json({ ok: false, error: "kind is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()

    const { data, error } = await db.from("email_os_core_audit").insert({
      id: makeEmailOSId(),
      action: kind,
      target_type: "email_os_operation",
      target_id: emailId || "manual",
      severity: "info",
      details: payload,
      created_at: nowIso()
    }).select("*").single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Operation action failed" },
      { status: 500 }
    )
  }
}
