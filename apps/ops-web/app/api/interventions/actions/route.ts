import { NextResponse } from 'next/server'
import { executeInterventionAction } from '@/lib/interventions/repository'

export async function POST(request: Request) {
  const payload = await request.json()
  const result = await executeInterventionAction(payload)
  return NextResponse.json(result)
}
