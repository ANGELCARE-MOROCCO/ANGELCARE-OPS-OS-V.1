import { escalateOpsIncident } from '@/lib/carelink/ops-enterprise'
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
    const incidentId = await readId(context)
    const body = await readJsonBody(request)
    const incident = await escalateOpsIncident({
      incidentId,
      status: 'escalated',
      note: typeof body?.note === 'string' ? body.note : null,
      metadata: typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {},
    })
    return opsJson({ ok: true, data: incident })
  } catch (error) {
    return opsError(error, 'Impossible d’escalader l’incident Ops')
  }
}
