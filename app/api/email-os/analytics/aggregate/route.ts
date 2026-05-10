import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const [{ count: threadCount }, { count: draftCount }, { count: mailboxCount }] = await Promise.all([
      db.from("email_os_core_threads").select("*", { count: "exact", head: true }),
      db.from("email_os_core_drafts").select("*", { count: "exact", head: true }),
      db.from("email_os_core_mailboxes").select("*", { count: "exact", head: true })
    ])

    const metrics = [
      { key: "threads_total", value: threadCount || 0 },
      { key: "drafts_total", value: draftCount || 0 },
      { key: "mailboxes_total", value: mailboxCount || 0 }
    ]

    for (const metric of metrics) {
      await db.from("email_os_core_analytics_metrics").insert({
        id: makeEmailOSId(),
        metric_key: metric.key,
        metric_value: metric.value,
        metric_date: new Date().toISOString().slice(0, 10),
        metadata: {},
        created_at: nowIso()
      })
    }

    return NextResponse.json({
      ok: true,
      data: metrics
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Aggregation failed"
    }, { status: 500 })
  }
}
