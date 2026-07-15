import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_thread_locks")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load thread locks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.threadId || !body.lockedBy) {
      return NextResponse.json({ ok: false, error: "threadId and lockedBy are required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()

    const { data: activeLocks, error: lockError } = await db
      .from("email_os_core_thread_locks")
      .select("*")
      .eq("thread_id", body.threadId)
      .eq("status", "active")
      .limit(1)

    if (lockError) throw lockError

    if (activeLocks && activeLocks.length > 0) {
      return NextResponse.json({ ok: false, error: "Thread is already locked", data: activeLocks[0] }, { status: 409 })
    }

    const row = {
      id: makeEmailOSId(),
      thread_id: body.threadId,
      locked_by: body.lockedBy,
      lock_reason: body.lockReason || "handling",
      expires_at: body.expiresAt || new Date(Date.now() + 30 * 60_000).toISOString(),
      status: "active",
      created_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_thread_locks").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to lock thread" }, { status: 500 })
  }
}
