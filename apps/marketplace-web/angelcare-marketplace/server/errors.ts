export type MarketplaceErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'FORBIDDEN'
  | 'SCOPE_MISMATCH'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'DATA_INTEGRITY'
  | 'NOT_READY'
  | 'INVALID_STATE_TRANSITION'
  | 'DEPENDENCY_BLOCKED'
  | 'FEATURE_DISABLED'
  | 'CONFIGURATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

const STATUS_BY_CODE: Record<MarketplaceErrorCode, number> = {
  VALIDATION_ERROR: 400,
  AUTHENTICATION_REQUIRED: 401,
  PERMISSION_DENIED: 403,
  FORBIDDEN: 403,
  SCOPE_MISMATCH: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  DATA_INTEGRITY: 409,
  NOT_READY: 409,
  INVALID_STATE_TRANSITION: 409,
  DEPENDENCY_BLOCKED: 409,
  FEATURE_DISABLED: 403,
  CONFIGURATION_ERROR: 503,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
}

export class MarketplaceError extends Error {
  readonly code: MarketplaceErrorCode
  readonly status: number
  readonly retryable: boolean
  readonly fieldErrors?: Record<string, string[]>

  constructor(
    code: MarketplaceErrorCode,
    message: string,
    options?: {
      status?: number
      retryable?: boolean
      fieldErrors?: Record<string, string[]>
      cause?: unknown
    },
  ) {
    super(message, { cause: options?.cause })
    this.name = 'MarketplaceError'
    this.code = code
    this.status = options?.status ?? STATUS_BY_CODE[code]
    this.retryable = options?.retryable ?? (code === 'INTERNAL_ERROR' || code === 'CONFIGURATION_ERROR')
    this.fieldErrors = options?.fieldErrors
  }
}

export function asMarketplaceError(error: unknown): MarketplaceError {
  if (error instanceof MarketplaceError) return error
  return new MarketplaceError(
    'INTERNAL_ERROR',
    'Une erreur interne a empêché l’exécution. La référence de la requête permet le suivi.',
    { cause: error, retryable: true },
  )
}
