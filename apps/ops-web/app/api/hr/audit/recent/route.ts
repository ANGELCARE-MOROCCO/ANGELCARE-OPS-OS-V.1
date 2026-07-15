import { NextResponse } from 'next/server'
import { getHRRecentAudit } from '@/lib/hr-production/operations'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') || 50)
    return NextResponse.json(await getHRRecentAudit(limit))
  } catch (error: any) {
    return NextResponse.json({ ok: false, sourceConfidence: 'fallback', error: error?.message || 'Unable to load HR audit activity.' }, { status: 500 })
  }
}
