import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { createAlert, createNotification } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { note?: string }
    const mission = await patchMission(Number(id), {
      status: 'agent_declined',
      lifecycle_stage: 'agent_declined',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    await recordMissionEvent({
      missionId: Number(id),
      eventType: 'mobile_decline',
      content: body.note || 'Mission refusée depuis CareLink mobile',
      source: 'carelink_mobile',
    })
    await Promise.allSettled([
      createNotification({
        type: 'mission_update',
        title: 'Mission refusée',
        body: body.note || `La mission ${String(mission.id)} a été refusée.`,
        priority: 'high',
        missionId: Number(id),
        caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
        linkedEntityType: 'mission',
        linkedEntityId: String(mission.id),
        metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage },
      }),
      createAlert({
        type: 'mission_declined',
        title: 'Mission refusée par l’agent',
        body: body.note || `La mission ${String(mission.id)} a été refusée et doit être reprise par le dispatch.`,
        priority: 'high',
        missionId: Number(id),
        caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
        linkedEntityType: 'mission',
        linkedEntityId: String(mission.id),
        metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage },
      }),
    ])
    return NextResponse.json({ ok: true, data: mission })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Decline failed' }, { status: 500 })
  }
}
