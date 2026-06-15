import { notifyOpsAgent } from '@/lib/carelink/ops-enterprise'
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
    const caregiverId = Number(body?.caregiverId || body?.agentId || 0)
    if (!caregiverId) throw new Error('caregiverId requis')
    const message = await notifyOpsAgent({
      caregiverId,
      missionId,
      subject: String(body?.subject || 'CareLink Ops'),
      body: String(body?.body || 'Message de coordination CareLink Ops.'),
      priority: typeof body?.priority === 'string' ? body.priority : 'normal',
      metadata: typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {},
    })
    return opsJson({ ok: true, data: message })
  } catch (error) {
    return opsError(error, 'Impossible de notifier l’agent Ops')
  }
}
