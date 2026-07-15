import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_credential_rotations")
      .update({
        rotation_status: "completed",
        completed_at: nowIso()
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    await audit("credential.rotation_completed", {
      targetType: "credential_rotation",
      targetId: id
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to complete rotation" }, { status: 500 })
  }
}
