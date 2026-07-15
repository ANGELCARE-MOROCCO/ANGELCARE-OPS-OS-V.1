import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId } from "@/lib/email-os-core/schema"

function analyze(subject: string) {
  const text = String(subject || "").toLowerCase()

  if (text.includes("refund") || text.includes("complaint")) {
    return {
      category: "customer-risk",
      priority: "high",
      sentiment: "negative",
      summary: "Potential customer escalation detected.",
      suggestion: "Acknowledge issue and escalate to support lead.",
      confidence: 0.91
    }
  }

  if (text.includes("urgent")) {
    return {
      category: "urgent-request",
      priority: "critical",
      sentiment: "neutral",
      summary: "Urgent operational request detected.",
      suggestion: "Assign immediately to active operations queue.",
      confidence: 0.88
    }
  }

  return {
    category: "general",
    priority: "normal",
    sentiment: "neutral",
    summary: "General operational communication.",
    suggestion: "Standard workflow handling.",
    confidence: 0.72
  }
}

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const { data: threads } = await db
      .from("email_os_core_threads")
      .select("*")
      .limit(100)

    const rows = (threads || []).map((thread:any) => {
      const ai = analyze(thread.subject || "")
      return {
        id: makeEmailOSId(),
        thread_id: thread.id,
        ai_category: ai.category,
        ai_priority: ai.priority,
        ai_sentiment: ai.sentiment,
        ai_summary: ai.summary,
        ai_reply_suggestion: ai.suggestion,
        confidence_score: ai.confidence
      }
    })

    if (rows.length) {
      await db.from("email_os_core_ai_triage").insert(rows)
    }

    return NextResponse.json({ ok: true, data: { analyzed: rows.length } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: "AI triage failed" }, { status: 500 })
  }
}
