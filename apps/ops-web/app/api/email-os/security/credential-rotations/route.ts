import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_credential_rotations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load rotations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (!body.mailboxCredentialId) {
      return NextResponse.json({ ok: false, error: "mailboxCredentialId is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      mailbox_credential_id: body.mailboxCredentialId,
      rotation_status: body.rotationStatus || "scheduled",
      reason: body.reason || "manual rotation",
      rotated_by: body.rotatedBy || "operations",
      scheduled_at: body.scheduledAt || nowIso(),
      completed_at: null,
      created_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_credential_rotations").insert(row).select("*").single()
    if (error) throw error

    await audit("credential.rotation_scheduled", {
      targetType: "mailbox_credential",
      targetId: body.mailboxCredentialId,
      rotationId: row.id
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create rotation" }, { status: 500 })
  }
}
