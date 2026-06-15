import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { createAlert, createNotification } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { note?: string; severity?: string; details?: Record<string, unknown> }
    const mission = await patchMission(Number(id), {
      status: 'incident',
      lifecycle_stage: 'incident',
      risk_level: body.severity || 'elevated',
      incident_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    await recordMissionEvent({
      missionId: Number(id),
      eventType: 'mobile_incident_reported',
      content: body.note || 'Incident signalé depuis CareLink mobile',
      metadata: body.details || body,
      source: 'carelink_mobile',
    })
    await Promise.allSettled([
      createNotification({
        type: 'incident',
        title: 'Incident signalé',
        body: body.note || `Incident ouvert pour la mission ${String(mission.id)}.`,
        priority: 'critical',
        missionId: Number(id),
        caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
        linkedEntityType: 'mission',
        linkedEntityId: String(mission.id),
        metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage, ...body.details },
      }),
      createAlert({
        type: 'incident',
        title: 'Incident critique',
        body: body.note || `Incident signalé sur la mission ${String(mission.id)}.`,
        priority: 'critical',
        missionId: Number(id),
        caregiverId: mission.caregiver_id ? Number(mission.caregiver_id) : null,
        linkedEntityType: 'mission',
        linkedEntityId: String(mission.id),
        metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage, ...body.details },
      }),
    ])
    return NextResponse.json({ ok: true, data: mission })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Incident declaration failed' }, { status: 500 })
  }
}
