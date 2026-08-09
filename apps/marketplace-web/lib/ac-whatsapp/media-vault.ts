import crypto from 'crypto'

export type MediaVaultReceipt = {
  storageKey: string
  sha256: string
  sizeBytes: number
  mimeType: string
  fileName: string
  createdAt: string
}

type SignedTokenPayload = {
  v: 1
  op: 'upload' | 'download'
  key: string
  exp: number
  maxBytes?: number
  mimeType?: string
  fileName?: string
  disposition?: 'inline' | 'attachment'
}

function config() {
  const baseUrl = String(process.env.AC_WHATSAPP_MEDIA_VAULT_BASE_URL || '').replace(/\/$/, '')
  const hmacSecret = String(process.env.AC_WHATSAPP_MEDIA_VAULT_HMAC_SECRET || '')
  const internalSecret = String(process.env.AC_WHATSAPP_MEDIA_VAULT_INTERNAL_SECRET || '')
  if (!baseUrl || !hmacSecret || !internalSecret) throw new Error('MEDIA_VAULT_NOT_CONFIGURED')
  return { baseUrl, hmacSecret, internalSecret }
}

function encode(value: Buffer | string) {
  return Buffer.from(value).toString('base64url')
}

function sign(payload: SignedTokenPayload) {
  const { hmacSecret } = config()
  const encoded = encode(JSON.stringify(payload))
  const signature = crypto.createHmac('sha256', hmacSecret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function cleanSegment(value: unknown, fallback = 'item') {
  return String(value || fallback).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || fallback
}

export function mediaVaultConfigured() {
  return Boolean(
    process.env.AC_WHATSAPP_MEDIA_VAULT_BASE_URL
    && process.env.AC_WHATSAPP_MEDIA_VAULT_HMAC_SECRET
    && process.env.AC_WHATSAPP_MEDIA_VAULT_INTERNAL_SECRET,
  )
}

export function mediaVaultStorageKey(input: {
  accountId: string
  conversationId: string
  fileName: string
  category?: string
  objectId?: string
}) {
  const category = cleanSegment(input.category || 'media')
  const objectId = cleanSegment(input.objectId || crypto.randomUUID())
  const fileName = cleanSegment(input.fileName, `${objectId}.bin`)
  return `${cleanSegment(input.accountId)}/${cleanSegment(input.conversationId)}/${category}/${objectId}-${fileName}`
}

export function createMediaVaultUploadTicket(input: {
  storageKey: string
  fileName: string
  mimeType: string
  maxBytes: number
  expiresInSeconds?: number
}) {
  const { baseUrl } = config()
  const expiresIn = Math.max(60, Math.min(input.expiresInSeconds || 900, 3600))
  const payload: SignedTokenPayload = {
    v: 1,
    op: 'upload',
    key: input.storageKey,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    maxBytes: input.maxBytes,
    mimeType: input.mimeType || 'application/octet-stream',
    fileName: cleanSegment(input.fileName),
  }
  return {
    uploadUrl: `${baseUrl}/v1/upload?token=${encodeURIComponent(sign(payload))}`,
    storageKey: input.storageKey,
    expiresIn,
    headers: { 'Content-Type': payload.mimeType! },
  }
}

export function createMediaVaultDownloadUrl(
  storageKey: string,
  options: { expiresInSeconds?: number; disposition?: 'inline' | 'attachment' } = {},
) {
  const { baseUrl } = config()
  const expiresIn = Math.max(30, Math.min(options.expiresInSeconds || 300, 3600))
  const payload: SignedTokenPayload = {
    v: 1,
    op: 'download',
    key: storageKey,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    disposition: options.disposition || 'inline',
  }
  return {
    url: `${baseUrl}/v1/files?token=${encodeURIComponent(sign(payload))}`,
    expiresIn,
  }
}

async function internalRequest<T>(path: string, init: { method?: string; body?: unknown } = {}) {
  const { baseUrl, internalSecret } = config()
  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method || 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-AC-Media-Vault-Secret': internalSecret,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const text = await response.text()
  const payload = text ? (() => { try { return JSON.parse(text) } catch { return { raw: text } } })() : null
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || payload?.message || `MEDIA_VAULT_HTTP_${response.status}`)
  }
  return (payload?.data ?? payload) as T
}

export function ingestOpenWAMedia(input: {
  storageKey: string
  sessionId: string
  chatId: string
  externalMessageId: string
  fileName?: string | null
  mimeType?: string | null
  maxBytes?: number
}) {
  return internalRequest<MediaVaultReceipt>('/v1/internal/ingest-openwa', { body: input })
}

export function importMediaVaultUrl(input: {
  storageKey: string
  sourceUrl: string
  fileName?: string | null
  mimeType?: string | null
  maxBytes?: number
  expectedSha256?: string | null
}) {
  return internalRequest<MediaVaultReceipt>('/v1/internal/import-url', { body: input })
}

export function verifyMediaVaultObject(storageKey: string, expectedSha256?: string | null) {
  return internalRequest<MediaVaultReceipt>('/v1/internal/verify', { body: { storageKey, expectedSha256 } })
}

export function deleteMediaVaultObject(storageKey: string) {
  return internalRequest<{ deleted: boolean }>('/v1/internal/delete', { body: { storageKey } })
}
