import { NextResponse } from 'next/server'
import { getObservatoryState } from '@/lib/saas-factory/observatory'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const state = await getObservatoryState('probes')
    return NextResponse.json({ ok: true, source: state.source, confidence: state.confidence, generatedAt: state.generatedAt, probes: state.probes })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown Observatory probes error' }, { status: 500 })
  }
}
