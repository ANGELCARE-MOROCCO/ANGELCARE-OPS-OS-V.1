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
      status: 'agent_accepted',
      lifecycle_stage: 'agent_accepted',
      readiness_status: 'ready',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    await recordMissionEvent({
      missionId: Number(id),
      eventType: 'mobile_accept',
      content: body.note || 'Mission acceptée depuis CareLink mobile',
      source: 'carelink_mobile',
    })
    await createNotification({
      type: 'mission_update',
      title: 'Mission acceptée',
      body: body.note || `La mission ${String(mission.id)} a été acceptée.`,
      priority: 'high',
      missionId: Number(id),
      caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
      linkedEntityType: 'mission',
      linkedEntityId: String(mission.id),
      metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage },
    }).catch(() => null)
    return NextResponse.json({ ok: true, data: mission })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Accept failed' }, { status: 500 })
  }
}
