import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.threadId) return NextResponse.json({ ok: false, error: "Missing threadId" }, { status: 400 })

    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_threads")
      .update({
        owner: body.owner || "operations",
        status: "assigned",
        last_action: "assigned",
        assigned_at: nowIso(),
        updated_at: nowIso()
      })
      .eq("id", body.threadId)
      .select("*")
      .single()

    if (error) throw error

    await audit("thread.assigned", { targetType: "thread", targetId: body.threadId, owner: body.owner || "operations" })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Assignment failed" }, { status: 500 })
  }
}
