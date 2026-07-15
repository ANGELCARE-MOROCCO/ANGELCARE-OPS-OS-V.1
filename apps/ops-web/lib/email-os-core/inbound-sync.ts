import net from "node:net"
import tls from "node:tls"
import { simpleParser } from "mailparser"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import type { ResolvedEmailOSMailbox } from "@/lib/email-os-core/multi-mailbox-resolver"

type Pop3MessageRef = {
  number: number
  uid: string
  size?: number
}

type EmailOSInboundSyncResult = {
  mailboxId: string
  mailboxKey: string
  email: string
  provider: string
  fetched: number
  inserted: number
  skipped: number
  synced: Array<{
    providerUid: string
    subject: string
    fromEmail: string
    receivedAt: string
  }>
}

type ParsedMailAddress = {
  name?: string | null
  address?: string | null
}

type ParsedMailAddressList = {
  value?: ParsedMailAddress[]
}

type ParsedMailAttachmentSummary = {
  filename?: string | null
  contentType?: string | null
  size?: number | null
}

type ParsedInboundMessage = {
  from?: ParsedMailAddressList
  to?: ParsedMailAddressList
  cc?: ParsedMailAddressList
  subject?: string
  text?: string
  html?: string | false
  date?: Date
  messageId?: string
  headers?: Iterable<[string, unknown]>
  attachments?: ParsedMailAttachmentSummary[]
}

function cleanLine(value: string) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim()
}

function previewFrom(text: string | undefined | null, html: string | false | undefined) {
  const source = text || (typeof html === "string" ? html.replace(/<[^>]+>/g, " ") : "") || ""
  return source.replace(/\s+/g, " ").trim().slice(0, 280)
}

function headersToObject(headers: Iterable<[string, unknown]> | null | undefined) {
  const output: Record<string, string> = {}
  try {
    if (!headers) return output
    for (const [key, value] of headers) {
      if (typeof value === "string") output[key] = value
      else if (Array.isArray(value)) output[key] = value.map((item) => String(item)).join(", ")
      else if (value) output[key] = String(value)
    }
  } catch {}
  return output
}

class Pop3Client {
  private socket: net.Socket | tls.TLSSocket | null = null
  private buffer = ""

  constructor(private config: { host: string; port: number; secure: boolean; timeoutMs?: number }) {}

  private readLine(): Promise<string> {
    return new Promise((resolve, reject) => {
      const tryRead = () => {
        const index = this.buffer.indexOf("\r\n")
        if (index >= 0) {
          const line = this.buffer.slice(0, index)
          this.buffer = this.buffer.slice(index + 2)
          cleanup()
          resolve(line)
          return true
        }
        return false
      }

      const onData = (chunk: Buffer) => {
        this.buffer += chunk.toString("binary")
        tryRead()
      }
      const onError = (error: Error) => {
        cleanup()
        reject(error)
      }
      const onTimeout = () => {
        cleanup()
        reject(new Error("POP3 timeout"))
      }
      const cleanup = () => {
        this.socket?.off("data", onData)
        this.socket?.off("error", onError)
        this.socket?.off("timeout", onTimeout)
      }

      if (tryRead()) return
      this.socket?.on("data", onData)
      this.socket?.once("error", onError)
      this.socket?.once("timeout", onTimeout)
    })
  }

  private async readResponse() {
    const line = await this.readLine()
    if (!line.startsWith("+OK")) {
      throw new Error(line || "POP3 command failed")
    }
    return line
  }

  private async readMultiline(): Promise<string[]> {
    const first = await this.readLine()
    if (!first.startsWith("+OK")) throw new Error(first || "POP3 multiline command failed")

    const lines: string[] = []
    while (true) {
      const line = await this.readLine()
      if (line === ".") break
      lines.push(line.startsWith("..") ? line.slice(1) : line)
    }
    return lines
  }

  async connect() {
    const { host, port, secure, timeoutMs = 15000 } = this.config
    this.socket = secure
      ? tls.connect({ host, port, servername: host, rejectUnauthorized: false })
      : net.connect({ host, port })
    this.socket.setTimeout(timeoutMs)

    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup()
        resolve()
      }
      const onError = (error: Error) => {
        cleanup()
        reject(error)
      }
      const cleanup = () => {
        this.socket?.off("connect", onReady)
        this.socket?.off("secureConnect", onReady)
        this.socket?.off("error", onError)
      }
      this.socket?.once(secure ? "secureConnect" : "connect", onReady)
      this.socket?.once("error", onError)
    })

    await this.readResponse()
  }

  async command(command: string) {
    if (!this.socket) throw new Error("POP3 socket is not connected")
    this.socket.write(`${command}\r\n`, "binary")
    return this.readResponse()
  }

  async multiline(command: string) {
    if (!this.socket) throw new Error("POP3 socket is not connected")
    this.socket.write(`${command}\r\n`, "binary")
    return this.readMultiline()
  }

  async login(user: string, pass: string) {
    await this.command(`USER ${cleanLine(user)}`)
    await this.command(`PASS ${cleanLine(pass)}`)
  }

  async listMessages(): Promise<Pop3MessageRef[]> {
    const uidLines = await this.multiline("UIDL").catch(() => [])
    const listLines = await this.multiline("LIST").catch(() => [])

    const sizes = new Map<number, number>()
    for (const line of listLines) {
      const [numberText, sizeText] = line.split(/\s+/)
      const number = Number(numberText)
      const size = Number(sizeText)
      if (Number.isFinite(number) && Number.isFinite(size)) sizes.set(number, size)
    }

    return uidLines
      .map((line) => {
        const [numberText, uid] = line.split(/\s+/)
        const number = Number(numberText)
        return Number.isFinite(number) && uid ? { number, uid, size: sizes.get(number) } : null
      })
      .filter(Boolean) as Pop3MessageRef[]
  }

  async retrieve(number: number) {
    return this.multiline(`RETR ${number}`)
  }

  async quit() {
    try {
      await this.command("QUIT")
    } catch {}
    try {
      this.socket?.destroy()
    } catch {}
  }
}

async function syncPop3Mailbox(mailbox: ResolvedEmailOSMailbox, limit: number): Promise<EmailOSInboundSyncResult> {
  if (!mailbox.incoming.host || !mailbox.incoming.user || !mailbox.incoming.pass) {
    throw new Error(`Incoming POP3 credentials are incomplete for ${mailbox.email}`)
  }

  const db = createEmailOSCoreDb()
  const client = new Pop3Client({
    host: mailbox.incoming.host,
    port: mailbox.incoming.port,
    secure: mailbox.incoming.secure
  })

  const synced: EmailOSInboundSyncResult["synced"] = []
  let inserted = 0
  let skipped = 0
  let fetched = 0

  await client.connect()
  try {
    await client.login(mailbox.incoming.user, mailbox.incoming.pass)
    const refs = (await client.listMessages()).slice(-Math.max(1, Math.min(limit, 100)))

    for (const ref of refs) {
      const providerUid = `${mailbox.email}:pop3:${ref.uid}`
      const { data: existing } = await db
        .from("email_os_core_inbox")
        .select("id")
        .eq("mailbox_id", mailbox.mailboxId)
        .eq("provider_uid", providerUid)
        .maybeSingle()

      if (existing?.id) {
        skipped++
        continue
      }

      const rawLines = await client.retrieve(ref.number)
      fetched++
      const rawMessage = Buffer.from(rawLines.join("\r\n"), "binary")
      const parsed = (await simpleParser(rawMessage)) as ParsedInboundMessage
      const from = parsed.from?.value?.[0]
      const to = parsed.to?.value?.map((item) => item.address).filter(Boolean).join(", ") || mailbox.email
      const receivedAt = parsed.date ? parsed.date.toISOString() : nowIso()
      const subject = parsed.subject || "(Sans objet)"
      const preview = previewFrom(parsed.text, parsed.html)

      const { error } = await db.from("email_os_core_inbox").insert({
        id: makeEmailOSId(),
        mailbox_id: mailbox.mailboxId,
        provider_uid: providerUid,
        subject,
        from_email: from?.address || "",
        to_email: to,
        preview,
        status: "received",
        label: mailbox.label,
        folder: "inbox",
        raw: {
          source: "pop3",
          mailboxKey: mailbox.key,
          mailboxEmail: mailbox.email,
          providerUid,
          messageId: parsed.messageId || null,
          fromName: from?.name || null,
          fromEmail: from?.address || null,
          to: parsed.to?.value || [],
          cc: parsed.cc?.value || [],
          subject,
          text: parsed.text || null,
          html: parsed.html || null,
          date: receivedAt,
          headers: headersToObject(parsed.headers),
          attachments: (parsed.attachments || []).map((attachment) => ({
            filename: attachment.filename || null,
            contentType: attachment.contentType || null,
            size: attachment.size || 0
          }))
        },
        created_at: receivedAt,
        updated_at: nowIso()
      })

      if (error) throw error
      inserted++
      synced.push({
        providerUid,
        subject,
        fromEmail: from?.address || "",
        receivedAt
      })
    }
  } finally {
    await client.quit()
  }

  return {
    mailboxId: mailbox.mailboxId,
    mailboxKey: mailbox.key,
    email: mailbox.email,
    provider: "pop3",
    fetched,
    inserted,
    skipped,
    synced
  }
}

export async function syncEmailOSMailbox(mailbox: ResolvedEmailOSMailbox, limit = 25) {
  if (mailbox.incoming.protocol !== "pop3") {
    throw new Error(`Unsupported incoming protocol: ${mailbox.incoming.protocol}`)
  }
  return syncPop3Mailbox(mailbox, limit)
}
