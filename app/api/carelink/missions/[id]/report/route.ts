import { NextResponse } from 'next/server'
import { getMissionDossier, patchMission } from '@/lib/missions/repository'
import { loadMissionChecklist, loadMissionReport, saveMissionReport, createNotification } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const report = await loadMissionReport(Number(id))
    return NextResponse.json({ ok: true, data: report })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Mission report load failed' }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as {
      note?: string
      summary?: string
      observations?: string
      activities?: Record<string, unknown>[]
      checklistSnapshot?: Record<string, unknown>[]
      incidentFlag?: boolean
      recommendations?: string
      validationStatus?: string
      metadata?: Record<string, unknown>
    }
    const missionId = Number(id)
    const dossier = await getMissionDossier(missionId)
    if (!dossier) {
      return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 })
    }
    const checklist = await loadMissionChecklist(missionId, dossier.raw.service_type || dossier.mission.serviceType, dossier.raw.caregiver_id ? Number(dossier.raw.caregiver_id) : null)
    const report = await saveMissionReport({
      missionId,
      caregiverId: dossier.raw.caregiver_id ? Number(dossier.raw.caregiver_id) : null,
      serviceType: dossier.raw.service_type || dossier.mission.serviceType,
      summary: body.summary || body.note || null,
      observations: body.observations || null,
      activities: body.activities || [],
      checklistSnapshot: body.checklistSnapshot || checklist,
      incidentFlag: Boolean(body.incidentFlag),
      recommendations: body.recommendations || null,
      status: 'submitted',
      validationStatus: body.validationStatus || 'ready',
      metadata: body.metadata || {},
    })
    await createNotification({
      type: 'mission_update',
      title: 'Rapport soumis',
      body: body.summary || body.note || `Le rapport de la mission ${String(missionId)} a été soumis.`,
      priority: 'high',
      missionId,
      caregiverId: dossier.raw.caregiver_id ? Number(dossier.raw.caregiver_id) : null,
      linkedEntityType: 'mission',
      linkedEntityId: String(missionId),
      metadata: { report_status: 'submitted', validation_status: body.validationStatus || 'ready' },
    }).catch(() => null)
    const mission = await patchMission(missionId, {
      report_status: 'submitted',
      validation_status: 'ready',
      lifecycle_stage: 'report_submitted',
      report_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, data: { mission, report } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Report submission failed' }, { status: 500 })
  }
}
