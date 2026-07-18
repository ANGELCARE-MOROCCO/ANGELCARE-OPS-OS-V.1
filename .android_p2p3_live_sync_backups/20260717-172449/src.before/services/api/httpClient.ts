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

type JsonInit = Omit<RequestInit, 'body'> & {
  body?: unknown
}

function buildUrl(endpoint: string) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

function normalizeBody(body: unknown) {
  if (body == null) return undefined
  if (typeof body === 'string' || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || body instanceof ArrayBuffer || ArrayBuffer.isView(body as ArrayBufferView)) {
    return body
  }
  return JSON.stringify(body)
}

async function parseResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export async function requestJson<T = unknown>(endpoint: string, init: JsonInit = {}): Promise<HttpResult<T>> {
  const url = buildUrl(endpoint)
  const headers = new Headers(init.headers as HeadersInit | undefined)
  const session = getSessionSnapshot()
  const token = session?.token?.trim()

  if (token && url.startsWith(API_BASE_URL)) {
    headers.set('Cookie', `angelcare_ops_session=${token}`)
  }

  headers.set('Accept', 'application/json')

  if (init.body != null && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      body: normalizeBody(init.body) as any,
    })

    const data = await parseResponse<T>(response)
    return {
      ok: response.ok,
      status: response.status,
      endpoint,
      url,
      data,
      error: response.ok ? null : `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      endpoint,
      url,
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export async function healthCheck() {
  return requestJson<{ok?: boolean; service?: string; mode?: string; mobileRoute?: string}>('/api/carelink/health', {
    method: 'GET',
  })
}

export {buildUrl as apiUrl}
