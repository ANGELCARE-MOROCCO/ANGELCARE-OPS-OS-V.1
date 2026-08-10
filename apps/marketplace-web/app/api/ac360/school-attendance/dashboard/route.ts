import { NextResponse } from 'next/server'
import { getAc360SchoolAttendanceDashboard } from '@/lib/ac360/school-attendance'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const result = await getAc360SchoolAttendanceDashboard(
    url.searchParams.get('orgId') || undefined,
    url.searchParams.get('campusId'),
    url.searchParams.get('operationDate'),
  )
  return json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}
