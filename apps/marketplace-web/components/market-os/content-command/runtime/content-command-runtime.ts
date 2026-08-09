"use client"

export type ContentCommandRecoveryInstruction = {
  key: string
  label: string
  description?: string
  href?: string
}

export type ContentCommandBlockerPayload = {
  code: string
  technical: string
  message: string
  status: number
  kind: string
  title: string
  recoverable: boolean
  recovery: ContentCommandRecoveryInstruction[]
  details?: unknown
  url?: string
  context?: string
}

type ApiPayload = {
  ok?: boolean
  error?: string
  code?: string
  message?: string
  status?: number
  blocker?: {
    kind?: string
    title?: string
    recoverable?: boolean
    recovery?: ContentCommandRecoveryInstruction[]
  }
  details?: unknown
  [key: string]: unknown
}

const BUSINESS_CODES = [
  'ACTION_BLOCKED', 'DEPENDENCY_BLOCKED', 'PERMISSION_DENIED', 'AUTHENTICATION_REQUIRED',
  'RECORD_PROTECTED', 'CONFLICT_RETRY', 'VALIDATION_REQUIRED', 'CONFIRMATION_REQUIRED',
  'CAPABILITY_UNAVAILABLE', 'RECORD_NOT_FOUND', 'FORBIDDEN', 'UNAUTHENTICATED',
]

function fallbackMessage(code: string, technical: string) {
  if (code === 'DEPENDENCY_BLOCKED' || technical.startsWith('ACTION_BLOCKED')) return 'Des dépendances doivent être résolues avant de poursuivre.'
  if (code === 'PERMISSION_DENIED' || technical === 'FORBIDDEN') return 'Votre autorité ne permet pas cette action.'
  if (code === 'VALIDATION_REQUIRED') return 'Des informations obligatoires doivent être complétées.'
  if (code === 'RECORD_PROTECTED') return 'Cet historique est protégé. Utilisez une action réversible ou une supersession.'
  if (code === 'CAPABILITY_UNAVAILABLE') return 'La capacité est indisponible. Une continuation manuelle ou un fournisseur alternatif reste possible.'
  if (code === 'RECORD_NOT_FOUND') return 'L’objet demandé n’est plus disponible.'
  return technical || 'Action impossible.'
}

export class ContentCommandRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly kind: string
  readonly title: string
  readonly recoverable: boolean
  readonly recovery: ContentCommandRecoveryInstruction[]
  readonly details?: unknown
  readonly url?: string
  readonly technical: string

  constructor(blocker: ContentCommandBlockerPayload) {
    super(blocker.message)
    this.name = 'ContentCommandRequestError'
    this.status = blocker.status
    this.code = blocker.code
    this.kind = blocker.kind
    this.title = blocker.title
    this.recoverable = blocker.recoverable
    this.recovery = blocker.recovery
    this.details = blocker.details
    this.url = blocker.url
    this.technical = blocker.technical
  }

  toPayload(context?: string): ContentCommandBlockerPayload {
    return {
      code: this.code,
      technical: this.technical,
      message: this.message,
      status: this.status,
      kind: this.kind,
      title: this.title,
      recoverable: this.recoverable,
      recovery: this.recovery,
      details: this.details,
      url: this.url,
      context,
    }
  }
}

export function toContentCommandBlocker(error: unknown, context?: string): ContentCommandBlockerPayload {
  if (error instanceof ContentCommandRequestError) return error.toPayload(context)
  const technical = error instanceof Error ? error.message : String(error || 'UNKNOWN_ERROR')
  const known = BUSINESS_CODES.find((code) => technical.includes(code))
  const code = known || (technical.startsWith('ACTION_BLOCKED') ? 'DEPENDENCY_BLOCKED' : 'SYSTEM_FAILURE')
  return {
    code,
    technical,
    message: fallbackMessage(code, technical),
    status: code === 'SYSTEM_FAILURE' ? 500 : 409,
    kind: code === 'DEPENDENCY_BLOCKED' ? 'dependency' : code === 'PERMISSION_DENIED' ? 'permission' : code === 'VALIDATION_REQUIRED' ? 'validation' : code === 'CAPABILITY_UNAVAILABLE' ? 'provider' : 'system',
    title: code === 'DEPENDENCY_BLOCKED' ? 'Dépendances à résoudre' : code === 'SYSTEM_FAILURE' ? 'Incident technique' : 'Action à compléter',
    recoverable: code !== 'SYSTEM_FAILURE',
    recovery: code === 'DEPENDENCY_BLOCKED'
      ? [{ key: 'inspect', label: 'Inspecter les dépendances', href: '/market-os/content-command-center/record-governance' }, { key: 'close', label: 'Revenir sans modifier' }]
      : [{ key: 'retry', label: 'Actualiser et réessayer' }, { key: 'close', label: 'Revenir sans modifier' }],
    context,
  }
}

export function emitContentCommandBlocker(error: unknown, context?: string) {
  if (typeof window === 'undefined') return
  const payload = toContentCommandBlocker(error, context)
  window.dispatchEvent(new CustomEvent<ContentCommandBlockerPayload>('content-command:blocker', { detail: payload }))
}

export function contentCommandErrorMessage(error: unknown) {
  return toContentCommandBlocker(error).message
}

export function isExpectedContentCommandError(error: unknown) {
  // Every HTTP/API failure produced by the governed request client is already
  // classified and renderable. It must never escape as a Next.js runtime crash.
  if (error instanceof ContentCommandRequestError) return true
  const message = error instanceof Error ? error.message : String(error || '')
  return BUSINESS_CODES.some((code) => message.includes(code)) || message.startsWith('ACTION_BLOCKED')
}

export async function contentCommandRequest<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {})
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(url, { credentials: 'include', cache: 'no-store', ...init, headers })
  const payload = await response.json().catch(() => ({})) as ApiPayload
  if (!response.ok || payload.ok === false) {
    const technical = String(payload.error || payload.code || `HTTP_${response.status}`)
    const code = String(payload.code || (technical.startsWith('ACTION_BLOCKED') ? 'DEPENDENCY_BLOCKED' : technical))
    const inferredKind = response.status === 401 ? 'authority'
      : response.status === 403 ? 'permission'
      : response.status === 404 ? 'not_found'
      : response.status === 409 ? (code.includes('DEPENDENCY') || technical.startsWith('ACTION_BLOCKED') ? 'dependency' : 'conflict')
      : response.status === 400 || response.status === 413 || response.status === 422 ? 'validation'
      : response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504 ? 'provider'
      : 'system'
    const inferredRecovery: ContentCommandRecoveryInstruction[] = inferredKind === 'dependency'
      ? [{ key: 'inspect', label: 'Inspecter les dépendances', href: '/market-os/content-command-center/record-governance' }, { key: 'close', label: 'Revenir sans modifier' }]
      : inferredKind === 'permission' || inferredKind === 'authority'
        ? [{ key: 'governance', label: 'Ouvrir la gouvernance', href: '/market-os/content-command-center/record-governance' }, { key: 'close', label: 'Revenir sans modifier' }]
        : inferredKind === 'provider'
          ? [{ key: 'providers', label: 'Contrôler les fournisseurs', href: '/market-os/content-command-center/ai-director/integrations' }, { key: 'manual', label: 'Continuer manuellement' }]
          : inferredKind === 'not_found'
            ? [{ key: 'home', label: 'Retour au Commandement', href: '/market-os/content-command-center' }, { key: 'close', label: 'Revenir sans modifier' }]
            : [{ key: 'retry', label: 'Actualiser et réessayer' }, { key: 'close', label: 'Revenir sans modifier' }]
    const blocker: ContentCommandBlockerPayload = {
      code,
      technical,
      message: String(payload.message || fallbackMessage(code, technical)),
      status: Number(payload.status || response.status),
      kind: String(payload.blocker?.kind || inferredKind),
      title: String(payload.blocker?.title || (inferredKind === 'dependency' ? 'Dépendances à résoudre' : inferredKind === 'permission' || inferredKind === 'authority' ? 'Autorité requise' : inferredKind === 'provider' ? 'Capacité indisponible' : inferredKind === 'validation' ? 'Informations à compléter' : inferredKind === 'not_found' ? 'Objet introuvable' : 'Action impossible')),
      recoverable: payload.blocker?.recoverable !== false,
      recovery: Array.isArray(payload.blocker?.recovery) && payload.blocker?.recovery?.length ? payload.blocker.recovery : inferredRecovery,
      details: payload.details,
      url,
    }
    const error = new ContentCommandRequestError(blocker)
    emitContentCommandBlocker(error, `${init?.method || 'GET'} ${url}`)
    throw error
  }
  return payload as T
}
