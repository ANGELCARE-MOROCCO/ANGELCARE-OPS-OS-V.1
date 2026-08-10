import { NextResponse } from 'next/server'
import { resolveAc360Phase2UAlert } from '@/lib/ac360/phase2-final-lock'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await resolveAc360Phase2UAlert(body)
  return json(result, { status: (result as any).ok === false ? ((result as any).status || 500) : 200 })
}
