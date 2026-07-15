import { NextRequest, NextResponse } from 'next/server'
import { buildHRDomainLiveState } from '@/lib/hr-production/live-sync'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get('domain') || 'hr'
    const state = await buildHRDomainLiveState(domain)
    return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to build HR realtime state.' }, { status: 500 })
  }
}
