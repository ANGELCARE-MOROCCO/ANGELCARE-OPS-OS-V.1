import { loadCareLinkOpsSnapshot, recordOpsAuditEvent } from '@/lib/carelink/ops-enterprise'
import { recordMissionEvent } from '@/lib/missions/events'
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
    await recordMissionEvent({
      missionId: report.missionId,
      eventType: 'ops_report_correction_requested',
      content: typeof body?.note === 'string' ? body.note : 'Correction demandée par CareLink Ops',
      metadata: { report_id: reportId, ...body },
      source: 'carelink_ops',
    })
    await recordOpsAuditEvent({
      entityType: 'report',
      entityId: reportId,
      action: 'report.correction_requested',
      payload: { missionId: report.missionId, ...body },
    })
    return opsJson({ ok: true, reportId, missionId: report.missionId })
  } catch (error) {
    return opsError(error, 'Impossible de demander une correction de rapport')
  }
}
