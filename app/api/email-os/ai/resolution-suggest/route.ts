import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.threadId) return NextResponse.json({ ok: false, error: "threadId is required" }, { status: 400 })

    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      thread_id: body.threadId,
      resolution_type: body.resolutionType || "reply",
      suggestion: body.suggestion || "Acknowledge the request, confirm ownership, and provide next-step timing.",
      confidence_score: Number(body.confidenceScore || 0.78),
      status: "pending",
      created_at: nowIso()
    }
    const { data, error } = await db.from("email_os_core_ai_resolution_suggestions").insert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "AI resolution suggestion failed" }, { status: 500 })
  }
}
