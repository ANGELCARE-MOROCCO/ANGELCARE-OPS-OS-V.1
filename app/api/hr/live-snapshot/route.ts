import { NextResponse } from 'next/server'
import { buildHROperationalSnapshot } from '@/lib/hr-production/operations'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const snapshot = await buildHROperationalSnapshot('live_snapshot')
    return NextResponse.json(snapshot)
  } catch (error: any) {
    return NextResponse.json({ ok: false, sourceConfidence: 'fallback', error: error?.message || 'Unable to build HR live snapshot.' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const snapshot = await buildHROperationalSnapshot('refresh')
    return NextResponse.json(snapshot)
  } catch (error: any) {
    return NextResponse.json({ ok: false, sourceConfidence: 'fallback', error: error?.message || 'Unable to refresh HR snapshot.' }, { status: 500 })
  }
}
