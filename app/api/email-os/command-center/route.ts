import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

async function count(db: ReturnType<typeof createEmailOSCoreDb>, table: string, filter?: { column: string; value: string }) {
  let query = db.from(table).select("*", { count: "exact", head: true })
  if (filter) query = query.eq(filter.column, filter.value)
  const { count: total, error } = await query
  if (error) throw error
  return total || 0
}

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const data = {
      mailboxes: await count(db, "email_os_core_mailboxes"),
      openThreads: await count(db, "email_os_core_threads", { column: "status", value: "open" }),
      escalatedThreads: await count(db, "email_os_core_threads", { column: "status", value: "escalated" }),
      pendingApprovals: await count(db, "email_os_core_approvals", { column: "status", value: "pending" }),
      queuedMessages: await count(db, "email_os_core_queue", { column: "status", value: "queued" }),
      failedMessages: await count(db, "email_os_core_queue", { column: "status", value: "failed" })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Command center failed" }, { status: 500 })
  }
}
