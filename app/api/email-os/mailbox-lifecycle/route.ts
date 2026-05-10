import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const mailboxId = body.mailboxId
    const status = body.status

    if (!mailboxId || !status) {
      return NextResponse.json({ ok: false, error: "mailboxId and status are required" }, { status: 400 })
    }

    const allowed = ["active", "paused", "disabled", "archived"]
    if (!allowed.includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid mailbox status" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_mailboxes")
      .update({ status, updated_at: nowIso() })
      .eq("id", mailboxId)
      .select("*")
      .single()

    if (error) throw error

    await audit("mailbox.lifecycle_changed", {
      targetType: "mailbox",
      targetId: mailboxId,
      status
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Mailbox lifecycle update failed" }, { status: 500 })
  }
}
