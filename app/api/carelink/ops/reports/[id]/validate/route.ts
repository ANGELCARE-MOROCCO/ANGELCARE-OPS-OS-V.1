import { loadCareLinkOpsSnapshot, validateOpsReport, recordOpsAuditEvent } from '@/lib/carelink/ops-enterprise'
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
    const validated = await validateOpsReport(report.missionId, {
      ...body,
      summary: body?.summary || report.observations,
      service_type: body?.service_type || report.serviceType,
      status: 'validated',
      validation_status: 'validated',
    })
    await recordOpsAuditEvent({
      entityType: 'report',
      entityId: reportId,
      action: 'report.validated_via_api',
      payload: { missionId: report.missionId, note: body?.note || null },
    })
    return opsJson({ ok: true, data: validated })
  } catch (error) {
    return opsError(error, 'Impossible de valider le rapport Ops')
  }
}
