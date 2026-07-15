import { NextResponse } from 'next/server'
import { getObservatoryState } from '@/lib/saas-factory/observatory'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getObservatoryState('refresh'))
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown Observatory refresh error' }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
