import 'server-only'
import { randomUUID } from 'node:crypto'

export type RevenueOsErrorCode =
  | 'REVENUE_OS_NOT_CONFIGURED'
  | 'REVENUE_OS_UNAUTHENTICATED'
  | 'REVENUE_OS_PERMISSION_DENIED'
  | 'REVENUE_OS_TENANT_MISSING'
  | 'REVENUE_OS_TENANT_MISMATCH'
  | 'REVENUE_OS_INVALID_INPUT'
  | 'REVENUE_OS_ACTION_NOT_ALLOWED'
  | 'REVENUE_OS_NOT_FOUND'
  | 'REVENUE_OS_CONFLICT'
  | 'REVENUE_OS_STORAGE_FAILURE'
  | 'REVENUE_OS_DEPENDENCY_UNAVAILABLE'
  | 'REVENUE_OS_CONTRACT_LOCKED'
  | 'REVENUE_OS_FEATURE_DISABLED'
  | 'REVENUE_TWIN_INVALID_INPUT'
  | 'REVENUE_TWIN_ACTION_NOT_ALLOWED'
  | 'REVENUE_TWIN_ENTITY_NOT_ALLOWED'
  | 'REVENUE_TWIN_OPERATION_NOT_ALLOWED'
  | 'REVENUE_TWIN_STORAGE_FAILURE'
  | 'REVENUE_TWIN_VALIDATION_STORAGE_FAILURE'
  | 'REVENUE_KNOWLEDGE_INVALID_INPUT'
  | 'REVENUE_KNOWLEDGE_ACTION_NOT_ALLOWED'
  | 'REVENUE_KNOWLEDGE_STORAGE_FAILURE'
  | 'REVENUE_KNOWLEDGE_INDEX_BLOCKED'
  | 'REVENUE_KNOWLEDGE_VALIDATION_STORAGE_FAILURE'
  | 'REVENUE_SIGNAL_INVALID_INPUT'
  | 'REVENUE_SIGNAL_ACTION_NOT_ALLOWED'
  | 'REVENUE_SIGNAL_SOURCE_UNKNOWN'
  | 'REVENUE_SIGNAL_SOURCE_BLOCKED'
  | 'REVENUE_SIGNAL_ADAPTER_MISSING'
  | 'REVENUE_SIGNAL_SCAN_FAILURE'
  | 'REVENUE_SIGNAL_STATUS_INVALID'
  | 'REVENUE_SIGNAL_VALIDATION_STATUS_INVALID'
  | 'REVENUE_SIGNAL_SOURCE_STATUS_INVALID'
  | 'REVENUE_OS_UNKNOWN'
  | (string & {})

export class RevenueOsError extends Error {
  readonly code: RevenueOsErrorCode
  readonly status: number
  readonly recoverable: boolean
  readonly context?: Record<string, unknown>
  readonly traceId: string

  constructor(
    code: RevenueOsErrorCode,
    message: string,
    options: {
      status?: number
      recoverable?: boolean
      context?: Record<string, unknown>
      cause?: unknown
      traceId?: string
    } = {},
  ) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'RevenueOsError'
    this.code = code
    this.status = options.status ?? 500
    this.recoverable = options.recoverable ?? false
    this.context = options.context
    this.traceId = options.traceId ?? randomUUID()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function numberStatus(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 400 && parsed <= 599 ? parsed : undefined
}

function statusFromStructuralError(error: Record<string, unknown>): number {
  const direct = numberStatus(error.status) ?? numberStatus(error.statusCode)
  if (direct) return direct

  const code = String(error.code ?? '').toUpperCase()
  if (code === 'PGRST116') return 404
  if (code === '23505') return 409
  if (code === '23503' || code === '23514' || code === '22P02') return 422
  if (code.startsWith('PGRST') || code.startsWith('42') || code.startsWith('28')) return 503
  return 500
}

export function publicRevenueOsMessage(message: string, code = ''): string {
  const lower = message.toLowerCase()
  const normalizedCode = code.toUpperCase()

  if (lower.includes('unexpected end of json') || lower.includes('json input') || lower.includes('malformed json')) {
    return 'La réponse du service Revenue OS est incomplète. Réessayez.'
  }
  if (
    normalizedCode === '42P01' ||
    lower.includes('schema cache') ||
    lower.includes('could not find the table') ||
    lower.includes('relation') && lower.includes('does not exist')
  ) {
    return 'Une source de données Revenue OS requise n’est pas encore disponible. Vérifiez les migrations du module.'
  }
  if (lower.includes('functions cannot be passed directly to client components')) {
    return 'L’expérience stratégique ne peut pas être affichée dans son état actuel. Une correction d’interface est requise.'
  }
  if (lower.includes('invalid api key') || lower.includes('secret api key required')) {
    return 'La connexion serveur Revenue OS n’est pas correctement configurée.'
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('aborted')) {
    return 'Le service Revenue OS n’a pas répondu dans le délai prévu.'
  }
  if (lower.includes('permission')) return 'Vous ne disposez pas de l’autorisation requise pour cette opération.'
  if (lower.includes('unauthenticated') || lower.includes('authentification')) return 'Votre session doit être renouvelée.'

  const exposesTechnicalDetail = /public\.|select |insert |update |delete |pgrst|postgres|supabase|client components|server components|stack|syntaxerror/i.test(message)
  return exposesTechnicalDetail ? 'Le service Revenue OS rencontre une indisponibilité technique.' : message
}

export function normalizeRevenueOsError(error: unknown): RevenueOsError {
  if (error instanceof RevenueOsError) return error

  if (error instanceof Error) {
    const rawMessage = error.message || 'Erreur Revenue Command OS.'
    const lower = rawMessage.toLowerCase()
    const status = lower.includes('unauthenticated') || lower.includes('authentification')
      ? 401
      : lower.includes('permission_denied') || lower.includes('permission')
        ? 403
        : lower.includes('not_found') || lower.includes('introuvable')
          ? 404
          : lower.includes('conflict') || lower.includes('mismatch') || lower.includes('blocked')
            ? 409
            : lower.includes('invalid') || lower.includes('required')
              ? 422
              : 500

    return new RevenueOsError('REVENUE_OS_UNKNOWN', publicRevenueOsMessage(rawMessage), {
      cause: error,
      status,
      recoverable: status >= 500,
    })
  }

  if (isRecord(error)) {
    const rawMessage = String(
      error.message ?? error.error_description ?? error.details ?? error.hint ?? 'Erreur de stockage Revenue OS.',
    )
    const code = String(error.code ?? error.error ?? 'REVENUE_OS_STORAGE_FAILURE')
    const status = statusFromStructuralError(error)

    return new RevenueOsError('REVENUE_OS_STORAGE_FAILURE', publicRevenueOsMessage(rawMessage, code), {
      status,
      recoverable: status >= 500,
      cause: error,
      context: { storageCode: code },
    })
  }

  return new RevenueOsError('REVENUE_OS_UNKNOWN', 'Erreur Revenue Command OS non identifiée.', {
    context: { rawType: typeof error },
    recoverable: true,
  })
}
