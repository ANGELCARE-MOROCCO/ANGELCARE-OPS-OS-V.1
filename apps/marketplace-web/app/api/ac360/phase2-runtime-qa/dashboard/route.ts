import { NextResponse } from 'next/server'
import { getAc360Phase2RuntimeQaDashboard } from '@/lib/ac360/phase2-runtime-qa'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const result = await getAc360Phase2RuntimeQaDashboard(searchParams.get('orgId') || undefined)
  return json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}
