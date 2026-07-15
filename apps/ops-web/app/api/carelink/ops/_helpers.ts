import { NextResponse } from 'next/server'

const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }

export function opsJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers })
}

export function opsError(error: unknown, fallback = 'Erreur CareLink Ops', status = 500) {
  return opsJson(
    {
      ok: false,
      error: error instanceof Error ? error.message : fallback,
    },
    status,
  )
}

export async function readJsonBody(request: Request) {
  return request.json().catch(() => ({}))
}
