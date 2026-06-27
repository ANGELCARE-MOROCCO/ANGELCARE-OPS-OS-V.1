import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { executeCareLinkMobileMissionAction, parseCareLinkMobileActionBody } from '@/lib/carelink/mobile-action-engine'
import { getMissionDossier } from '@/lib/missions/repository'
import { loadMissionChecklist, loadMissionReport, saveMissionReport } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await requireCareLinkMobileMissionAccess(Number(id), 'can_submit_reports')
    const report = await loadMissionReport(Number(id))
    return NextResponse.json({ ok: true, data: report })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Mission report load failed')
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_submit_reports')
    const body = await parseCareLinkMobileActionBody(request)
    const dossier = await getMissionDossier(missionId)
    if (!dossier) {
      return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 })
    }
    const checklist = await loadMissionChecklist(missionId, dossier.raw.service_type || dossier.mission.serviceType, session.caregiverId)
    const report = await saveMissionReport({
      missionId,
      caregiverId: session.caregiverId,
      serviceType: dossier.raw.service_type || dossier.mission.serviceType,
      summary: typeof body.summary === 'string' ? body.summary : typeof body.note === 'string' ? body.note : null,
      observations: typeof body.observations === 'string' ? body.observations : null,
      activities: Array.isArray(body.activities) ? body.activities.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [],
      checklistSnapshot: Array.isArray(body.checklistSnapshot) ? body.checklistSnapshot.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : checklist,
      incidentFlag: Boolean(body.incidentFlag),
      recommendations: typeof body.recommendations === 'string' ? body.recommendations : null,
      status: 'submitted',
      validationStatus: typeof body.validationStatus === 'string' ? body.validationStatus : 'ready',
      metadata: body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {},
    })

    const result = await executeCareLinkMobileMissionAction({
      request,
      missionId,
      action: 'report_submit',
      body: { ...body, summary: typeof body.summary === 'string' ? body.summary : typeof body.note === 'string' ? body.note : null },
    })
    return NextResponse.json({ ok: true, ...result, report })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Report submission failed')
  }
}
