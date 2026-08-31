import { randomUUID } from 'node:crypto'

const SAFE_CUSTOMER_ERRORS = [
  /vous devez être connecté/i,
  /autorisation requise/i,
  /accès opérateur/i,
  /n(?:’|')est pas inclus/i,
  /hors du périmètre/i,
  /capacité atteinte/i,
]

export type Angelcare360PublicError = {
  message: string
  reference: string
}

function referenceId() {
  return `SAN-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`
}

/**
 * Converts an internal exception into calm, non-technical customer copy while
 * retaining a correlation reference in server logs for AngelCare support.
 */
export function getPublicAngelcare360Error(error: unknown): Angelcare360PublicError {
  const reference = referenceId()
  const internalMessage = error instanceof Error ? error.message : String(error || 'Unknown error')
  const safeMessage = SAFE_CUSTOMER_ERRORS.some((pattern) => pattern.test(internalMessage))
    ? internalMessage
    : `Le service ne peut pas terminer cette action pour le moment. Référence ${reference}.`

  console.error('[SANILA_API_ERROR]', {
    reference,
    name: error instanceof Error ? error.name : 'UnknownError',
    message: internalMessage,
    stack: error instanceof Error ? error.stack : undefined,
  })

  return { message: safeMessage, reference }
}

export function publicAngelcare360Error(error: unknown) {
  return getPublicAngelcare360Error(error).message
}
