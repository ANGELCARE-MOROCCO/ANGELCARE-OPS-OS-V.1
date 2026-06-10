import { NextResponse } from 'next/server'
import { canTransition } from '@/lib/carelink/lifecycle'
import { getCareLinkMission, transitionMission } from '@/lib/carelink/repository'
import type { CareLinkStatus } from '@/lib/carelink/types'

export const dynamic = 'force-dynamic'

const TARGET_STATUS = 'mission_started' as CareLinkStatus

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { note?: string }
    const mission = await getCareLinkMission(id)
    if (!canTransition(mission.status, TARGET_STATUS)) {
      return NextResponse.json({ ok: false, error: `Transition ${mission.status} -> ${TARGET_STATUS} blocked by lifecycle engine` }, { status: 409 })
    }
    return NextResponse.json({ ok: true, data: await transitionMission(id, TARGET_STATUS, body.note) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown CareLink action error' }, { status: 500 })
  }
}
