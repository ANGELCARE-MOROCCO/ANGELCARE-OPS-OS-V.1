import { NextResponse } from 'next/server'

export function operatorJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status })
}

export async function readOperatorBody<T = Record<string, unknown>>(request: Request) {
  return (await request.json().catch(() => null)) as T | null
}

export function operatorRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erreur inattendue'
  const status = error instanceof Error && /accès opérateur/i.test(message) ? 403 : 500
  return operatorJson({ ok: false, error: message }, status)
}
