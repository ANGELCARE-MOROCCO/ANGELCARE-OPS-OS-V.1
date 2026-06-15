import { NextResponse } from 'next/server'
import { getCareLinkOpsLiveMissionBridge } from '@/lib/carelink/ops-live-missions-bridge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const live = await getCareLinkOpsLiveMissionBridge()
    return NextResponse.json(live)
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load missions',
      missions: [],
      records: [],
      dossiers: [],
      lanes: [],
      summary: {},
      metrics: {},
    }, { status: 200 })
  }
}
