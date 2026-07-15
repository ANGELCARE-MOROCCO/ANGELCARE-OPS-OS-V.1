import { updateCareLinkOpsAgent } from '@/lib/carelink/ops-agents'
import { recordOpsAuditEvent } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson, readJsonBody } from '../../../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ id: string }> | { id: string } }

async function readId(context: Context) {
  const params = await context.params
  const id = Number(params.id)
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Invalid caregiver id: ${params.id}`)
  return id
}

export async function POST(request: Request, context: Context) {
  try {
    const caregiverId = await readId(context)
    const body = await readJsonBody(request)
    const status = typeof body?.status === 'string' ? body.status : 'available'
    const dossier = await updateCareLinkOpsAgent(caregiverId, {
      currentStatus: status,
      status,
    })
    await recordOpsAuditEvent({
      entityType: 'caregiver',
      entityId: String(caregiverId),
      action: 'agent.readiness_updated',
      payload: {
        status,
        note: typeof body?.note === 'string' ? body.note : null,
      },
    })
    return opsJson(dossier)
  } catch (error) {
    return opsError(error, 'Impossible de mettre à jour la readiness agent', 400)
  }
}
