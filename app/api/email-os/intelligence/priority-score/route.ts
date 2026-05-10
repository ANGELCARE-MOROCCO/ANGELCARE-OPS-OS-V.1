import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function calculateScore(thread: any) {
  let score = 0
  const drivers: Record<string, number> = {}

  const priority = String(thread.priority || "normal")
  if (priority === "critical") {
    score += 50
    drivers.criticalPriority = 50
  } else if (priority === "high") {
    score += 30
    drivers.highPriority = 30
  }

  const status = String(thread.status || "")
  if (status === "escalated") {
    score += 35
    drivers.escalated = 35
  }

  const created = new Date(thread.created_at || Date.now()).getTime()
  const ageMinutes = Math.floor((Date.now() - created) / 60000)
  if (ageMinutes > 240) {
    score += 25
    drivers.agedOverSla = 25
  }

  if (String(thread.subject || "").toLowerCase().includes("urgent")) {
    score += 15
    drivers.urgentKeyword = 15
  }

  const level = score >= 75 ? "critical" : score >= 45 ? "high" : score >= 20 ? "medium" : "normal"
  return { score, priority: level, drivers }
}

export async function POST() {
  try {
    const db = createEmailOSCoreDb()
    const { data: threads, error } = await db.from("email_os_core_threads").select("*").limit(250)
    if (error) throw error

    const rows = (threads || []).map((thread: any) => {
      const scored = calculateScore(thread)
      return {
        id: makeEmailOSId(),
        thread_id: thread.id,
        score: scored.score,
        priority: scored.priority,
        drivers: scored.drivers,
        created_at: nowIso()
      }
    })

    if (rows.length) {
      const { error: insertError } = await db.from("email_os_core_thread_priority_scores").insert(rows)
      if (insertError) throw insertError
    }

    return NextResponse.json({ ok: true, data: { scored: rows.length, rows } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Priority scoring failed" }, { status: 500 })
  }
}
