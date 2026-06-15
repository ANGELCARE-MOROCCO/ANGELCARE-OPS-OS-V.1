import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { createAlert, createNotification } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { note?: string; minutes?: number }
    const mission = await patchMission(Number(id), {
      ops_notes: body.note || 'Retard déclaré depuis CareLink mobile',
      updated_at: new Date().toISOString(),
    })
    await recordMissionEvent({ missionId: Number(id), eventType: 'mobile_delay_reported', content: body.note || 'Retard signalé depuis CareLink mobile', metadata: { minutes: body.minutes || null }, source: 'carelink_mobile' })
    await Promise.allSettled([
      createNotification({
        type: 'mission_update',
        title: 'Retard signalé',
        body: body.note || `Un retard a été déclaré pour la mission ${String(mission.id)}.`,
        priority: 'high',
        missionId: Number(id),
        caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
        linkedEntityType: 'mission',
        linkedEntityId: String(mission.id),
        metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage, minutes: body.minutes || null },
      }),
      createAlert({
        type: 'mission_delay',
        title: 'Retard déclaré',
        body: body.note || `La mission ${String(mission.id)} signale un retard.`,
        priority: 'high',
        missionId: Number(id),
        caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
        linkedEntityType: 'mission',
        linkedEntityId: String(mission.id),
        metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage, minutes: body.minutes || null },
      }),
    ])
    return NextResponse.json({ ok: true, data: mission })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Delay update failed' }, { status: 500 })
  }
}
