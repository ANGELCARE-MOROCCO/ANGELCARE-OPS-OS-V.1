import { NextResponse } from 'next/server'
import { convertCandidateToStaff } from '@/lib/hr-production/lifecycle'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  if (!body.candidateId) return NextResponse.json({ ok: false, error: 'candidateId is required' }, { status: 400 })
  const result = await convertCandidateToStaff(body.candidateId)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
