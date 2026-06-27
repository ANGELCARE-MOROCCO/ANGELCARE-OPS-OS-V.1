import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { executeCareLinkMobileMissionAction, parseCareLinkMobileActionBody } from '@/lib/carelink/mobile-action-engine'
import { getMissionDossier } from '@/lib/missions/repository'
import { loadMissionChecklist, loadMissionReport, loadMissionReportCorrections, markMissionReportCorrectionResubmitted, saveMissionReport } from '@/lib/carelink/mobile-persistence'

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
    const existingReport = await loadMissionReport(missionId)
    const activeCorrection = (await loadMissionReportCorrections(missionId, session.caregiverId)).find((row) => ['correction_requested', 'needs_correction', 'open', 'rejected'].includes(String(row.status || '').toLowerCase())) || null
    const isCorrectionResubmission = Boolean(activeCorrection || body.correctionId || body.correction_id)
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
      status: isCorrectionResubmission ? 'resubmitted' : 'submitted',
      validationStatus: typeof body.validationStatus === 'string' ? body.validationStatus : 'ready',
      correctionStatus: isCorrectionResubmission ? 'resubmitted' : 'none',
      correctionRequired: false,
      metadata: {
        ...(existingReport?.metadata || {}),
        ...(body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {}),
        p12_report_validation_loop: true,
        correction_id: activeCorrection?.id || body.correctionId || body.correction_id || null,
      },
    })

    if (isCorrectionResubmission) {
      await markMissionReportCorrectionResubmitted({
        missionId,
        caregiverId: session.caregiverId,
        reportId: report?.id || existingReport?.id || null,
        agentResponse: typeof body.agentResponse === 'string' ? body.agentResponse : typeof body.note === 'string' ? body.note : null,
        metadata: { source: 'report_submit_route', correction_id: activeCorrection?.id || body.correctionId || body.correction_id || null },
      })
    }

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
