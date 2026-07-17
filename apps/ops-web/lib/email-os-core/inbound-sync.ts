import crypto from "crypto"
import net from "node:net"
import tls from "node:tls"
import { simpleParser } from "mailparser"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { recordStorageEvent, upsertStorageFileMetadata } from "@/lib/email-os-core/storage-gateway"
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

export type EmailOSBridgeInboundAttachment = {
  filename: string | null
  contentType: string | null
  content_type?: string | null
  size: number | null
  size_bytes?: number | null
  storageFileId?: string | null
  storage_file_id?: string | null
  storageBucket?: string | null
  storage_bucket?: string | null
  storageKey?: string | null
  storage_key?: string | null
  storageStatus?: string | null
  storage_status?: string | null
  sha256Hash?: string | null
  sha256_hash?: string | null
}

export type EmailOSBridgeInboundMessage = {
  externalId?: string | null
  messageId?: string | null
  subject?: string | null
  fromEmail?: string | null
  fromName?: string | null
  to?: string[] | null
  cc?: string[] | null
  date?: string | null
  text?: string | null
  html?: string | null
  snippet?: string | null
  hasAttachments?: boolean | null
  attachments?: EmailOSBridgeInboundAttachment[] | null
  rawHeaders?: Record<string, string> | null
}

export type EmailOSBridgeInboundPersistResult = {
  mailboxId: string
  mailboxKey: string
  email: string
  provider: string
  fetched: number
  inserted: number
  updated: number
  skipped: number
  synced: Array<{
    providerUid: string
    subject: string
    fromEmail: string
    receivedAt: string
  }>
}

export class EmailOSInboundPersistenceError extends Error {
  code = "DB_INSERT_FAILED"

  constructor(message: string) {
    super(message)
    this.name = "EmailOSInboundPersistenceError"
  }
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

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function previewFrom(text: string | undefined | null, html: string | false | undefined) {
  const source = text || (typeof html === "string" ? html.replace(/<[^>]+>/g, " ") : "") || ""
  return source.replace(/\s+/g, " ").trim().slice(0, 280)
}

function previewFromBridgeMessage(message: EmailOSBridgeInboundMessage) {
  const source = message.snippet || message.text || (typeof message.html === "string" ? message.html.replace(/<[^>]+>/g, " ") : "") || ""
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

function normalizeBridgeList(values: unknown) {
  if (!Array.isArray(values)) return []
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
}

function normalizeBridgeDate(value: unknown) {
  const text = String(value || "").trim()
  if (!text) return nowIso()
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString()
}

function buildBridgeProviderUid(mailbox: ResolvedEmailOSMailbox, message: EmailOSBridgeInboundMessage, index: number) {
  const externalId = String(message.externalId || message.messageId || "").trim()
  if (externalId) return externalId

  return crypto
    .createHash("sha256")
    .update([
      mailbox.mailboxId,
      mailbox.email,
      normalizeBridgeList(message.to).join(","),
      normalizeBridgeList(message.cc).join(","),
      String(message.subject || ""),
      String(message.date || ""),
      String(message.fromEmail || ""),
      String(message.text || ""),
      String(index)
    ].join("|"))
    .digest("hex")
}

function buildBridgeRawPayload(mailbox: ResolvedEmailOSMailbox, providerUid: string, message: EmailOSBridgeInboundMessage, receivedAt: string, fromEmail: string, toEmail: string, ccEmail: string[]) {
  const toList = normalizeBridgeList(message.to)
  return {
    source: "windows-bridge-pop3",
    mailboxKey: mailbox.key,
    mailboxEmail: mailbox.email,
    providerUid,
    externalId: providerUid,
    messageId: message.messageId || null,
    fromName: message.fromName || null,
    fromEmail: fromEmail || null,
    to: toList.length ? toList : (toEmail ? [toEmail] : []),
    cc: ccEmail,
    subject: String(message.subject || "(Sans objet)"),
    text: message.text || null,
    html: typeof message.html === "string" ? message.html : null,
    date: receivedAt,
    headers: { ...(message.rawHeaders || {}) },
    attachments: Array.isArray(message.attachments)
      ? message.attachments.map((attachment) => ({
          filename: attachment?.filename || null,
          contentType: attachment?.contentType || null,
          size: Number.isFinite(Number(attachment?.size)) ? Number(attachment?.size) : 0,
          storageFileId: attachment?.storageFileId || attachment?.storage_file_id || null,
          storageBucket: attachment?.storageBucket || attachment?.storage_bucket || null,
          storageKey: attachment?.storageKey || attachment?.storage_key || null,
          storageStatus: attachment?.storageStatus || attachment?.storage_status || null,
          sha256Hash: attachment?.sha256Hash || attachment?.sha256_hash || null
        }))
      : [],
    hasAttachments: Boolean(message.hasAttachments),
    bridge: {
      protocol: "pop3",
      host: mailbox.incoming.host,
      port: mailbox.incoming.port,
      secure: mailbox.incoming.secure
    }
  }
}

export async function persistEmailOSBridgeInboundMessages(
  mailbox: ResolvedEmailOSMailbox,
  messages: EmailOSBridgeInboundMessage[]
): Promise<EmailOSBridgeInboundPersistResult> {
  const db = createEmailOSCoreDb()
  const synced: EmailOSBridgeInboundPersistResult["synced"] = []
  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const [index, message] of messages.entries()) {
    const providerUid = buildBridgeProviderUid(mailbox, message, index)
    if (!providerUid) {
      skipped += 1
      continue
    }

    const fromEmail = String(message.fromEmail || "").trim().toLowerCase() || mailbox.email
    const toEmails = normalizeBridgeList(message.to)
    const ccEmails = normalizeBridgeList(message.cc)
    const toEmail = toEmails.join(", ") || mailbox.email
    const receivedAt = normalizeBridgeDate(message.date)
    const subject = String(message.subject || "(Sans objet)")
    const preview = previewFromBridgeMessage(message)

    const { data: existing, error: lookupError } = await db
      .from("email_os_core_inbox")
      .select("id")
      .eq("mailbox_id", mailbox.mailboxId)
      .eq("provider_uid", providerUid)
      .maybeSingle()

    if (lookupError) {
      throw new EmailOSInboundPersistenceError(lookupError.message)
    }

    const attachmentRows = Array.isArray(message.attachments)
      ? message.attachments.filter((attachment) => clean(attachment?.storageFileId || attachment?.storage_file_id || ""))
      : []

    const payload = {
      id: makeEmailOSId(),
      mailbox_id: mailbox.mailboxId,
      provider_uid: providerUid,
      subject,
      from_email: fromEmail,
      to_email: toEmail,
      preview,
      status: "received",
      label: mailbox.label,
      folder: "inbox",
      raw: buildBridgeRawPayload(mailbox, providerUid, message, receivedAt, fromEmail, toEmail, ccEmails),
      created_at: receivedAt,
      updated_at: nowIso()
    }

    if (existing?.id) {
      const { error: updateError } = await db
        .from("email_os_core_inbox")
        .update({
          subject: payload.subject,
          from_email: payload.from_email,
          to_email: payload.to_email,
          preview: payload.preview,
          status: payload.status,
          label: payload.label,
          folder: payload.folder,
          raw: payload.raw,
          updated_at: payload.updated_at
        })
        .eq("id", existing.id)

      if (updateError) {
        throw new EmailOSInboundPersistenceError(updateError.message)
      }

      updated += 1
    } else {
      const { error: insertError } = await db.from("email_os_core_inbox").insert(payload)
      if (insertError) {
        throw new EmailOSInboundPersistenceError(insertError.message)
      }
      inserted += 1
    }

    for (const attachment of attachmentRows) {
      const fileId = clean(attachment?.storageFileId || attachment?.storage_file_id)
      if (!fileId) continue
      await upsertStorageFileMetadata(db, {
        id: fileId,
        module_key: "email_os",
        mailbox_id: mailbox.mailboxId,
        entity_type: "pop3_message",
        entity_id: providerUid,
        original_filename: clean(attachment?.filename || "attachment"),
        safe_filename: clean(attachment?.filename || "attachment"),
        content_type: clean(attachment?.contentType || attachment?.content_type || "application/octet-stream") || "application/octet-stream",
        size_bytes: Number(attachment?.size || attachment?.size_bytes || 0),
        sha256_hash: clean(attachment?.sha256Hash || attachment?.sha256_hash || ""),
        storage_provider: "windows_node",
        storage_node: "angelcare-windows-node-01",
        storage_bucket: clean(attachment?.storageBucket || attachment?.storage_bucket || "email-os-attachments") || "email-os-attachments",
        storage_key: clean(attachment?.storageKey || attachment?.storage_key || ""),
        status: clean(attachment?.storageStatus || attachment?.storage_status || "active") || "active",
        created_by: "windows_bridge_pop3",
        created_at: receivedAt,
        updated_at: nowIso(),
        deleted_at: null,
        metadata: {
          source: "windows-bridge-pop3",
          providerUid,
          mailboxKey: mailbox.key
        }
      })

      await recordStorageEvent(db, {
        fileId,
        action: "inbound_sync",
        moduleKey: "email_os",
        actorUserId: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          providerUid,
          mailboxId: mailbox.mailboxId,
          filename: clean(attachment?.filename || "attachment"),
          storageBucket: clean(attachment?.storageBucket || attachment?.storage_bucket || "email-os-attachments") || "email-os-attachments",
          storageKey: clean(attachment?.storageKey || attachment?.storage_key || "")
        }
      })
    }

    synced.push({
      providerUid,
      subject,
      fromEmail,
      receivedAt
    })
  }

  return {
    mailboxId: mailbox.mailboxId,
    mailboxKey: mailbox.key,
    email: mailbox.email,
    provider: "pop3",
    fetched: messages.length,
    inserted,
    updated,
    skipped,
    synced
  }
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
