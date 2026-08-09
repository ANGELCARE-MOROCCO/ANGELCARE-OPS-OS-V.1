"use client"

interface ApiEnvelope<T> {
  data?: T
  error?: {
    code?: string
    message?: string
    fieldErrors?: Record<string, string[]>
  }
  requestId?: string
}

export class TerritoryClientError extends Error {
  readonly code: string
  readonly fieldErrors: Record<string, string[]>
  readonly requestId: string | null

  constructor(message: string, options?: { code?: string; fieldErrors?: Record<string, string[]>; requestId?: string }) {
    super(message)
    this.name = 'TerritoryClientError'
    this.code = options?.code || 'CLIENT_ERROR'
    this.fieldErrors = options?.fieldErrors || {}
    this.requestId = options?.requestId || null
  }
}

export async function territoryRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({})) as ApiEnvelope<T>
  if (!response.ok || payload.error) {
    throw new TerritoryClientError(payload.error?.message || 'Territory OS n’a pas pu exécuter cette action.', {
      code: payload.error?.code,
      fieldErrors: payload.error?.fieldErrors,
      requestId: payload.requestId,
    })
  }
  if (typeof payload.data === 'undefined') throw new TerritoryClientError('La réponse Territory OS est incomplète.')
  return payload.data
}
