import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { getMissionDossier } from '@/lib/missions/repository'
import { loadMissionChecklist } from '@/lib/carelink/mobile-persistence'
import { createNotification } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { note?: string }
    const missionId = Number(id)
    const dossier = await getMissionDossier(missionId)
    if (dossier) {
      const checklist = await loadMissionChecklist(missionId, dossier.raw.service_type || dossier.mission.serviceType, dossier.raw.caregiver_id ? Number(dossier.raw.caregiver_id) : null)
      const missingRequired = checklist.filter((item) => item.required && !item.completed)
      if (missingRequired.length) {
        return NextResponse.json({ ok: false, error: 'La checklist obligatoire doit être complétée avant la clôture.', missingRequired }, { status: 409 })
      }
    }
    const mission = await patchMission(missionId, {
      status: 'completed',
      lifecycle_stage: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    await recordMissionEvent({
      missionId,
      eventType: 'mobile_completed',
      content: body.note || 'Mission terminée depuis CareLink mobile',
      source: 'carelink_mobile',
    })
    await createNotification({
      type: 'mission_update',
      title: 'Mission terminée',
      body: body.note || `La mission ${String(missionId)} a été clôturée.`,
      priority: 'high',
      missionId,
      caregiverId: dossier?.raw.caregiver_id ? Number(dossier.raw.caregiver_id) : null,
      linkedEntityType: 'mission',
      linkedEntityId: String(missionId),
      metadata: { status: mission.status, lifecycle_stage: mission.lifecycle_stage },
    }).catch(() => null)
    return NextResponse.json({ ok: true, data: mission })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Completion failed' }, { status: 500 })
  }
}
