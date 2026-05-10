import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

async function count(db: ReturnType<typeof createEmailOSCoreDb>, table: string, column?: string, value?: string) {
  let query = db.from(table).select("*", { count: "exact", head: true })
  if (column && value) query = query.eq(column, value)
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const queued = await count(db, "email_os_core_queue", "status", "queued")
    const failed = await count(db, "email_os_core_queue", "status", "failed")
    const checkpoints = await count(db, "email_os_core_imap_sync_checkpoints")
    const attachmentJobs = await count(db, "email_os_core_attachment_pipeline_jobs")

    const row = {
      id: makeEmailOSId(),
      run_type: "final_reliability_scan",
      status: "completed",
      processed_count: queued + failed + checkpoints + attachmentJobs,
      failed_count: failed,
      metadata: {
        queued,
        failed,
        checkpoints,
        attachmentJobs
      },
      created_at: nowIso(),
      completed_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_reliability_runs").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Reliability run failed" }, { status: 500 })
  }
}
