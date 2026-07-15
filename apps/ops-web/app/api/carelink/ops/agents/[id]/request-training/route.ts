import { recordOpsAuditEvent } from '@/lib/carelink/ops-enterprise'
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
    const caregiverId = await readId(context)
    const body = await readJsonBody(request)
    await recordOpsAuditEvent({
      entityType: 'caregiver',
      entityId: String(caregiverId),
      action: 'training.requested',
      payload: {
        note: typeof body?.note === 'string' ? body.note : null,
        metadata: typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {},
      },
    })
    return opsJson({ ok: true, caregiverId })
  } catch (error) {
    return opsError(error, 'Impossible de demander une formation Ops')
  }
}
