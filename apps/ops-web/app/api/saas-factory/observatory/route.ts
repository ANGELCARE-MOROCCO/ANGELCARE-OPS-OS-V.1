import { NextResponse } from 'next/server'
import { getObservatoryState } from '@/lib/saas-factory/observatory'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getObservatoryState('load'))
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown Observatory error' }, { status: 500 })
  }
}
