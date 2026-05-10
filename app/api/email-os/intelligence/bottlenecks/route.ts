import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const [{ count: openThreads }, { count: queuedJobs }, { count: failedJobs }, { count: activeLocks }] = await Promise.all([
      db.from("email_os_core_threads").select("*", { count: "exact", head: true }).in("status", ["open", "assigned", "escalated"]),
      db.from("email_os_core_queue").select("*", { count: "exact", head: true }).eq("status", "queued"),
      db.from("email_os_core_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
      db.from("email_os_core_thread_locks").select("*", { count: "exact", head: true }).eq("status", "active")
    ])

    const snapshots = [
      {
        id: makeEmailOSId(),
        bottleneck_type: "open_threads",
        severity: Number(openThreads || 0) > 50 ? "high" : "info",
        title: "Open thread pressure",
        count_value: Number(openThreads || 0),
        metadata: {},
        created_at: nowIso()
      },
      {
        id: makeEmailOSId(),
        bottleneck_type: "queued_jobs",
        severity: Number(queuedJobs || 0) > 25 ? "medium" : "info",
        title: "Queued outbound jobs",
        count_value: Number(queuedJobs || 0),
        metadata: {},
        created_at: nowIso()
      },
      {
        id: makeEmailOSId(),
        bottleneck_type: "failed_jobs",
        severity: Number(failedJobs || 0) > 0 ? "high" : "info",
        title: "Failed outbound jobs",
        count_value: Number(failedJobs || 0),
        metadata: {},
        created_at: nowIso()
      },
      {
        id: makeEmailOSId(),
        bottleneck_type: "active_locks",
        severity: Number(activeLocks || 0) > 10 ? "medium" : "info",
        title: "Active handling locks",
        count_value: Number(activeLocks || 0),
        metadata: {},
        created_at: nowIso()
      }
    ]

    const { error } = await db.from("email_os_core_bottleneck_snapshots").insert(snapshots)
    if (error) throw error

    return NextResponse.json({ ok: true, data: snapshots })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Bottleneck detection failed" }, { status: 500 })
  }
}
