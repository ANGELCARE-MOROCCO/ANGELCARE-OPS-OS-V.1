import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { note?: string }
    const mission = await patchMission(Number(id), {
      status: 'arrival_confirmed',
      lifecycle_stage: 'arrival_confirmed',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    await recordMissionEvent({
      missionId: Number(id),
      eventType: 'mobile_arrival_confirmed',
      content: body.note || 'Arrivée confirmée depuis CareLink mobile',
      source: 'carelink_mobile',
    })
    return NextResponse.json({ ok: true, data: mission })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Arrival confirmation failed' }, { status: 500 })
  }
}
