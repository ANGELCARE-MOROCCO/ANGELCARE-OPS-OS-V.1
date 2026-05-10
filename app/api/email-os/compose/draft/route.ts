import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: body.id || makeEmailOSId(),
      mailbox_id: body.mailboxId || null,
      from_email: body.fromEmail || process.env.EMAIL_OS_SMTP_FROM || process.env.EMAIL_OS_SMTP_USER || null,
      to_email: body.toEmail || null,
      cc_email: body.ccEmail || null,
      bcc_email: body.bccEmail || null,
      subject: body.subject || "Untitled draft",
      body: body.body || "",
      status: "draft",
      metadata: body.metadata || {},
      created_at: body.id ? undefined : nowIso(),
      updated_at: nowIso()
    }

    const cleanRow = Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined))

    const { data, error } = await db
      .from("email_os_core_saved_drafts")
      .upsert(cleanRow)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Draft save failed" },
      { status: 500 }
    )
  }
}
