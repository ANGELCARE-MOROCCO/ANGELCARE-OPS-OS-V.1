import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action || "compose_action"
    const payload = body.payload || {}

    const db = createEmailOSCoreDb()

    const { data, error } = await db.from("email_os_core_audit").insert({
      id: makeEmailOSId(),
      action,
      target_type: "email_compose",
      target_id: payload.messageId || payload.mailboxId || "compose",
      severity: "info",
      details: payload,
      created_at: nowIso()
    }).select("*").single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Compose action failed" },
      { status: 500 }
    )
  }
}
