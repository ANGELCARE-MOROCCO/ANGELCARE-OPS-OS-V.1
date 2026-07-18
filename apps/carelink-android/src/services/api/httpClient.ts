import {API_BASE_URL} from '../../config/env'
import {getSessionSnapshot} from '../../store/sessionStore'

export type HttpResult<T = unknown> = {
  ok: boolean
  status: number
  endpoint: string
  url: string
  data: T | null
  error: string | null
}

type JsonInit = Omit<RequestInit, 'body'> & {body?: unknown; timeoutMs?: number}

function buildUrl(endpoint: string) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

function normalizeBody(body: unknown) {
  if (body == null) return undefined
  if (typeof body === 'string' || body instanceof FormData || body instanceof URLSearchParams || body instanceof ArrayBuffer || ArrayBuffer.isView(body as ArrayBufferView)) return body
  return JSON.stringify(body)
}

async function parseResponse<T>(response: Response): Promise<T | null> {
  const responseText = await response.text()
  if (!responseText) return null
  try { return JSON.parse(responseText) as T } catch { return responseText as unknown as T }
}

function extractError(data: unknown, fallback: string | null) {
  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>
    for (const key of ['error', 'message', 'detail', 'reason']) {
      if (typeof payload[key] === 'string' && String(payload[key]).trim()) return String(payload[key]).trim()
    }
  }
  return fallback
}

export async function requestJson<T = unknown>(endpoint: string, init: JsonInit = {}): Promise<HttpResult<T>> {
  const url = buildUrl(endpoint)
  const headers = new Headers(init.headers as HeadersInit | undefined)
  const session = getSessionSnapshot()
  const token = session?.token?.trim()
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), init.timeoutMs ?? 25000) : null

  if (token && url.startsWith(API_BASE_URL)) {
    headers.set('Authorization', `Bearer ${token}`)
    headers.set('X-CareLink-Mobile-Session', token)
    headers.set('Cookie', [
      `angelcare_ops_session=${token}`,
      `carelink_mobile_session=${token}`,
      `carelink_agent_session=${token}`,
      `carelink_session=${token}`,
      `opsos_session=${token}`,
    ].join('; '))
  }

  headers.set('Accept', 'application/json')
  if (init.body != null && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  try {
    const response = await fetch(url, {...init, signal: controller?.signal, headers, body: normalizeBody(init.body) as any})
    if (timer) clearTimeout(timer)
    const data = await parseResponse<T>(response)
    return {ok: response.ok, status: response.status, endpoint, url, data, error: response.ok ? null : extractError(data, `HTTP ${response.status}`)}
  } catch (error) {
    if (timer) clearTimeout(timer)
    return {ok: false, status: 0, endpoint, url, data: null, error: error instanceof Error ? error.message : 'Network error'}
  }
}

export async function healthCheck() {
  return requestJson<{ok?: boolean; service?: string; mode?: string; mobileRoute?: string}>('/api/carelink/health', {method: 'GET'})
}

export {buildUrl as apiUrl}
