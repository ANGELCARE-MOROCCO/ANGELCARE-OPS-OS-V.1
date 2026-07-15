import { NextResponse } from 'next/server'
import { resolveAc360Phase2TAlert } from '@/lib/ac360/phase2-build-hardening'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await resolveAc360Phase2TAlert(body)
  return json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}
