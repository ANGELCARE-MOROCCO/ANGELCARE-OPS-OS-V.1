import { NextResponse } from 'next/server'
import { getAc360Phase2UFinalLockDashboard } from '@/lib/ac360/phase2-final-lock'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function GET(request: Request) {
  void request
  const result = await getAc360Phase2UFinalLockDashboard(undefined)
  return json(result, { status: (result as any).ok === false ? ((result as any).status || 500) : 200 })
}
