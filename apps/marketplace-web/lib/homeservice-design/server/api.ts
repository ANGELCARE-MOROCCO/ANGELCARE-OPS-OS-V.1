import { NextResponse } from 'next/server'
import { HsdValidationError } from './validation'

export function correlationId(): string { return crypto.randomUUID() }

export function apiOk(data: unknown, status = 200, id: string = correlationId()) {
  return NextResponse.json({ ok: true, data, correlationId: id }, { status, headers: { 'x-correlation-id': id, 'cache-control': 'no-store' } })
}

export function apiError(error: unknown, fallback = 'Une erreur opérationnelle est survenue.') {
  const id = correlationId()
  const object = error as { status?: number; code?: string; details?: unknown; message?: string }
  const status = object?.status || (error instanceof HsdValidationError ? 422 : 500)
  const message = error instanceof Error ? error.message : fallback
  return NextResponse.json({ ok: false, error: message || fallback, code: object?.code || 'HSD_ERROR', details: object?.details || null, correlationId: id },
    { status, headers: { 'x-correlation-id': id, 'cache-control': 'no-store' } })
}

export async function jsonBody(request: Request) {
  try { return await request.json() } catch { throw Object.assign(new Error('Le corps JSON est invalide.'), { status: 400, code: 'INVALID_JSON' }) }
}
