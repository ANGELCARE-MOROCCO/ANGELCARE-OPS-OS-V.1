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
      lifecycle_stage: 'checked_in',
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    await recordMissionEvent({ missionId: Number(id), eventType: 'mobile_check_in', content: body.note || 'Check-in confirmé depuis CareLink mobile', source: 'carelink_mobile' })
    await createNotification({
      type: 'mission_update',
      title: 'Check-in confirmé',
      body: body.note || `Pointage validé pour la mission ${String(mission.id)}.`,
      priority: 'normal',
      missionId: Number(id),
      caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
      linkedEntityType: 'mission',
      linkedEntityId: String(mission.id),
      metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage },
    }).catch(() => null)
    return NextResponse.json({ ok: true, data: mission })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Check-in failed' }, { status: 500 })
  }
}
