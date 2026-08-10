import { NextResponse } from 'next/server'
import { completeAc360AdmissionVisit } from '@/lib/ac360/school-admissions'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await completeAc360AdmissionVisit(body)
  return json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}
