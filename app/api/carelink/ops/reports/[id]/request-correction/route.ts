import { loadCareLinkOpsSnapshot, recordOpsAuditEvent } from '@/lib/carelink/ops-enterprise'
import { recordMissionEvent } from '@/lib/missions/events'
import { createDispatchMessage, createNotification, saveMissionReportCorrectionRequest } from '@/lib/carelink/mobile-persistence'
import { opsError, opsJson, readJsonBody } from '../../../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ id: string }> | { id: string } }

async function readId(context: Context) {
  const params = await context.params
  return String(params.id)
}

export async function POST(request: Request, context: Context) {
  try {
    const reportId = await readId(context)
    const body = await readJsonBody(request)
    const snapshot = await loadCareLinkOpsSnapshot()
    const report = snapshot.reports.find((item) => item.id === reportId)
    if (!report) throw new Error('Rapport introuvable')
    const requiredChanges = Array.isArray(body?.requiredChanges)
      ? body.requiredChanges.map((item: unknown) => String(item || '').trim()).filter(Boolean)
      : typeof body?.required_changes === 'string'
        ? body.required_changes.split(/[;|\n]/).map((item: string) => item.trim()).filter(Boolean)
        : []
    const correction = await saveMissionReportCorrectionRequest({
      missionId: report.missionId,
      caregiverId: report.caregiverId,
      reportId,
      requestedBy: 'carelink_ops',
      requiredChanges,
      opsNote: typeof body?.note === 'string' ? body.note : 'Correction demandée par CareLink Ops',
      dueAt: typeof body?.dueAt === 'string' ? body.dueAt : typeof body?.due_at === 'string' ? body.due_at : null,
      metadata: { report_id: reportId, ...body },
    })
    await Promise.allSettled([
      recordMissionEvent({
        missionId: report.missionId,
        eventType: 'ops_report_correction_requested',
        content: typeof body?.note === 'string' ? body.note : 'Correction demandée par CareLink Ops',
        metadata: { report_id: reportId, correction_id: correction?.id || null, required_changes: requiredChanges, ...body },
        source: 'carelink_ops',
      }),
      createDispatchMessage({
        missionId: report.missionId,
        caregiverId: report.caregiverId,
        senderType: 'ops',
        recipientType: 'agent',
        subject: 'Correction rapport demandée',
        body: typeof body?.note === 'string' ? body.note : 'Correction demandée par CareLink Ops',
        priority: 'high',
        status: 'unread',
        metadata: { report_id: reportId, correction_id: correction?.id || null, required_changes: requiredChanges, p12: true },
      }),
      createNotification({
        type: 'report_correction_requested',
        title: 'Correction rapport demandée',
        body: typeof body?.note === 'string' ? body.note : 'Une correction du rapport mission est demandée par OPS.',
        priority: 'high',
        missionId: report.missionId,
        caregiverId: report.caregiverId,
        status: 'unread',
        metadata: { report_id: reportId, correction_id: correction?.id || null, required_changes: requiredChanges, p12: true },
      }),
    ])
    await recordOpsAuditEvent({
      entityType: 'report',
      entityId: reportId,
      action: 'report.correction_requested',
      payload: { missionId: report.missionId, ...body },
    })
    return opsJson({ ok: true, reportId, missionId: report.missionId, correction })
  } catch (error) {
    return opsError(error, 'Impossible de demander une correction de rapport')
  }
}
