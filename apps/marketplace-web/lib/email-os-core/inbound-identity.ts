import crypto from "crypto"

export type EmailOSInboundIdentityInput = {
  mailboxId: string
  providerUid?: unknown
  externalId?: unknown
  messageId?: unknown
  fromEmail?: unknown
  toEmail?: unknown
  ccEmail?: unknown
  subject?: unknown
  date?: unknown
  text?: unknown
  html?: unknown
}

export type EmailOSInboundIdentity = {
  ingestKey: string
  canonicalProviderUid: string
  normalizedMessageId: string
  fingerprint: string
  keys: string[]
}

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function normalizeText(value: unknown) {
  return clean(value).replace(/\s+/g, " ").toLowerCase()
}

export function normalizeEmailOSMessageId(value: unknown) {
  return clean(value).replace(/^<+|>+$/g, "").replace(/\s+/g, "").toLowerCase()
}

function normalizeProviderUid(value: unknown) {
  return clean(value).toLowerCase()
}

function extractPop3Uid(value: unknown) {
  const raw = clean(value)
  if (!raw) return ""
  const marker = raw.toLowerCase().lastIndexOf(":pop3:")
  if (marker >= 0) return raw.slice(marker + 6).trim()
  if (/^pop3:/i.test(raw)) {
    const parts = raw.split(":")
    return parts[parts.length - 1]?.trim() || ""
  }
  return raw
}

function normalizedDate(value: unknown) {
  const raw = clean(value)
  if (!raw) return ""
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? raw.toLowerCase() : date.toISOString()
}

function htmlToText(value: unknown) {
  return clean(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function buildEmailOSInboundIdentity(input: EmailOSInboundIdentityInput): EmailOSInboundIdentity {
  const mailboxId = clean(input.mailboxId).toLowerCase()
  const normalizedMessageId = normalizeEmailOSMessageId(input.messageId)
  const rawProviderUid = clean(input.providerUid)
  const rawExternalId = clean(input.externalId)
  const pop3Uid = extractPop3Uid(rawExternalId || rawProviderUid)

  const fingerprint = crypto
    .createHash("sha256")
    .update([
      mailboxId,
      normalizeText(input.fromEmail),
      normalizeText(input.toEmail),
      normalizeText(input.ccEmail),
      normalizeText(input.subject),
      normalizedDate(input.date),
      normalizeText(input.text || htmlToText(input.html))
    ].join("|"))
    .digest("hex")

  const messageKey = normalizedMessageId ? `mid:${normalizedMessageId}` : ""
  const pop3Key = pop3Uid ? `pop3:${mailboxId}:${pop3Uid.toLowerCase()}` : ""
  const fingerprintKey = `fp:${mailboxId}:${fingerprint}`

  const ingestKey = messageKey || pop3Key || fingerprintKey
  const keys = new Set<string>([ingestKey, messageKey, pop3Key, fingerprintKey].filter(Boolean))

  for (const candidate of [rawProviderUid, rawExternalId]) {
    const normalized = normalizeProviderUid(candidate)
    if (normalized) {
      keys.add(`raw:${mailboxId}:${normalized}`)
      if (/^(mid|pop3|fp):/i.test(normalized)) keys.add(normalized)
    }
  }

  return {
    ingestKey,
    canonicalProviderUid: ingestKey,
    normalizedMessageId,
    fingerprint,
    keys: Array.from(keys)
  }
}

export function buildEmailOSInboundIdentityFromRow(row: any): EmailOSInboundIdentity {
  const raw = row?.raw || {}
  return buildEmailOSInboundIdentity({
    mailboxId: row?.mailbox_id,
    providerUid: row?.provider_uid,
    externalId: raw?.externalId || raw?.providerUid || raw?.provider_uid,
    messageId: raw?.messageId || raw?.message_id,
    fromEmail: row?.from_email || raw?.fromEmail,
    toEmail: row?.to_email || raw?.to,
    ccEmail: raw?.cc,
    subject: row?.subject || raw?.subject,
    date: row?.created_at || raw?.date,
    text: raw?.text || row?.preview,
    html: raw?.html
  })
}

export function emailOSInboundIdentityIntersects(keys: Iterable<string>, candidates: Iterable<string>) {
  const set = new Set(Array.from(keys).map((item) => clean(item).toLowerCase()).filter(Boolean))
  return Array.from(candidates).some((item) => set.has(clean(item).toLowerCase()))
}

export async function loadEmailOSInboundSuppressionKeys(db: any, mailboxId: string) {
  const { data, error } = await db
    .from("email_os_inbound_suppressions")
    .select("identity_key")
    .eq("mailbox_id", mailboxId)
    .is("released_at", null)
    .limit(5000)

  if (error) {
    throw new Error(`Inbound suppression registry unavailable: ${error.message}`)
  }

  return new Set<string>((data || []).map((row: any) => clean(row?.identity_key).toLowerCase()).filter(Boolean))
}

export async function recordEmailOSInboundSuppressions(
  db: any,
  input: {
    mailboxId: string
    messageId: string
    identity: EmailOSInboundIdentity
    actorUserId?: string | null
    reason?: string
  }
) {
  const now = new Date().toISOString()
  const rows = input.identity.keys.map((identityKey) => ({
    id: crypto.randomUUID(),
    mailbox_id: input.mailboxId,
    identity_key: identityKey.toLowerCase(),
    ingest_key: input.identity.ingestKey,
    provider_uid: input.identity.canonicalProviderUid,
    message_id: input.identity.normalizedMessageId || null,
    fingerprint: input.identity.fingerprint,
    source_message_id: input.messageId,
    reason: input.reason || "permanent_delete",
    created_by: input.actorUserId || null,
    created_at: now,
    updated_at: now,
    released_at: null
  }))

  const { error } = await db
    .from("email_os_inbound_suppressions")
    .upsert(rows, { onConflict: "mailbox_id,identity_key" })

  if (error) {
    throw new Error(`Unable to protect permanently deleted inbound message: ${error.message}`)
  }

  return {
    ingestKey: input.identity.ingestKey,
    keys: input.identity.keys,
    count: rows.length
  }
}
