const STATUS_MESSAGES: Record<number, string> = {
  400: 'La demande est incomplète ou incorrecte.',
  401: 'Votre session a expiré. Reconnectez-vous pour continuer.',
  403: 'Vous ne disposez pas de l’autorisation requise.',
  404: 'La ressource demandée est introuvable.',
  409: 'Cette action entre en conflit avec une modification récente.',
  422: 'Certaines informations doivent être corrigées.',
  429: 'Trop de demandes ont été envoyées. Réessayez dans quelques instants.',
  500: 'Le service ne peut pas terminer cette action pour le moment.',
  502: 'Un service nécessaire est momentanément indisponible.',
  503: 'Le service est temporairement indisponible.',
  504: 'Le service met trop de temps à répondre.',
}

function statusMessage(status: number) {
  return STATUS_MESSAGES[status] || (status >= 500
    ? 'Le service est temporairement indisponible.'
    : 'Cette action ne peut pas être terminée.')
}

export class Angelcare360RequestError extends Error {
  status: number
  reference: string | null

  constructor(message: string, status = 500, reference: string | null = null) {
    super(reference && !message.includes(reference) ? `${message} Référence ${reference}.` : message)
    this.name = 'Angelcare360RequestError'
    this.status = status
    this.reference = reference
  }
}

/** Safely parses SANILA responses without exposing HTML, malformed JSON or backend details. */
export async function readAngelcare360Json<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Angelcare360RequestError(statusMessage(response.status || 502), response.status || 502)
  }

  let body: unknown
  try {
    const text = await response.text()
    if (!text.trim()) {
      if (response.ok) return undefined as T
      throw new Angelcare360RequestError(statusMessage(response.status), response.status)
    }
    body = JSON.parse(text)
  } catch (error) {
    if (error instanceof Angelcare360RequestError) throw error
    throw new Angelcare360RequestError(statusMessage(response.status || 502), response.status || 502)
  }

  if (!response.ok) {
    const record = body && typeof body === 'object' ? body as Record<string, unknown> : {}
    const reference = typeof record.reference === 'string' ? record.reference : null
    throw new Angelcare360RequestError(statusMessage(response.status), response.status, reference)
  }

  return body as T
}

export async function requestAngelcare360Json<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(input, { ...init, signal: init.signal || controller.signal })
    return await readAngelcare360Json<T>(response)
  } catch (error) {
    if (error instanceof Angelcare360RequestError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Angelcare360RequestError('Le service met trop de temps à répondre. Réessayez.', 504)
    }
    throw new Angelcare360RequestError('La connexion au service a été interrompue. Réessayez.', 503)
  } finally {
    clearTimeout(timeout)
  }
}
