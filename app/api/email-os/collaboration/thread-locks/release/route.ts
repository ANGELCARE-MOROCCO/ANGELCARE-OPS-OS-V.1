import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const threadId = body.threadId
    const lockedBy = body.lockedBy

    if (!threadId) {
      return NextResponse.json({ ok: false, error: "threadId is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    let query = db.from("email_os_core_thread_locks").update({ status: "released" }).eq("thread_id", threadId).eq("status", "active")

    if (lockedBy) query = query.eq("locked_by", lockedBy)

    const { data, error } = await query.select("*")
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to release lock" }, { status: 500 })
  }
}
