import crypto from "crypto"
import net from "node:net"
import tls from "node:tls"
import { simpleParser } from "mailparser"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { recordStorageEvent, upsertStorageFileMetadata } from "@/lib/email-os-core/storage-gateway"
import type { ResolvedEmailOSMailbox } from "@/lib/email-os-core/multi-mailbox-resolver"
import {
  buildEmailOSInboundIdentity,
  buildEmailOSInboundIdentityFromRow,
  emailOSInboundIdentityIntersects,
  loadEmailOSInboundSuppressionKeys
} from "@/lib/email-os-core/inbound-identity"

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
  updated: number
  skipped: number
  suppressed: number
  deduplicated: number
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
  suppressed: number
  deduplicated: number
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


type ExistingInboundRow = {
  id: string
  mailbox_id: string
  provider_uid?: string | null
  ingest_key?: string | null
  subject?: string | null
  from_email?: string | null
  to_email?: string | null
  preview?: string | null
  status?: string | null
  folder?: string | null
  raw?: any
  created_at?: string | null
  updated_at?: string | null
}

async function loadExistingInboundRows(db: ReturnType<typeof createEmailOSCoreDb>, mailboxId: string) {
  const { data, error } = await db
    .from("email_os_core_inbox")
    .select("id,mailbox_id,provider_uid,ingest_key,subject,from_email,to_email,preview,status,folder,raw,created_at,updated_at")
    .eq("mailbox_id", mailboxId)
    .order("created_at", { ascending: false })
    .limit(2500)

  if (error) throw new EmailOSInboundPersistenceError(error.message)
  return (data || []) as ExistingInboundRow[]
}

function rowOperationalScore(row: ExistingInboundRow) {
  const status = clean(row.status).toLowerCase()
  if (status === "read") return 0
  if (status === "archived") return 1
  if (status === "trash" || status === "trashed") return 2
  if (status === "spam") return 3
  return 4
}

function chooseInboundSurvivor(rows: ExistingInboundRow[]) {
  return rows.slice().sort((left, right) => {
    const score = rowOperationalScore(left) - rowOperationalScore(right)
    if (score !== 0) return score
    const rightUpdated = new Date(right.updated_at || right.created_at || 0).getTime()
    const leftUpdated = new Date(left.updated_at || left.created_at || 0).getTime()
    return rightUpdated - leftUpdated
  })[0] || null
}

function buildInboundIdentityIndex(rows: ExistingInboundRow[]) {
  const index = new Map<string, Set<ExistingInboundRow>>()
  for (const row of rows) {
    const identity = buildEmailOSInboundIdentityFromRow(row)
    const keys = new Set([identity.ingestKey, ...(identity.keys || []), clean(row.ingest_key)].filter(Boolean))
    for (const key of keys) {
      const normalized = key.toLowerCase()
      const bucket = index.get(normalized) || new Set<ExistingInboundRow>()
      bucket.add(row)
      index.set(normalized, bucket)
    }
  }
  return index
}

function findInboundMatches(index: Map<string, Set<ExistingInboundRow>>, keys: string[]) {
  const matches = new Map<string, ExistingInboundRow>()
  for (const key of keys) {
    for (const row of index.get(key.toLowerCase()) || []) {
      matches.set(row.id, row)
    }
  }
  return Array.from(matches.values())
}

function addInboundRowToIndex(index: Map<string, Set<ExistingInboundRow>>, row: ExistingInboundRow) {
  const identity = buildEmailOSInboundIdentityFromRow(row)
  const keys = new Set([identity.ingestKey, ...(identity.keys || []), clean(row.ingest_key)].filter(Boolean))
  for (const key of keys) {
    const normalized = key.toLowerCase()
    const bucket = index.get(normalized) || new Set<ExistingInboundRow>()
    bucket.add(row)
    index.set(normalized, bucket)
  }
}

async function consolidateInboundDuplicates(
  db: ReturnType<typeof createEmailOSCoreDb>,
  mailboxId: string,
  survivor: ExistingInboundRow,
  duplicates: ExistingInboundRow[]
) {
  let removed = 0
  const detailTables = [
    "email_os_message_notes",
    "email_os_message_tasks",
    "email_os_message_assignments",
    "email_os_message_entity_links",
    "email_os_message_audit_events"
  ]

  for (const duplicate of duplicates) {
    if (!duplicate?.id || duplicate.id === survivor.id) continue

    for (const table of detailTables) {
      await db
        .from(table)
        .update({ message_id: survivor.id, updated_at: nowIso() })
        .eq("mailbox_id", mailboxId)
        .eq("message_id", duplicate.id)
        .then(() => null, () => null)
    }

    const { data: survivorWorkflow } = await db
      .from("email_os_message_workflow")
      .select("id")
      .eq("mailbox_id", mailboxId)
      .eq("message_id", survivor.id)
      .eq("source_table", "email_os_core_inbox")
      .maybeSingle()
      .then((result: any) => result, () => ({ data: null }))

    if (survivorWorkflow?.id) {
      await db
        .from("email_os_message_workflow")
        .delete()
        .eq("mailbox_id", mailboxId)
        .eq("message_id", duplicate.id)
        .eq("source_table", "email_os_core_inbox")
        .then(() => null, () => null)
    } else {
      await db
        .from("email_os_message_workflow")
        .update({ message_id: survivor.id, updated_at: nowIso() })
        .eq("mailbox_id", mailboxId)
        .eq("message_id", duplicate.id)
        .eq("source_table", "email_os_core_inbox")
        .then(() => null, () => null)
    }

    const { error } = await db
      .from("email_os_core_inbox")
      .delete()
      .eq("mailbox_id", mailboxId)
      .eq("id", duplicate.id)

    if (!error) removed += 1
  }

  return removed
}

function shouldPreserveInboundState(row: ExistingInboundRow) {
  const status = clean(row.status).toLowerCase()
  return ["read", "archived", "trash", "trashed", "spam", "deleted"].includes(status)
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
  let suppressed = 0
  let deduplicated = 0
  const suppressionKeys = await loadEmailOSInboundSuppressionKeys(db, mailbox.mailboxId)
  const existingRows = await loadExistingInboundRows(db, mailbox.mailboxId)
  const identityIndex = buildInboundIdentityIndex(existingRows)

  for (const message of messages) {

    const fromEmail = String(message.fromEmail || "").trim().toLowerCase() || mailbox.email
    const toEmails = normalizeBridgeList(message.to)
    const ccEmails = normalizeBridgeList(message.cc)
    const toEmail = toEmails.join(", ") || mailbox.email
    const receivedAt = normalizeBridgeDate(message.date)
    const subject = String(message.subject || "(Sans objet)")
    const preview = previewFromBridgeMessage(message)
    const identity = buildEmailOSInboundIdentity({
      mailboxId: mailbox.mailboxId,
      providerUid: message.externalId,
      externalId: message.externalId,
      messageId: message.messageId,
      fromEmail,
      toEmail,
      ccEmail: ccEmails.join(", "),
      subject,
      date: receivedAt,
      text: message.text,
      html: message.html
    })
    const providerUid = identity.canonicalProviderUid

    if (emailOSInboundIdentityIntersects(suppressionKeys, identity.keys)) {
      suppressed += 1
      skipped += 1
      continue
    }

    const matches = findInboundMatches(identityIndex, identity.keys)
    const existing = chooseInboundSurvivor(matches)

    if (existing && matches.length > 1) {
      deduplicated += await consolidateInboundDuplicates(
        db,
        mailbox.mailboxId,
        existing,
        matches.filter((row) => row.id !== existing.id)
      )
    }

    const attachmentRows = Array.isArray(message.attachments)
      ? message.attachments.filter((attachment) => clean(attachment?.storageFileId || attachment?.storage_file_id || ""))
      : []

    const payload = {
      id: makeEmailOSId(),
      mailbox_id: mailbox.mailboxId,
      provider_uid: providerUid,
      ingest_key: identity.ingestKey,
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
          provider_uid: payload.provider_uid,
          ingest_key: payload.ingest_key,
          subject: payload.subject,
          from_email: payload.from_email,
          to_email: payload.to_email,
          preview: payload.preview,
          ...(shouldPreserveInboundState(existing) ? {} : {
            status: payload.status,
            label: payload.label,
            folder: payload.folder
          }),
          raw: payload.raw,
          updated_at: payload.updated_at
        })
        .eq("id", existing.id)

      if (updateError) {
        throw new EmailOSInboundPersistenceError(updateError.message)
      }

      updated += 1
      addInboundRowToIndex(identityIndex, { ...existing, ...payload, id: existing.id })
    } else {
      const { error: insertError } = await db.from("email_os_core_inbox").insert(payload)
      if (insertError) {
        throw new EmailOSInboundPersistenceError(insertError.message)
      }
      inserted += 1
      addInboundRowToIndex(identityIndex, payload)
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
    suppressed,
    deduplicated,
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
  let suppressed = 0
  let deduplicated = 0
  const suppressionKeys = await loadEmailOSInboundSuppressionKeys(db, mailbox.mailboxId)
  const existingRows = await loadExistingInboundRows(db, mailbox.mailboxId)
  const identityIndex = buildInboundIdentityIndex(existingRows)

  await client.connect()
  try {
    await client.login(mailbox.incoming.user, mailbox.incoming.pass)
    const refs = (await client.listMessages()).slice(-Math.max(1, Math.min(limit, 100)))

    for (const ref of refs) {
      const preliminaryIdentity = buildEmailOSInboundIdentity({
        mailboxId: mailbox.mailboxId,
        providerUid: ref.uid,
        externalId: ref.uid
      })

      if (emailOSInboundIdentityIntersects(suppressionKeys, preliminaryIdentity.keys)) {
        suppressed += 1
        skipped += 1
        continue
      }

      const preliminaryMatches = findInboundMatches(identityIndex, preliminaryIdentity.keys)
      if (preliminaryMatches.length === 1) {
        skipped += 1
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
      const identity = buildEmailOSInboundIdentity({
        mailboxId: mailbox.mailboxId,
        providerUid: ref.uid,
        externalId: ref.uid,
        messageId: parsed.messageId,
        fromEmail: from?.address,
        toEmail: to,
        ccEmail: parsed.cc?.value?.map((item) => item.address).filter(Boolean).join(", "),
        subject,
        date: receivedAt,
        text: parsed.text,
        html: parsed.html
      })

      if (emailOSInboundIdentityIntersects(suppressionKeys, identity.keys)) {
        suppressed += 1
        skipped += 1
        continue
      }

      const matches = findInboundMatches(identityIndex, identity.keys)
      const existing = chooseInboundSurvivor(matches)
      if (existing) {
        if (matches.length > 1) {
          deduplicated += await consolidateInboundDuplicates(
            db,
            mailbox.mailboxId,
            existing,
            matches.filter((row) => row.id !== existing.id)
          )
        }

        await db
          .from("email_os_core_inbox")
          .update({
            provider_uid: identity.canonicalProviderUid,
            ingest_key: identity.ingestKey,
            subject,
            from_email: from?.address || "",
            to_email: to,
            preview,
            raw: {
              ...(existing.raw || {}),
              source: "pop3",
              mailboxKey: mailbox.key,
              mailboxEmail: mailbox.email,
              providerUid: identity.canonicalProviderUid,
              externalId: ref.uid,
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
            updated_at: nowIso()
          })
          .eq("id", existing.id)
          .eq("mailbox_id", mailbox.mailboxId)

        skipped += 1
        addInboundRowToIndex(identityIndex, { ...existing, provider_uid: identity.canonicalProviderUid, ingest_key: identity.ingestKey })
        continue
      }

      const row = {
        id: makeEmailOSId(),
        mailbox_id: mailbox.mailboxId,
        provider_uid: identity.canonicalProviderUid,
        ingest_key: identity.ingestKey,
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
          providerUid: identity.canonicalProviderUid,
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
      }

      const { error } = await db.from("email_os_core_inbox").insert(row)
      if (error) throw error
      inserted++
      addInboundRowToIndex(identityIndex, row)
      synced.push({
        providerUid: identity.canonicalProviderUid,
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
    updated: 0,
    skipped,
    suppressed,
    deduplicated,
    synced
  }
}

export async function syncEmailOSMailbox(mailbox: ResolvedEmailOSMailbox, limit = 25) {
  if (mailbox.incoming.protocol !== "pop3") {
    throw new Error(`Unsupported incoming protocol: ${mailbox.incoming.protocol}`)
  }
  return syncPop3Mailbox(mailbox, limit)
}
