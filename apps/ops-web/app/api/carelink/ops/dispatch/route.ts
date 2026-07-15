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
      dispatch: live,
      dispatchBoard: live.dispatchLanes,
      missionFlow: live.dispatchLanes,
      lanes: live.dispatchLanes,
      missions: live.missions,
      queue: live.missions,
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load dispatch live missions',
      missions: [],
      lanes: [],
      dispatchLanes: [],
      summary: {},
      metrics: {},
    }, { status: 200 })
  }
}
