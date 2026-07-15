import { NextResponse } from 'next/server'
import { readOpsosLiveTelemetry } from '@/lib/opsos-control-plane/live-telemetry'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(2000, Math.max(50, Number(url.searchParams.get('limit') || 500)))
  const snapshot = await readOpsosLiveTelemetry(limit)

  return NextResponse.json(snapshot, {
    headers: {
      'cache-control': 'no-store',
    },
  })
}
