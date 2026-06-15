import { assignOpsMission, recordOpsAuditEvent } from '@/lib/carelink/ops-enterprise'
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
    const caregiverId = body?.caregiverId == null ? null : Number(body.caregiverId)
    const mission = await assignOpsMission(missionId, Number.isFinite(caregiverId) ? caregiverId : null, {
      reason: typeof body?.reason === 'string' ? body.reason : undefined,
    })
    await recordOpsAuditEvent({
      entityType: 'mission',
      entityId: String(missionId),
      action: 'mission.assigned_via_api',
      payload: { caregiverId: Number.isFinite(caregiverId) ? caregiverId : null, reason: body?.reason || null },
    })
    return opsJson({ ok: true, data: mission })
  } catch (error) {
    return opsError(error, 'Impossible d’assigner la mission Ops')
  }
}
