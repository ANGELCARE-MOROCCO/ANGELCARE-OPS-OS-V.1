import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_approvals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load approvals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: body.id || makeEmailOSId(),
      target_type: body.targetType || "thread",
      target_id: body.targetId || "",
      title: body.title || "Approval request",
      status: "pending",
      requested_by: body.requestedBy || "operations",
      created_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_approvals").insert(row).select("*").single()
    if (error) throw error

    await audit("approval.created", { targetType: row.target_type, targetId: row.target_id, approvalId: row.id })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create approval" }, { status: 500 })
  }
}
