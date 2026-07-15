import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { parseCareLinkMobileActionBody } from '@/lib/carelink/mobile-action-engine'
import { createDispatchMessage, createNotification, loadMissionReport, loadMissionReportCorrections, markMissionReportCorrectionResubmitted, saveMissionReport } from '@/lib/carelink/mobile-persistence'
import { getMissionDossier } from '@/lib/missions/repository'
import { recordCareLinkMissionTimelineAudit } from '@/lib/carelink/mobile-audit-ledger'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_submit_reports')
    const corrections = await loadMissionReportCorrections(missionId, session.caregiverId)
    return NextResponse.json({ ok: true, data: corrections })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Report correction load failed')
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_submit_reports')
    const body = await parseCareLinkMobileActionBody(request)
    const dossier = await getMissionDossier(missionId)
    if (!dossier) {
      return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 })
    }

    const existingReport = await loadMissionReport(missionId)
    const report = await saveMissionReport({
      missionId,
      caregiverId: session.caregiverId,
      serviceType: dossier.raw.service_type || dossier.mission.serviceType,
      summary: typeof body.summary === 'string' ? body.summary : existingReport?.summary || null,
      observations: typeof body.observations === 'string' ? body.observations : existingReport?.observations || null,
      activities: Array.isArray(body.activities) ? body.activities.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : existingReport?.activities || [],
      checklistSnapshot: Array.isArray(body.checklistSnapshot) ? body.checklistSnapshot.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : existingReport?.checklistSnapshot || [],
      incidentFlag: Boolean(body.incidentFlag ?? existingReport?.incidentFlag),
      recommendations: typeof body.recommendations === 'string' ? body.recommendations : existingReport?.recommendations || null,
      status: 'resubmitted',
      validationStatus: 'ready',
      correctionStatus: 'resubmitted',
      correctionRequired: false,
      metadata: {
        ...(existingReport?.metadata || {}),
        ...(body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {}),
        correction_resubmitted_from: 'carelink_mobile',
      },
    })

    const correction = await markMissionReportCorrectionResubmitted({
      missionId,
      caregiverId: session.caregiverId,
      reportId: report?.id || existingReport?.id || null,
      agentResponse: typeof body.agentResponse === 'string' ? body.agentResponse : typeof body.note === 'string' ? body.note : null,
      metadata: { source: 'carelink_mobile', report_id: report?.id || existingReport?.id || null },
    })

    await Promise.allSettled([
      createDispatchMessage({
        missionId,
        caregiverId: session.caregiverId,
        senderType: 'agent',
        recipientType: 'ops',
        subject: 'Correction rapport resoumise',
        body: typeof body.agentResponse === 'string' ? body.agentResponse : 'Correction de rapport resoumise par l’agent depuis CareLink mobile.',
        priority: 'high',
        status: 'sent',
        metadata: { report_id: report?.id || null, correction_id: correction?.id || null, p12: true },
      }),
      createNotification({
        type: 'report_correction_resubmitted',
        title: 'Correction rapport resoumise',
        body: 'La correction du rapport mission a été renvoyée à OPS pour validation.',
        priority: 'high',
        missionId,
        caregiverId: session.caregiverId,
        status: 'unread',
        metadata: { report_id: report?.id || null, correction_id: correction?.id || null, p12: true },
      }),
      recordCareLinkMissionTimelineAudit({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'mobile_report_correction_resubmitted',
        eventType: 'mobile_report_correction_resubmitted',
        source: 'carelink_mobile_agent',
        outcome: 'resubmitted',
        metadata: { report_id: report?.id || null, correction_id: correction?.id || null },
      }),
    ])

    return NextResponse.json({ ok: true, report, correction })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Report correction resubmission failed')
  }
}
