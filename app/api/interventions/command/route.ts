import { NextResponse } from 'next/server'
import { getInterventionsState } from '@/lib/interventions/repository'

export async function GET() {
  const state = await getInterventionsState()
  return NextResponse.json({ ok: true, ...state })
}
