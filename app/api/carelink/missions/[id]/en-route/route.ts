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
      status: 'en_route',
      lifecycle_stage: 'en_route',
      updated_at: new Date().toISOString(),
    })
    await recordMissionEvent({
      missionId: Number(id),
      eventType: 'mobile_en_route',
      content: body.note || 'Départ en route depuis CareLink mobile',
      source: 'carelink_mobile',
    })
    await createNotification({
      type: 'mission_update',
      title: 'En route',
      body: body.note || `Déplacement en cours pour la mission ${String(mission.id)}.`,
      priority: 'normal',
      missionId: Number(id),
      caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
      linkedEntityType: 'mission',
      linkedEntityId: String(mission.id),
      metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage },
    }).catch(() => null)
    return NextResponse.json({ ok: true, data: mission })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'En-route update failed' }, { status: 500 })
  }
}
