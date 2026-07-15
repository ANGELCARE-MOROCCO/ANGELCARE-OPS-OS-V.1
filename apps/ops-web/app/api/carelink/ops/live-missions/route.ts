import { NextResponse } from 'next/server'
import { getCareLinkOpsLiveMissionBridge } from '@/lib/carelink/ops-live-missions-bridge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await getCareLinkOpsLiveMissionBridge()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load live missions',
      missions: [],
      records: [],
      dossiers: [],
      lanes: [],
      dispatchLanes: [],
      summary: {},
      metrics: {},
    }, { status: 200 })
  }
}
