import { NextResponse } from 'next/server'
import { getPublicAngelcare360Error } from '@/lib/angelcare360/server/public-error'

export function operatorJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status })
}

export async function readOperatorBody<T = Record<string, unknown>>(request: Request) {
  return (await request.json().catch(() => null)) as T | null
}

export function operatorRouteError(error: unknown) {
  const internalMessage = error instanceof Error ? error.message : ''
  const status = /accès opérateur/i.test(internalMessage) ? 403 : 500
  const publicError = getPublicAngelcare360Error(error)
  return operatorJson({ ok: false, error: publicError.message, reference: publicError.reference }, status)
}
