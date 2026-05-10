import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const steps = body.steps || [
      { step: 1, action: "summarize_context", owner: "ai-copilot" },
      { step: 2, action: "suggest_response", owner: "ai-copilot" },
      { step: 3, action: "request_human_approval", owner: "operations" }
    ]

    const row = {
      id: makeEmailOSId(),
      target_type: body.targetType || "thread",
      target_id: body.targetId || null,
      plan_status: "draft",
      objective: body.objective || "Resolve operational thread safely",
      steps,
      confidence_score: Number(body.confidenceScore || 0.76),
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_ai_workflow_plans").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "AI workflow planning failed" }, { status: 500 })
  }
}
