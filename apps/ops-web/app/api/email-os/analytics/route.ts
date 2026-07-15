import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

async function count(db: ReturnType<typeof createEmailOSCoreDb>, table: string, column?: string, value?: string) {
  let query = db.from(table).select("*", { count: "exact", head: true })
  if (column && value) query = query.eq(column, value)
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const analytics = {
      mailboxes: await count(db, "email_os_core_mailboxes"),
      threadsOpen: await count(db, "email_os_core_threads", "status", "open"),
      threadsResolved: await count(db, "email_os_core_threads", "status", "resolved"),
      threadsEscalated: await count(db, "email_os_core_threads", "status", "escalated"),
      queuedMessages: await count(db, "email_os_core_queue", "status", "queued"),
      failedMessages: await count(db, "email_os_core_queue", "status", "failed"),
      approvalsPending: await count(db, "email_os_core_approvals", "status", "pending")
    }

    return NextResponse.json({ ok: true, data: analytics })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Analytics failed"
    }, { status: 500 })
  }
}
