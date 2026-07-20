export type RevenueOsErrorCode =
  | 'REVENUE_OS_NOT_CONFIGURED'
  | 'REVENUE_OS_PERMISSION_DENIED'
  | 'REVENUE_OS_INVALID_INPUT'
  | 'REVENUE_OS_STORAGE_FAILURE'
  | 'REVENUE_OS_CONTRACT_LOCKED'
  | 'REVENUE_OS_FEATURE_DISABLED'
  | 'REVENUE_OS_UNKNOWN'

export class RevenueOsError extends Error {
  readonly code: RevenueOsErrorCode
  readonly status: number
  readonly recoverable: boolean
  readonly context?: Record<string, unknown>

  constructor(
    code: RevenueOsErrorCode,
    message: string,
    options: { status?: number; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'RevenueOsError'
    this.code = code
    this.status = options.status ?? 500
    this.recoverable = options.recoverable ?? false
    this.context = options.context
  }
}

export function normalizeRevenueOsError(error: unknown) {
  if (error instanceof RevenueOsError) return error
  if (error instanceof Error) {
    return new RevenueOsError('REVENUE_OS_UNKNOWN', error.message, {
      cause: error,
      recoverable: true,
    })
  }
  return new RevenueOsError('REVENUE_OS_UNKNOWN', 'Erreur Revenue Command OS non identifiée.', {
    context: { raw: String(error) },
    recoverable: true,
  })
}
