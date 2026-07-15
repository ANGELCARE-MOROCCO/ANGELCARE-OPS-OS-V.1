import { NextResponse } from 'next/server'
import { getAc360SchoolFinanceDashboard } from '@/lib/ac360/school-finance'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const result = await getAc360SchoolFinanceDashboard(
    url.searchParams.get('orgId') || undefined,
    url.searchParams.get('campusId'),
    url.searchParams.get('asOfDate') || url.searchParams.get('as_of_date'),
  )
  return json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}
