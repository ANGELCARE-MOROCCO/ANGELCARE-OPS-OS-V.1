import { NextResponse } from "next/server"
import net from "node:net"
import tls from "node:tls"
import { ImapFlow } from "imapflow"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

type PopCredentials = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

function getIncomingProtocol() {
  return String(process.env.EMAIL_OS_INCOMING_PROTOCOL || "imap").toLowerCase()
}

function getImapCredentials() {
  return {
    host: process.env.EMAIL_OS_IMAP_HOST || "",
    port: Number(process.env.EMAIL_OS_IMAP_PORT || 993),
    secure: String(process.env.EMAIL_OS_IMAP_SECURE || "true") === "true",
    user: process.env.EMAIL_OS_IMAP_USER || process.env.EMAIL_OS_SMTP_USER || "",
    pass: process.env.EMAIL_OS_IMAP_PASSWORD || process.env.EMAIL_OS_SMTP_PASSWORD || ""
  }
}

function getPopCredentials(): PopCredentials {
  return {
    host: process.env.EMAIL_OS_POP_HOST || "",
    port: Number(process.env.EMAIL_OS_POP_PORT || 110),
    secure: String(process.env.EMAIL_OS_POP_SECURE || "false") === "true",
    user: process.env.EMAIL_OS_POP_USER || process.env.EMAIL_OS_SMTP_USER || "",
    pass: process.env.EMAIL_OS_POP_PASSWORD || process.env.EMAIL_OS_SMTP_PASSWORD || ""
  }
}

function createImapClient(creds: ReturnType<typeof getImapCredentials>) {
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

function parseHeader(raw: string, name: string) {
  const lines = raw.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)
  const prefix = `${name.toLowerCase()}:`

  const line = lines.find((item) => item.toLowerCase().startsWith(prefix))

  return line ? line.slice(prefix.length).trim() : null
}

function parseEmailAddress(raw: string | null) {
  if (!raw) return null

  const match = raw.match(/<([^>]+)>/)

  return (match?.[1] || raw).replace(/"/g, "").trim()
}

function stripHeaders(raw: string) {
  const index = raw.search(/\r?\n\r?\n/)

  if (index < 0) return ""

  return raw.slice(index).trim().slice(0, 1000)
}

async function writeSyncLog(input: {
  mailboxId: string
  syncedCount: number
  status: "completed" | "failed"
  protocol: "imap" | "pop3"
  message?: string | null
}) {
  try {
    const db = createEmailOSCoreDb()

    await db.from("email_os_core_sync_logs").insert({
      id: makeEmailOSId(),
      mailbox_id: input.mailboxId,
      provider: input.protocol,
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

class Pop3Client {
  private socket: net.Socket | tls.TLSSocket
  private buffer = ""

  constructor(private creds: PopCredentials) {
    this.socket = creds.secure
      ? tls.connect({
          host: creds.host,
          port: creds.port,
          servername: creds.host
        })
      : net.connect({
          host: creds.host,
          port: creds.port
        })

    this.socket.setTimeout(45000)

    this.socket.on("data", (chunk) => {
      this.buffer += chunk.toString("utf8")
    })
  }

  private waitForLine(): Promise<string> {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now()

      const check = () => {
        const index = this.buffer.indexOf("\\r\\n")

        if (index >= 0) {
          const line = this.buffer.slice(0, index)
          this.buffer = this.buffer.slice(index + 2)
          resolve(line)
          return
        }

        if (Date.now() - startedAt > 45000) {
          reject(new Error("POP3 timeout waiting for response"))
          return
        }

        setTimeout(check, 25)
      }

      check()
    })
  }

  private waitForMultiline(): Promise<string> {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now()

      const check = () => {
        const end = this.buffer.indexOf("\\r\\n.\\r\\n")

        if (end >= 0) {
          const payload = this.buffer.slice(0, end)
          this.buffer = this.buffer.slice(end + 5)
          resolve(payload)
          return
        }

        if (Date.now() - startedAt > 45000) {
          reject(new Error("POP3 timeout waiting for multiline response"))
          return
        }

        setTimeout(check, 25)
      }

      check()
    })
  }

  private async command(command: string) {
    this.socket.write(`${command}\\r\\n`)
    const line = await this.waitForLine()

    if (!line.startsWith("+OK")) {
      throw new Error(`POP3 command failed: ${line}`)
    }

    return line
  }

  async connect() {
    const greeting = await this.waitForLine()

    if (!greeting.startsWith("+OK")) {
      throw new Error(`POP3 greeting failed: ${greeting}`)
    }

    await this.command(`USER ${this.creds.user}`)
    await this.command(`PASS ${this.creds.pass}`)
  }

  async list() {
    await this.command("LIST")
    const payload = await this.waitForMultiline()

    return payload
      .split("\\r\\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [id, size] = line.split(/\\s+/)

        return {
          id: Number(id),
          size: Number(size || 0)
        }
      })
      .filter((item) => Number.isFinite(item.id))
  }

  async retr(id: number) {
    await this.command(`RETR ${id}`)
    return this.waitForMultiline()
  }

  async quit() {
    try {
      await this.command("QUIT")
    } catch {
      // ignore
    }

    this.socket.end()
  }
}

async function syncPop3(input: { mailboxId: string; limit: number }) {
  const creds = getPopCredentials()

  if (!creds.host || !creds.user || !creds.pass) {
    throw new Error("POP3 is not configured")
  }

  const db = createEmailOSCoreDb()
  const client = new Pop3Client(creds)
  const synced: any[] = []

  await client.connect()

  try {
    const messages = await client.list()
    const latest = messages.slice(-input.limit)

    for (const item of latest) {
      const raw = await client.retr(item.id)
      const subject = parseHeader(raw, "Subject") || "(Sans objet)"
      const fromEmail = parseEmailAddress(parseHeader(raw, "From"))
      const toEmail = parseEmailAddress(parseHeader(raw, "To"))
      const messageId = parseHeader(raw, "Message-ID")
      const providerUid = messageId || `pop3-${item.id}-${item.size}`

      const inboxRow = {
        id: makeEmailOSId(),
        mailbox_id: input.mailboxId,
        provider_uid: providerUid,
        subject,
        from_email: fromEmail,
        to_email: toEmail,
        preview: stripHeaders(raw) || subject,
        status: "received",
        raw: {
          protocol: "pop3",
          messageNumber: item.id,
          size: item.size,
          messageId
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
        await createThread({ mailboxId: input.mailboxId, fromEmail, subject })
      }
    }
  } finally {
    await client.quit()
  }

  return synced
}

async function syncImap(input: { mailboxId: string; limit: number }) {
  const creds = getImapCredentials()

  if (!creds.host || !creds.user || !creds.pass) {
    throw new Error("IMAP is not configured")
  }

  const db = createEmailOSCoreDb()
  const client = createImapClient(creds)
  const synced: any[] = []

  await client.connect()

  try {
    const lock = await client.getMailboxLock("INBOX")

    try {
      const status = await client.status("INBOX", { messages: true })
      const total = Number(status.messages || 0)
      const start = Math.max(1, total - input.limit + 1)

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
            mailbox_id: input.mailboxId,
            provider_uid: providerUid,
            subject,
            from_email: fromEmail,
            to_email: toEmail,
            preview: subject,
            status: "received",
            raw: {
              protocol: "imap",
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
            await createThread({ mailboxId: input.mailboxId, fromEmail, subject })
          }
        }
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }

  return synced
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const mailboxId = body.mailboxId || "default"
  const limit = Math.max(1, Math.min(Number(body.limit || 25), 100))
  const protocol = getIncomingProtocol() === "pop3" ? "pop3" : "imap"

  try {
    const synced =
      protocol === "pop3"
        ? await syncPop3({ mailboxId, limit })
        : await syncImap({ mailboxId, limit })

    await writeSyncLog({
      mailboxId,
      syncedCount: synced.length,
      status: "completed",
      protocol
    })

    return NextResponse.json({
      ok: true,
      data: {
        protocol,
        count: synced.length,
        synced
      }
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `${protocol.toUpperCase()} sync failed`

    await writeSyncLog({
      mailboxId,
      syncedCount: 0,
      status: "failed",
      protocol,
      message
    })

    return NextResponse.json(
      {
        ok: false,
        error: message,
        protocol
      },
      { status: 500 }
    )
  }
}
