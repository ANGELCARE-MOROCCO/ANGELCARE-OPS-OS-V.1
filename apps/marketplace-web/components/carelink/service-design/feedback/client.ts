export interface ServiceDesignApiEnvelope<T> {
  ok: boolean
  data?: T
  error?: string
  details?: string[]
  correlationId?: string
}

export class ServiceDesignRequestError extends Error {
  status: number
  code: string
  instruction: string
  preserved: string
  correlationId?: string

  constructor(input: { message: string; status?: number; code?: string; instruction?: string; preserved?: string; correlationId?: string }) {
    super(input.message)
    this.name = 'ServiceDesignRequestError'
    this.status = input.status || 500
    this.code = input.code || 'SERVICE_DESIGN_ERROR'
    this.instruction = input.instruction || 'Réessayez. Si le problème continue, rechargez votre session.'
    this.preserved = input.preserved || 'Vos sélections locales ont été conservées.'
    this.correlationId = input.correlationId
  }
}

function isAbort(reason: unknown) {
  if (reason instanceof DOMException && reason.name === 'AbortError') return true
  const text = reason instanceof Error ? `${reason.name} ${reason.message}` : String(reason || '')
  return /abort|aborted|signal is aborted/i.test(text)
}

export function explainServiceDesignError(reason: unknown, fallback: string) {
  if (reason instanceof ServiceDesignRequestError) return reason
  if (isAbort(reason)) return new ServiceDesignRequestError({
    message: 'La composition a été interrompue avant réception du résultat.',
    status: 503,
    code: 'COMPOSITION_ABORTED',
    instruction: 'Cliquez de nouveau sur « Composer ». Le brouillon et vos dates sont déjà conservés.',
    preserved: 'Aucune sélection, date ou heure n’a été supprimée.',
  })
  return new ServiceDesignRequestError({
    message: reason instanceof Error ? reason.message : fallback,
    instruction: 'Réessayez l’action. Si elle échoue encore, rechargez la page puis reprenez depuis le brouillon sauvegardé.',
  })
}

export async function serviceDesignRequest<T>(url: string, init?: RequestInit, options?: { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? 210_000
  const timer = window.setTimeout(() => controller.abort('SERVICE_DESIGN_CLIENT_TIMEOUT'), timeoutMs)
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    })
    const payload = await response.json().catch(() => ({})) as ServiceDesignApiEnvelope<T>
    if (!response.ok || !payload.ok) {
      const status = response.status
      const message = payload.error || `Action impossible (${status}).`
      const instruction = status === 401
        ? 'Reconnectez-vous puis relancez l’action.'
        : status === 403
          ? 'Votre session ne possède pas cette capacité. Rechargez vos droits ou utilisez un compte autorisé.'
          : status === 422 || status === 400
            ? 'Corrigez les champs signalés puis relancez l’action.'
            : status >= 500
              ? 'Réessayez. Si le serveur reste indisponible, rechargez la page; votre brouillon est conservé.'
              : 'Réessayez l’action.'
      throw new ServiceDesignRequestError({ message, status, instruction, correlationId: payload.correlationId })
    }
    return payload.data as T
  } catch (reason) {
    throw explainServiceDesignError(reason, 'Action Service Design impossible.')
  } finally {
    window.clearTimeout(timer)
  }
}
