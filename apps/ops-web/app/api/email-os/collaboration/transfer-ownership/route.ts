import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const threadId = body.threadId
    const owner = body.owner || body.toOwner

    if (!threadId || !owner) {
      return NextResponse.json({ ok: false, error: "threadId and owner are required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_threads")
      .update({
        owner,
        status: "assigned",
        last_action: "ownership.transferred",
        assigned_at: nowIso(),
        updated_at: nowIso()
      })
      .eq("id", threadId)
      .select("*")
      .single()

    if (error) throw error

    await audit("thread.ownership_transferred", {
      targetType: "thread",
      targetId: threadId,
      owner
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Ownership transfer failed" }, { status: 500 })
  }
}
