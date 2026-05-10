import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function classify(thread: any) {
  const subject = String(thread.subject || "").toLowerCase()
  const status = String(thread.status || "")
  const priority = String(thread.priority || "")

  if (status === "escalated" || priority === "critical") {
    return {
      riskLevel: "high",
      reason: "Escalated or critical thread",
      action: "Executive review and immediate owner assignment"
    }
  }

  if (subject.includes("complaint") || subject.includes("refund") || subject.includes("legal")) {
    return {
      riskLevel: "medium",
      reason: "Sensitive keyword detected",
      action: "Route to senior operations reviewer"
    }
  }

  return {
    riskLevel: "low",
    reason: "No major risk signal detected",
    action: "Standard handling"
  }
}

export async function POST() {
  try {
    const db = createEmailOSCoreDb()
    const { data: threads, error } = await db.from("email_os_core_threads").select("*").limit(250)
    if (error) throw error

    const rows = (threads || []).map((thread: any) => {
      const result = classify(thread)
      return {
        id: makeEmailOSId(),
        entity_type: "thread",
        entity_id: thread.id,
        risk_level: result.riskLevel,
        risk_reason: result.reason,
        recommended_action: result.action,
        metadata: { subject: thread.subject, status: thread.status, priority: thread.priority },
        created_at: nowIso()
      }
    })

    if (rows.length) {
      const { error: insertError } = await db.from("email_os_core_risk_classifications").insert(rows)
      if (insertError) throw insertError
    }

    return NextResponse.json({ ok: true, data: { classified: rows.length, rows } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Risk classification failed" }, { status: 500 })
  }
}
