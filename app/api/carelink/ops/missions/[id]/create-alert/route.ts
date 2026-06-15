import { createOpsAlert } from '@/lib/carelink/ops-enterprise'
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
    const alert = await createOpsAlert({
      missionId,
      caregiverId: body?.caregiverId == null ? null : Number(body.caregiverId),
      type: String(body?.type || 'ops_mission_alert'),
      title: String(body?.title || 'Ops Alert'),
      body: String(body?.body || 'Alerte CareLink Ops'),
      priority: typeof body?.priority === 'string' ? body.priority : 'normal',
      metadata: typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {},
    })
    return opsJson({ ok: true, data: alert })
  } catch (error) {
    return opsError(error, 'Impossible de créer l’alerte Ops')
  }
}
