import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const decision = body.decision

    if (!["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ ok: false, error: "Decision must be approved or rejected" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_approvals")
      .update({
        status: decision,
        decided_by: body.decidedBy || "operations",
        decision_reason: body.reason || null,
        decided_at: nowIso()
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    await audit(`approval.${decision}`, { targetType: "approval", targetId: id })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Approval decision failed" }, { status: 500 })
  }
}
