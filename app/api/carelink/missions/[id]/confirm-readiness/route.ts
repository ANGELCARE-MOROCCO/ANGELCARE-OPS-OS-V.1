import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { createNotification } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { note?: string }
    const mission = await patchMission(Number(id), {
      readiness_status: 'ready',
      lifecycle_stage: 'confirmed',
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    await recordMissionEvent({ missionId: Number(id), eventType: 'mobile_readiness_confirmed', content: body.note || 'Readiness confirmée depuis CareLink mobile', source: 'carelink_mobile' })
    await createNotification({
      type: 'mission_update',
      title: 'Readiness confirmée',
      body: body.note || `La readiness est confirmée pour la mission ${String(mission.id)}.`,
      priority: 'normal',
      missionId: Number(id),
      caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
      linkedEntityType: 'mission',
      linkedEntityId: String(mission.id),
      metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage },
    }).catch(() => null)
    return NextResponse.json({ ok: true, data: mission })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Readiness confirmation failed' }, { status: 500 })
  }
}
