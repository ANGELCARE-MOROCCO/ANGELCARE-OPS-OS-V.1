import { NextResponse } from 'next/server'
import type { ApiFailure, ApiSuccess } from '../domain/types'
import { asMarketplaceError, MarketplaceError } from './errors'

export function requestId(request?: Request): string {
  return request?.headers.get('x-request-id') || crypto.randomUUID()
}

export function apiSuccess<T>(
  data: T,
  options?: {
    requestId?: string
    status?: number
    meta?: ApiSuccess<T>['meta']
  },
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      data,
      ...(options?.meta ? { meta: options.meta } : {}),
      requestId: options?.requestId || crypto.randomUUID(),
    },
    { status: options?.status || 200 },
  )
}

export function apiFailure(error: unknown, explicitRequestId?: string): NextResponse<ApiFailure> {
  const normalized = asMarketplaceError(error)
  return NextResponse.json(
    {
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.fieldErrors ? { fieldErrors: normalized.fieldErrors } : {}),
        retryable: normalized.retryable,
      },
      requestId: explicitRequestId || crypto.randomUUID(),
    },
    { status: normalized.status },
  )
}

export async function parseJsonObject(request: Request): Promise<Record<string, unknown>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le corps JSON de la requête est invalide.')
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Un objet JSON est requis.')
  }
  return body as Record<string, unknown>
}

export function cleanText(value: unknown, max = 500): string {
  return String(value ?? '').trim().slice(0, max)
}

export function cleanOptionalText(value: unknown, max = 500): string | null {
  const text = cleanText(value, max)
  return text || null
}

export function requireText(
  value: unknown,
  field: string,
  label: string,
  max = 200,
): string {
  const text = cleanText(value, max)
  if (!text) {
    throw new MarketplaceError('VALIDATION_ERROR', `${label} est requis.`, {
      fieldErrors: { [field]: [`${label} est requis.`] },
    })
  }
  return text
}
