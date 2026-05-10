import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const { data: rules, error: rulesError } = await db
      .from("email_os_core_spam_rules")
      .select("*")
      .eq("enabled", true)

    if (rulesError) throw rulesError

    const { data: threads, error: threadsError } = await db
      .from("email_os_core_threads")
      .select("*")
      .limit(500)

    if (threadsError) throw threadsError

    let flagged = 0

    for (const thread of threads || []) {
      const text = `${thread.subject || ""} ${thread.preview || ""}`.toLowerCase()

      const matched = (rules || []).some((rule: any) =>
        text.includes(String(rule.pattern || "").toLowerCase())
      )

      if (matched) {
        flagged += 1

        const { error: updateError } = await db
          .from("email_os_core_threads")
          .update({
            last_action: "spam.flagged",
            updated_at: nowIso()
          })
          .eq("id", thread.id)

        if (updateError) throw updateError
      }
    }

    try {
      await db.from("email_os_core_realtime_events").insert({
        id: makeEmailOSId(),
        event_type: "spam.evaluation.completed",
        entity_type: "system",
        payload: { flagged },
        created_at: nowIso()
      })
    } catch {
      // realtime event write is non-blocking
    }

    return NextResponse.json({
      ok: true,
      data: { flagged }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Spam evaluation failed"
      },
      { status: 500 }
    )
  }
}
