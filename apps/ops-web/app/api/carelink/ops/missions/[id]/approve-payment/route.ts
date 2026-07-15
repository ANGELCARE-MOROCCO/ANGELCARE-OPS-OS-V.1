import { recordOpsAuditEvent, reviewOpsDispute } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson, readJsonBody } from '../../../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ id: string }> | { id: string } }

async function readId(context: Context) {
  const params = await context.params
  return Number(params.id)
}

export async function POST(request: Request, context: Context) {
  try {
    const missionId = await readId(context)
    const body = await readJsonBody(request)
    const disputeId = body?.disputeId ? String(body.disputeId) : null
    if (disputeId) {
      const dispute = await reviewOpsDispute(disputeId, 'approved', typeof body?.note === 'string' ? body.note : null)
      return opsJson({ ok: true, data: dispute })
    }
    await recordOpsAuditEvent({
      entityType: 'mission',
      entityId: String(missionId),
      action: 'mission.payment_approved',
      payload: { note: typeof body?.note === 'string' ? body.note : null },
    })
    return opsJson({ ok: true, missionId })
  } catch (error) {
    return opsError(error, 'Impossible d’approuver le paiement Ops')
  }
}
