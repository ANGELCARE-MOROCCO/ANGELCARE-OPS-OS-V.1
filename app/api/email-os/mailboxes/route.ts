import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"

async function safeSelect(db: any, table: string) {
  try {
    const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false })
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

function normalizeEmail(value: any) {
  return String(value || "").trim().toLowerCase()
}

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const dbRows = await safeSelect(db, "email_os_core_mailboxes")
    const envRows = listEmailOSMultiMailboxes()

    const byEmail = new Map<string, any>()

    for (const row of dbRows || []) {
      const email =
        row?.email_address ||
        row?.address ||
        row?.email ||
        row?.from_email ||
        row?.username ||
        ""

      if (!email) continue

      byEmail.set(normalizeEmail(email), {
        id: row?.id,
        mailbox_id: row?.id,
        key: row?.key || "",
        name: row?.name || row?.label || email,
        label: row?.name || row?.label || email,
        email,
        email_address: email,
        status: row?.status || "active",
        department: row?.department || "operations",
        source: "database",
        raw: row
      })
    }

    for (const mailbox of envRows) {
      const email = normalizeEmail(mailbox.email)
      const existing = byEmail.get(email)

      byEmail.set(email, {
        ...(existing || {}),
        id: mailbox.mailboxId,
        mailbox_id: mailbox.mailboxId,
        key: mailbox.key,
        name: existing?.name || `${mailbox.label} Inbox`,
        label: existing?.label || `${mailbox.label} Inbox`,
        email: mailbox.email,
        email_address: mailbox.email,
        status: "active",
        department: mailbox.key.toLowerCase(),
        source: existing ? "env+database" : "env",
        smtp: {
          host: mailbox.smtp.host,
          port: mailbox.smtp.port,
          secure: mailbox.smtp.secure,
          user: mailbox.smtp.user,
          configured: Boolean(mailbox.smtp.pass)
        },
        incoming: {
          protocol: mailbox.incoming.protocol,
          host: mailbox.incoming.host,
          port: mailbox.incoming.port,
          secure: mailbox.incoming.secure,
          user: mailbox.incoming.user,
          configured: Boolean(mailbox.incoming.pass)
        }
      })
    }

    const mailboxes = Array.from(byEmail.values())

    return NextResponse.json({
      ok: true,
      data: mailboxes,
      diagnostics: {
        envMailboxCount: envRows.length,
        dbMailboxCount: dbRows.length,
        finalMailboxCount: mailboxes.length
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Mailboxes failed"
      },
      { status: 500 }
    )
  }
}
