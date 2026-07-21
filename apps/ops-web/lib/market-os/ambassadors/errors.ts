import type { AmbassadorServiceErrorCode } from "./contracts"

export class AmbassadorServiceError extends Error {
  readonly code: AmbassadorServiceErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(code: AmbassadorServiceErrorCode, message: string, status: number, details?: unknown) {
    super(message)
    this.name = "AmbassadorServiceError"
    this.code = code
    this.status = status
    this.details = details
  }
}

export function asAmbassadorServiceError(error: unknown): AmbassadorServiceError {
  if (error instanceof AmbassadorServiceError) return error
  return new AmbassadorServiceError(
    "PERSISTENCE_ERROR",
    error instanceof Error ? error.message : "Ambassador operation failed",
    500,
  )
}
