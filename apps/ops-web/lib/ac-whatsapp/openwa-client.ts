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
    if (!response.ok) throw new OpenWAError((payload as any)?.message || `OPENWA_HTTP_${response.status}`, response.status, payload)
    return payload as T
  } catch (error) {
    if (error instanceof OpenWAError) throw error
    if ((error as any)?.name === 'AbortError') throw new OpenWAError('OPENWA_TIMEOUT', 504)
    throw new OpenWAError(error instanceof Error ? error.message : 'OPENWA_UNAVAILABLE', 502)
  } finally { clearTimeout(timeout) }
}

export const openwa = {
  configured: () => Boolean(process.env.OPENWA_BASE_URL && process.env.OPENWA_API_KEY),
  health: () => request<Record<string, unknown>>('/health', { timeoutMs: 6_000 }),
  listSessions: () => request<Array<Record<string, unknown>>>('/sessions'),
  getSession: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}`),
  createSession: (input: { name: string; config?: Record<string, unknown> }) => request<Record<string, unknown>>('/sessions', { method: 'POST', body: input }),
  startSession: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/start`, { method: 'POST', timeoutMs: 45_000 }),
  stopSession: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/stop`, { method: 'POST' }),
  logoutSession: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/logout`, { method: 'POST', timeoutMs: 45_000 }),
  getQr: (id: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/qr`),
  pairingCode: (id: string, phoneNumber: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/pairing-code`, { method: 'POST', body: { phoneNumber } }),
  listChats: (id: string) => request<Array<Record<string, unknown>>>(`/sessions/${encodeURIComponent(id)}/chats?limit=1000`),
  listMessages: (id: string, chatId?: string, limit = 100) => request<Array<Record<string, unknown>>>(`/sessions/${encodeURIComponent(id)}/messages?limit=${limit}${chatId ? `&chatId=${encodeURIComponent(chatId)}` : ''}`),
  getChatHistory: (id: string, chatId: string, limit = 100, includeMedia = false) => request<Array<Record<string, unknown>>>(`/sessions/${encodeURIComponent(id)}/messages/${encodeURIComponent(chatId)}/history?limit=${Math.max(1, Math.min(limit, 100))}&includeMedia=${includeMedia ? 'true' : 'false'}`, { timeoutMs: includeMedia ? 120_000 : 45_000 }),
  sendText: (id: string, chatId: string, text: string) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-text`, { method: 'POST', body: { chatId, text }, timeoutMs: 45_000 }),
  sendImage: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-image`, { method: 'POST', body: payload, timeoutMs: 90_000 }),
  sendVideo: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-video`, { method: 'POST', body: payload, timeoutMs: 120_000 }),
  sendAudio: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-audio`, { method: 'POST', body: payload, timeoutMs: 120_000 }),
  sendDocument: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-document`, { method: 'POST', body: payload, timeoutMs: 120_000 }),
  sendMedia: (id: string, type: string, chatId: string, media: Record<string, unknown>, caption?: string) => {
    const payload = { chatId, ...media, caption: caption || media.caption || undefined }
    if (type === 'image') return request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-image`, { method: 'POST', body: payload, timeoutMs: 90_000 })
    if (type === 'video') return request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-video`, { method: 'POST', body: payload, timeoutMs: 120_000 })
    if (type === 'audio') return request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-audio`, { method: 'POST', body: payload, timeoutMs: 120_000 })
    if (type === 'voice') return request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-audio`, { method: 'POST', body: { ...payload, ptt: true }, timeoutMs: 120_000 })
    if (type === 'document') return request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-document`, { method: 'POST', body: payload, timeoutMs: 120_000 })
    throw new OpenWAError(`UNSUPPORTED_MEDIA_TYPE:${type}`, 422)
  },
  sendBulk: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/messages/send-bulk`, { method: 'POST', body: payload, timeoutMs: 60_000 }),
  createWebhook: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/sessions/${encodeURIComponent(id)}/webhooks`, { method: 'POST', body: payload }),
  listWebhooks: (id: string) => request<Array<Record<string, unknown>>>(`/sessions/${encodeURIComponent(id)}/webhooks`),
}
