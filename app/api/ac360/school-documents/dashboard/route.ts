import { NextResponse } from 'next/server'
import { getAc360SchoolDocumentsDashboard } from '@/lib/ac360/school-documents'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const result = await getAc360SchoolDocumentsDashboard(searchParams.get('orgId') || undefined, searchParams.get('campusId'), searchParams.get('asOfDate'))
  return json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}
