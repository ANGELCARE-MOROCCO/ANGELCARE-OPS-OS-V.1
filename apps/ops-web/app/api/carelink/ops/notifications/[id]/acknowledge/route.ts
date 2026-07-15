import { acknowledgeOpsNotification } from '@/lib/carelink/ops-enterprise'
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
    const id = await readId(context)
    const body = await readJsonBody(request)
    const notification = await acknowledgeOpsNotification(
      id,
      body?.missionId == null ? null : Number(body.missionId),
      typeof body?.note === 'string' ? body.note : null,
    )
    return opsJson({ ok: true, data: notification })
  } catch (error) {
    return opsError(error, 'Impossible d’accuser réception de la notification Ops')
  }
}
