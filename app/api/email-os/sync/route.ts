import { NextResponse } from "next/server"
import { ImapFlow } from "imapflow"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function getEnvCredentials() {
  return {
    host: process.env.EMAIL_OS_IMAP_HOST || "",
    port: Number(process.env.EMAIL_OS_IMAP_PORT || 993),
    secure: Number(process.env.EMAIL_OS_IMAP_PORT || 993) === 993,
    user: process.env.EMAIL_OS_IMAP_USER || process.env.EMAIL_OS_SMTP_USER || "",
    pass: process.env.EMAIL_OS_IMAP_PASSWORD || process.env.EMAIL_OS_SMTP_PASSWORD || ""
  }
}

function createClient(creds: ReturnType<typeof getEnvCredentials>) {
  return new ImapFlow({
    host: creds.host,
    port: creds.port,
    secure: creds.secure,
    auth: {
      user: creds.user,
      pass: creds.pass
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 45000
  })
}

function addressOf(value: any) {
  return value?.[0]?.address || null
}

async function writeSyncLog(input: {
  mailboxId: string
  syncedCount: number
  status: "completed" | "failed"
  message?: string | null
}) {
  try {
    const db = createEmailOSCoreDb()

    await db.from("email_os_core_sync_logs").insert({
      id: makeEmailOSId(),
      mailbox_id: input.mailboxId,
      provider: "imap",
      synced_count: input.syncedCount,
      status: input.status,
      message: input.message || null,
      created_at: nowIso()
    })
  } catch {
    // sync logging is non-blocking
  }
}

async function createThread(input: {
  mailboxId: string
  fromEmail: string | null
  subject: string
}) {
  try {
    const db = createEmailOSCoreDb()

    await db.from("email_os_core_threads").insert({
      id: makeEmailOSId(),
      mailbox_id: input.mailboxId,
      from_email: input.fromEmail,
      subject: input.subject,
      preview: input.subject,
      status: "open",
      priority: "normal",
      owner: "operations",
      created_at: nowIso(),
      updated_at: nowIso()
    })
  } catch {
    // thread creation is non-blocking
  }
}

export async function POST(request: Request) {
  let client: ImapFlow | null = null
  const body = await request.json().catch(() => ({}))
  const mailboxId = body.mailboxId || "default"

  try {
    const limit = Math.max(1, Math.min(Number(body.limit || 25), 100))
    const creds = getEnvCredentials()

    if (!creds.host || !creds.user || !creds.pass) {
      return NextResponse.json(
        { ok: false, error: "IMAP is not configured" },
        { status: 500 }
      )
    }

    const db = createEmailOSCoreDb()

    client = createClient(creds)
    await client.connect()

    const lock = await client.getMailboxLock("INBOX")
    const synced: any[] = []

    try {
      const status = await client.status("INBOX", { messages: true })
      const total = Number(status.messages || 0)
      const start = Math.max(1, total - limit + 1)

      if (total > 0) {
        for await (const message of client.fetch(`${start}:*`, {
          envelope: true,
          uid: true,
          flags: true,
          internalDate: true
        })) {
          const subject = message.envelope?.subject || "(Sans objet)"
          const fromEmail = addressOf(message.envelope?.from)
          const toEmail = addressOf(message.envelope?.to)
          const providerUid = String(message.uid)

          const inboxRow = {
            id: makeEmailOSId(),
            mailbox_id: mailboxId,
            provider_uid: providerUid,
            subject,
            from_email: fromEmail,
            to_email: toEmail,
            preview: subject,
            status: "received",
            raw: {
              uid: message.uid,
              flags: Array.from(message.flags || []),
              internalDate: message.internalDate
            },
            created_at: nowIso(),
            updated_at: nowIso()
          }

          const { data: insertedInbox, error: inboxError } = await db
            .from("email_os_core_inbox")
            .insert(inboxRow)
            .select("*")
            .single()

          if (!inboxError && insertedInbox) {
            synced.push(insertedInbox)
            await createThread({ mailboxId, fromEmail, subject })
          }
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
    client = null

    await writeSyncLog({
      mailboxId,
      syncedCount: synced.length,
      status: "completed"
    })

    return NextResponse.json({
      ok: true,
      data: { count: synced.length, synced }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "IMAP sync failed"

    try {
      if (client) await client.logout()
    } catch {
      // cleanup is non-blocking
    }

    await writeSyncLog({
      mailboxId,
      syncedCount: 0,
      status: "failed",
      message
    })

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    )
  }
}