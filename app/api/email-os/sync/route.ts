import { NextResponse } from "next/server"
import { ImapFlow } from "imapflow"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

function createClient() {
  return new ImapFlow({
    host: process.env.EMAIL_OS_IMAP_HOST || "",
    port: Number(process.env.EMAIL_OS_IMAP_PORT || 993),
    secure: Number(process.env.EMAIL_OS_IMAP_PORT || 993) === 993,
    auth: {
      user: process.env.EMAIL_OS_IMAP_USER || process.env.EMAIL_OS_SMTP_USER || "",
      pass: process.env.EMAIL_OS_IMAP_PASSWORD || process.env.EMAIL_OS_SMTP_PASSWORD || ""
    }
  })
}

export async function POST(request: Request) {
  let client: ImapFlow | null = null

  try {
    const body = await request.json().catch(() => ({}))
    const mailboxId = body.mailboxId || null
    const limit = Number(body.limit || 25)

    const imapReady = Boolean(
      process.env.EMAIL_OS_IMAP_HOST &&
      (process.env.EMAIL_OS_IMAP_USER || process.env.EMAIL_OS_SMTP_USER) &&
      (process.env.EMAIL_OS_IMAP_PASSWORD || process.env.EMAIL_OS_SMTP_PASSWORD)
    )

    if (!imapReady) {
      return NextResponse.json(
        {
          ok: false,
          error: "IMAP is not configured"
        },
        { status: 500 }
      )
    }

    const db = createEmailOSCoreDb()
    client = createClient()

    await client.connect()

    const lock = await client.getMailboxLock("INBOX")

    const synced: Array<Record<string, unknown>> = []

    try {
      const status = await client.status("INBOX", { messages: true })
      const total = Number(status.messages || 0)
      const start = Math.max(1, total - limit + 1)

      for await (const message of client.fetch(`${start}:*`, {
        envelope: true,
        uid: true,
        flags: true,
        internalDate: true
      })) {
        const subject = message.envelope?.subject || "Untitled email"
        const from = message.envelope?.from?.[0]?.address || null
        const to = message.envelope?.to?.[0]?.address || null

        const row = {
          id: makeEmailOSId(),
          mailbox_id: mailboxId,
          provider_uid: String(message.uid),
          subject,
          from_email: from,
          to_email: to,
          status: "received",
          preview: subject,
          raw: {
            uid: message.uid,
            flags: Array.from(message.flags || []),
            internalDate: message.internalDate
          },
          created_at: nowIso(),
          updated_at: nowIso()
        }

        const { data, error } = await db
          .from("email_os_core_threads")
          .insert(row)
          .select("*")
          .single()

        if (!error && data) {
          synced.push(data)
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
    client = null

    try {
      await audit("imap.synced", {
        targetType: "mailbox",
        targetId: mailboxId || "default",
        count: synced.length
      })
    } catch {
      // audit is non-blocking
    }

    return NextResponse.json({
      ok: true,
      data: {
        count: synced.length,
        synced
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "IMAP sync failed"

    try {
      if (client) {
        await client.logout()
      }
    } catch {
      // logout cleanup is non-blocking
    }

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 500 }
    )
  }
}
