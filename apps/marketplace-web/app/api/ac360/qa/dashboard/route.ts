import { NextResponse } from 'next/server'
import { getAc360FoundationQualityDashboard } from '@/lib/ac360/phase1f-quality-gate'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const orgId = url.searchParams.get('orgId') || undefined
  const result = await getAc360FoundationQualityDashboard(orgId)
  return json(result, { status: result.ok === false ? 500 : 200 })
}
