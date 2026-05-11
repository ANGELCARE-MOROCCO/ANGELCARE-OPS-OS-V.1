import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const { data: mailboxes } = await db
      .from("email_os_core_mailboxes")
      .select("*")
      .limit(50)

    const diagnostics = {
      mailboxCount: mailboxes?.length || 0,
      smtpConfigured: Boolean(process.env.EMAIL_OS_SMTP_HOST && process.env.EMAIL_OS_SMTP_USER && process.env.EMAIL_OS_SMTP_PASSWORD),
      imapConfigured: Boolean(process.env.EMAIL_OS_IMAP_HOST),
      defaultFrom: process.env.EMAIL_OS_SMTP_FROM || process.env.EMAIL_OS_SMTP_USER || null
    }

    return NextResponse.json({
      ok: true,
      data: diagnostics
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Diagnostics failed"
      },
      { status: 500 }
    )
  }
}
