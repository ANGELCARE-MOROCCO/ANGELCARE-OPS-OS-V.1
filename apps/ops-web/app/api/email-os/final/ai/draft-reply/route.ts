import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { buildSafeAISuggestion } from "@/lib/email-os-core/final-ai"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const suggestion = buildSafeAISuggestion({
      subject: body.subject,
      body: body.body,
      riskLevel: body.riskLevel
    })

    const guard = {
      id: makeEmailOSId(),
      action_type: "ai_draft_reply",
      target_type: body.targetType || "thread",
      target_id: body.targetId || null,
      guard_status: suggestion.requiresApproval ? "pending_review" : "approved_low_risk",
      risk_level: body.riskLevel || "normal",
      reason: suggestion.guardReason,
      metadata: suggestion,
      created_at: nowIso()
    }

    await db.from("email_os_core_ai_execution_guards").insert(guard)

    return NextResponse.json({
      ok: true,
      data: {
        suggestion,
        guard
      }
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "AI draft reply failed" }, { status: 500 })
  }
}
