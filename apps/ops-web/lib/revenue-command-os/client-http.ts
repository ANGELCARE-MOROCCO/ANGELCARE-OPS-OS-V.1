export interface RevenueOsClientErrorBody {
  code?: string
  message?: string
  traceId?: string
  recoverable?: boolean
}

export interface RevenueOsClientEnvelope<T> {
  ok: boolean
  data?: T
  error?: RevenueOsClientErrorBody
  meta?: Record<string, unknown>
  externalActionsExecuted?: number
}

export class RevenueOsClientError extends Error {
  readonly code: string
  readonly traceId?: string
  readonly status: number
  readonly recoverable: boolean

  constructor(
    message: string,
    options: { code?: string; traceId?: string; status?: number; recoverable?: boolean } = {},
  ) {
    super(message)
    this.name = 'RevenueOsClientError'
    this.code = options.code ?? 'REVENUE_OS_CLIENT_FAILURE'
    this.traceId = options.traceId
    this.status = options.status ?? 500
    this.recoverable = options.recoverable ?? this.status >= 500
  }
}

function traceFrom(response: Response, payload?: RevenueOsClientEnvelope<unknown>): string | undefined {
  return payload?.error?.traceId || response.headers.get('x-revenue-trace-id') || undefined
}

function messageWithTrace(message: string, traceId?: string): string {
  return traceId ? `${message} · Référence ${traceId}` : message
}

export function publicRevenueOsClientMessage(message: string): string {
  const value = String(message || '').trim()
  const lower = value.toLowerCase()

  if (!value) return 'Une erreur empêche le chargement de données suffisamment fiables.'
  if (lower.includes('unexpected end of json') || lower.includes('json input')) {
    return 'La réponse du service Revenue OS est incomplète. Réessayez.'
  }
  if (lower.includes('functions cannot be passed directly to client components')) {
    return 'L’expérience stratégique ne peut pas être affichée dans son état actuel.'
  }
  if (lower.includes('schema cache') || lower.includes('could not find the table') || lower.includes('relation') && lower.includes('does not exist')) {
    return 'Une source de données Revenue OS requise n’est pas encore disponible.'
  }
  if (lower.includes('invalid api key') || lower.includes('secret api key required')) {
    return 'La connexion serveur Revenue OS n’est pas correctement configurée.'
  }
  if (/public\.|select |insert |update |delete |pgrst|postgres|supabase|client components|server components|syntaxerror|stack/i.test(value)) {
    return 'Le service Revenue OS rencontre une indisponibilité technique.'
  }
  return value
}

export async function readRevenueOsResponse<T>(
  response: Response,
  fallbackMessage = 'Le service Revenue OS n’a pas pu terminer la demande.',
): Promise<RevenueOsClientEnvelope<T>> {
  const text = await response.text()

  if (!text.trim()) {
    if (response.ok && (response.status === 204 || response.status === 205)) {
      return { ok: true }
    }

    const traceId = response.headers.get('x-revenue-trace-id') || undefined
    throw new RevenueOsClientError(
      messageWithTrace('La réponse du service Revenue OS est incomplète. Réessayez.', traceId),
      { status: response.status || 502, traceId, code: 'REVENUE_OS_EMPTY_RESPONSE' },
    )
  }

  let payload: RevenueOsClientEnvelope<T>
  try {
    payload = JSON.parse(text) as RevenueOsClientEnvelope<T>
  } catch {
    const traceId = response.headers.get('x-revenue-trace-id') || undefined
    throw new RevenueOsClientError(
      messageWithTrace('La réponse du service Revenue OS est illisible. Réessayez.', traceId),
      { status: response.status || 502, traceId, code: 'REVENUE_OS_MALFORMED_RESPONSE' },
    )
  }

  if (!response.ok || payload.ok === false) {
    const traceId = traceFrom(response, payload)
    const message = payload.error?.message || fallbackMessage
    throw new RevenueOsClientError(messageWithTrace(message, traceId), {
      code: payload.error?.code,
      traceId,
      status: response.status,
      recoverable: payload.error?.recoverable,
    })
  }

  return payload
}

export async function fetchRevenueOsJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: { timeoutMs?: number; fallbackMessage?: string } = {},
): Promise<RevenueOsClientEnvelope<T>> {
  const timeoutMs = Math.max(1000, options.timeoutMs ?? 20000)
  const controller = new AbortController()
  const externalSignal = init.signal
  const timer = globalThis.setTimeout(() => controller.abort('timeout'), timeoutMs)

  const abortFromExternal = () => controller.abort('cancelled')
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true })

  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    return await readRevenueOsResponse<T>(response, options.fallbackMessage)
  } catch (error) {
    if (error instanceof RevenueOsClientError) throw error
    if (controller.signal.aborted) {
      throw new RevenueOsClientError('Le service Revenue OS n’a pas répondu dans le délai prévu.', {
        code: 'REVENUE_OS_REQUEST_TIMEOUT',
        status: 504,
        recoverable: true,
      })
    }
    throw new RevenueOsClientError('Le service Revenue OS est momentanément indisponible.', {
      code: 'REVENUE_OS_NETWORK_FAILURE',
      status: 503,
      recoverable: true,
    })
  } finally {
    globalThis.clearTimeout(timer)
    externalSignal?.removeEventListener('abort', abortFromExternal)
  }
}
