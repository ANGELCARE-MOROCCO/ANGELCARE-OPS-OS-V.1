import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      action_type: body.actionType || "suggest_reply",
      target_type: body.targetType || "thread",
      target_id: body.targetId || null,
      proposed_by: "ai-copilot",
      approval_status: "pending",
      payload: body.payload || {},
      created_at: nowIso(),
      executed_at: null
    }
    const { data, error } = await db.from("email_os_core_ai_copilot_actions").insert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "AI copilot action failed" }, { status: 500 })
  }
}
