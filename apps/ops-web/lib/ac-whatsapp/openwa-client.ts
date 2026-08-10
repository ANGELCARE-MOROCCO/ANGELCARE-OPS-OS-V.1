type OpenWARequest = { method?: string; body?: unknown; timeoutMs?: number }

export class OpenWAError extends Error {
  status: number
  payload: unknown
  constructor(message: string, status = 500, payload?: unknown) {
    super(message); this.name = 'OpenWAError'; this.status = status; this.payload = payload
  }
}

function config() {
  const baseUrl = String(process.env.OPENWA_BASE_URL || '').replace(/\/$/, '')
  const apiKey = String(process.env.OPENWA_API_KEY || '')
  if (!baseUrl || !apiKey) throw new OpenWAError('OPENWA_NOT_CONFIGURED', 503)
  return { baseUrl, apiKey }
}

function compactErrorPayload(payload: unknown, status: number) {
  if (!payload || typeof payload !== 'object') return `OPENWA_HTTP_${status}`
  const row = payload as Record<string, unknown>
  const parts = [row.message, row.error, row.code]
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
  return [...new Set(parts)].join(' · ').slice(0, 700) || `OPENWA_HTTP_${status}`
}

async function request<T>(path: string, init: OpenWARequest = {}): Promise<T> {
  const { baseUrl, apiKey } = config()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs || 20_000)
  try {
    const response = await fetch(`${baseUrl}/api${path}`, {
      method: init.method || 'GET', cache: 'no-store', signal: controller.signal,
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
    const text = await response.text()
    const payload = text ? (() => { try { return JSON.parse(text) } catch { return { raw: text } } })() : null
    if (!response.ok) throw new OpenWAError(compactErrorPayload(payload, response.status), response.status, payload)
    return payload as T
  } catch (error) {
    if (error instanceof OpenWAError) throw error
    if ((error as any)?.name === 'AbortError') throw new OpenWAError('OPENWA_TIMEOUT', 504)
    throw new OpenWAError(error instanceof Error ? error.message : 'OPENWA_UNAVAILABLE', 502)
  } finally { clearTimeout(timeout) }
}

function phoneDigits(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') {
    const digits = String(value).replace(/\D/g, '')
    return /^\d{8,15}$/.test(digits) ? digits : ''
  }
  if (Array.isArray(value)) {
    for (const item of value) { const digits = phoneDigits(item); if (digits) return digits }
    return ''
  }
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>
    for (const key of ['phone', 'phoneNumber', 'number', 'msisdn', 'pn', 'jid']) {
      const digits = phoneDigits(row[key]); if (digits) return digits
    }
    for (const nested of Object.values(row)) { const digits = phoneDigits(nested); if (digits) return digits }
  }
  return ''
}


const MEDIA_BASE64_FALLBACK_DEFAULT_MAX_BYTES = 16 * 1024 * 1024
const MEDIA_BASE64_FALLBACK_HARD_MAX_BYTES = 48 * 1024 * 1024
const MEDIA_URL_FALLBACK_STATUSES = new Set([400, 408, 422, 502, 504])

function configuredBase64FallbackMaxBytes() {
  const configured = Number(process.env.AC_WHATSAPP_MEDIA_BASE64_MAX_BYTES || MEDIA_BASE64_FALLBACK_DEFAULT_MAX_BYTES)
  if (!Number.isFinite(configured) || configured <= 0) return MEDIA_BASE64_FALLBACK_DEFAULT_MAX_BYTES
  return Math.max(1024 * 1024, Math.min(Math.floor(configured), MEDIA_BASE64_FALLBACK_HARD_MAX_BYTES))
}

function declaredMediaSize(media: Record<string, unknown>) {
  const value = Number(media.size ?? media.sizeBytes ?? 0)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

async function downloadMediaForFallback(url: string, declaredMimeType?: string, maxBytes = configuredBase64FallbackMaxBytes()) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)
  try {
    const response = await fetch(url, { method: 'GET', cache: 'no-store', signal: controller.signal })
    if (!response.ok) throw new OpenWAError(`MEDIA_SOURCE_HTTP_${response.status}`, 502)
    const length = Number(response.headers.get('content-length') || 0)
    if (length > maxBytes) throw new OpenWAError('MEDIA_URL_RETRY_TOO_LARGE', 413)
    const buffer = Buffer.from(await response.arrayBuffer())
    if (!buffer.length) throw new OpenWAError('MEDIA_SOURCE_EMPTY', 422)
    if (buffer.length > maxBytes) throw new OpenWAError('MEDIA_URL_RETRY_TOO_LARGE', 413)
    const mimetype = String(declaredMimeType || response.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim() || 'application/octet-stream'
    return { base64: buffer.toString('base64'), mimetype, sizeBytes: buffer.length }
  } catch (error) {
    if (error instanceof OpenWAError) throw error
    if ((error as any)?.name === 'AbortError') throw new OpenWAError('MEDIA_SOURCE_TIMEOUT', 504)
    throw new OpenWAError(error instanceof Error ? `MEDIA_SOURCE_FETCH_FAILED:${error.message}` : 'MEDIA_SOURCE_FETCH_FAILED', 502)
  } finally { clearTimeout(timeout) }
}

async function requestMediaWithUrlFallback<T>(
  path: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
  fallbackMaxBytes = configuredBase64FallbackMaxBytes(),
) {
  try {
    return await request<T>(path, { method: 'POST', body: payload, timeoutMs })
  } catch (error) {
    if (
      !(error instanceof OpenWAError)
      || !MEDIA_URL_FALLBACK_STATUSES.has(error.status)
      || typeof payload.url !== 'string'
      || !payload.url
    ) throw error

    const source = await downloadMediaForFallback(
      payload.url,
      typeof payload.mimetype === 'string' ? payload.mimetype : undefined,
      fallbackMaxBytes,
    )
    const retryPayload: Record<string, unknown> = { ...payload, base64: source.base64, mimetype: source.mimetype }
    delete retryPayload.url
    return request<T>(path, { method: 'POST', body: retryPayload, timeoutMs })
  }
}

async function prepareMediaSource(media: Record<string, unknown>) {
  let url = typeof media.url === 'string' && media.url ? media.url : undefined
  let base64 = typeof media.base64 === 'string' && media.base64 ? media.base64 : undefined
  let mimetype = typeof media.mimetype === 'string' && media.mimetype ? media.mimetype : undefined
  const sizeBytes = declaredMediaSize(media)
  const maxBytes = configuredBase64FallbackMaxBytes()

  // Windows Media Vault files already carry a trusted size. For files that fit safely
  // under OpenWA's default JSON body limit, fetch them from the public Vault in Next.js
  // and send Base64 directly. This avoids asking OpenWA on the Windows host to hairpin
  // through its own public DuckDNS/Caddy address just to read a local file.
  if (url && !base64 && sizeBytes > 0 && sizeBytes <= maxBytes) {
    const source = await downloadMediaForFallback(url, mimetype, maxBytes)
    url = undefined
    base64 = source.base64
    mimetype = source.mimetype
  }

  return { url, base64, mimetype, maxBytes }
}

async function resolveContactPhone(id: string, contactId: string) {
  const payload = await request<unknown>(`/sessions/${encodeURIComponent(id)}/contacts/${encodeURIComponent(contactId)}/phone`, { timeoutMs: 15_000 })
  const digits = phoneDigits(payload)
  return digits || null
}

async function resolveChatId(id: string, chatId: string) {
  const raw = String(chatId || '').trim()
  if (!/@lid$/i.test(raw)) return raw
  try {
    const digits = await resolveContactPhone(id, raw)
    return digits ? `${digits}@c.us` : raw
  } catch {
    // Do not destroy a usable @lid when an optional identity lookup is temporarily unavailable.
    return raw
  }
}

export const openwa = {
  configured: () => Boolean(process.env.OPENWA_BASE_URL && process.env.OPENWA_API_KEY),
  health: () => request<Record<string, unknown>>('/health', { timeoutMs: 6_000 }),
  listSessions: () => request<Array<Record<string, unknown>>>('/sessions'),
  getSession: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}`),
  createSession: (input: { name: string; config?: Record<string, unknown> }) => request<Record<string, unknown>>('/sessions', { method: 'POST', body: input }),
  startSession: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/start`, { method: 'POST', timeoutMs: 45_000 }),
  stopSession: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/stop`, { method: 'POST' }),
  deleteSession: (id: string) => request<void>(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE', timeoutMs: 45_000 }),
  logoutSession: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/logout`, { method: 'POST', timeoutMs: 45_000 }),
  getQr: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/qr`),
  pairingCode: (id: string, phoneNumber: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/pairing-code`, { method: 'POST', body: { phoneNumber } }),
  listChats: (id: string) => request<Array<Record<string, unknown>>>(`/sessions/${encodeURIComponent(id)}/chats?limit=1000`),
  listMessages: (id: string, chatId?: string, limit = 100) => request<Array<Record<string, unknown>>>(`/sessions/${encodeURIComponent(id)}/messages?limit=${limit}${chatId ? `&chatId=${encodeURIComponent(chatId)}` : ''}`),
  getChatHistory: (id: string, chatId: string, limit = 100, includeMedia = false) => request<Array<Record<string, unknown>>>(`/sessions/${encodeURIComponent(id)}/messages/${encodeURIComponent(chatId)}/history?limit=${Math.max(1, Math.min(limit, 100))}&includeMedia=${includeMedia ? 'true' : 'false'}`, { timeoutMs: includeMedia ? 120_000 : 45_000 }),
  resolveContactPhone,
  resolveChatId,
  sendText: async (id: string, chatId: string, text: string) => {
    const resolvedChatId = await resolveChatId(id, chatId)
    return request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-text`, { method: 'POST', body: { chatId: resolvedChatId, text }, timeoutMs: 45_000 })
  },
  sendImage: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-image`, { method: 'POST', body: payload, timeoutMs: 90_000 }),
  sendVideo: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-video`, { method: 'POST', body: payload, timeoutMs: 120_000 }),
  sendAudio: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-audio`, { method: 'POST', body: payload, timeoutMs: 120_000 }),
  sendDocument: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-document`, { method: 'POST', body: payload, timeoutMs: 120_000 }),
  sendMedia: async (id: string, type: string, chatId: string, media: Record<string, unknown>, caption?: string) => {
    const resolvedChatId = await resolveChatId(id, chatId)
    const prepared = await prepareMediaSource(media)
    const url = prepared.url
    const base64 = prepared.base64
    const mimetype = prepared.mimetype
    const filename = typeof media.filename === 'string' && media.filename ? media.filename : undefined
    const finalCaption = String(caption || media.caption || '').trim() || undefined

    if (!url && !base64) throw new OpenWAError('OPENWA_MEDIA_SOURCE_REQUIRED', 422)

    if (type === 'image') {
      const payload = {
        chatId: resolvedChatId,
        ...(url ? { url } : { base64 }),
        ...(base64 && mimetype ? { mimetype } : {}),
        ...(finalCaption ? { caption: finalCaption } : {}),
      }
      return requestMediaWithUrlFallback<Record<string, unknown>>(
        `/sessions/${encodeURIComponent(id)}/messages/send-image`, payload, 90_000, prepared.maxBytes,
      )
    }

    if (type === 'video') {
      const payload = {
        chatId: resolvedChatId,
        ...(url ? { url } : { base64 }),
        ...(base64 && mimetype ? { mimetype } : {}),
        ...(finalCaption ? { caption: finalCaption } : {}),
      }
      return requestMediaWithUrlFallback<Record<string, unknown>>(
        `/sessions/${encodeURIComponent(id)}/messages/send-video`, payload, 120_000, prepared.maxBytes,
      )
    }

    if (type === 'audio' || type === 'voice') {
      const payload = {
        chatId: resolvedChatId,
        ...(url ? { url } : { base64 }),
        ...(mimetype ? { mimetype } : {}),
        ...(type === 'voice' ? { ptt: true } : {}),
      }
      return requestMediaWithUrlFallback<Record<string, unknown>>(
        `/sessions/${encodeURIComponent(id)}/messages/send-audio`, payload, 120_000, prepared.maxBytes,
      )
    }

    if (type === 'document') {
      const payload = {
        chatId: resolvedChatId,
        ...(url ? { url } : { base64 }),
        ...(filename ? { filename } : {}),
        ...(mimetype ? { mimetype } : {}),
      }
      return requestMediaWithUrlFallback<Record<string, unknown>>(
        `/sessions/${encodeURIComponent(id)}/messages/send-document`, payload, 120_000, prepared.maxBytes,
      )
    }

    throw new OpenWAError(`UNSUPPORTED_MEDIA_TYPE:${type}`, 422)
  },
  sendBulk: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-bulk`, { method: 'POST', body: payload, timeoutMs: 60_000 }),
  createWebhook: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/webhooks`, { method: 'POST', body: payload }),
  listWebhooks: (id: string) => request<Array<Record<string, unknown>>>(`/sessions/${encodeURIComponent(id)}/webhooks`),
}
