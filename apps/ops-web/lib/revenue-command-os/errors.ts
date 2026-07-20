export type RevenueOsErrorCode =
  | 'REVENUE_OS_NOT_CONFIGURED'
  | 'REVENUE_OS_PERMISSION_DENIED'
  | 'REVENUE_OS_INVALID_INPUT'
  | 'REVENUE_OS_STORAGE_FAILURE'
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
