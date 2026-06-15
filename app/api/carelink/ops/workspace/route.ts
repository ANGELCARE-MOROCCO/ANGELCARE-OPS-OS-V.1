import { NextResponse } from 'next/server'
import { getCareLinkOpsLiveMissionBridge } from '@/lib/carelink/ops-live-missions-bridge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const live = await getCareLinkOpsLiveMissionBridge()

    return NextResponse.json({
      ...live,
      ok: true,
      generatedAt: new Date().toISOString(),
      payload: live,
      workspace: live,
      dashboard: live,
      overview: live,
      dispatch: live,
      dispatchBoard: live.dispatchLanes,
      missionFlow: live.dispatchLanes,
      lanes: live.dispatchLanes,
      records: live.missions,
      missions: live.missions,
      queue: live.missions,
      metrics: live.metrics,
      summary: live.summary,
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load live CareLink Ops bridge',
      missions: [],
      records: [],
      queue: [],
      lanes: [],
      dispatchLanes: [],
      summary: {},
      metrics: {},
    }, { status: 200 })
  }
}
