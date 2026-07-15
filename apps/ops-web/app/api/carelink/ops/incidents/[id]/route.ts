import { loadCareLinkOpsSnapshot } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson, readJsonBody } from '../../_helpers'
import { resolveOpsIncident, escalateOpsIncident } from '@/lib/carelink/ops-enterprise'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ id: string }> | { id: string } }

async function readId(context: Context) {
  const params = await context.params
  return String(params.id)
}

export async function GET(_request: Request, context: Context) {
  try {
    const id = await readId(context)
    const snapshot = await loadCareLinkOpsSnapshot()
    const incident = snapshot.incidents.find((item) => item.id === id) || null
    return opsJson({ ok: true, incident })
  } catch (error) {
    return opsError(error, 'Impossible de charger l’incident Ops')
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const id = await readId(context)
    const body = await readJsonBody(request)
    if (String(body?.status || '').toLowerCase() === 'resolved') {
      const incident = await resolveOpsIncident({ incidentId: id, note: typeof body?.note === 'string' ? body.note : null, metadata: typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {} })
      return opsJson({ ok: true, data: incident })
    }
    if (String(body?.status || '').toLowerCase() === 'escalated') {
      const incident = await escalateOpsIncident({ incidentId: id, status: 'escalated', note: typeof body?.note === 'string' ? body.note : null, metadata: typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {} })
      return opsJson({ ok: true, data: incident })
    }
    const incident = await escalateOpsIncident({ incidentId: id, status: typeof body?.status === 'string' ? body.status : 'open', note: typeof body?.note === 'string' ? body.note : null, metadata: typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {} })
    return opsJson({ ok: true, data: incident })
  } catch (error) {
    return opsError(error, 'Impossible de mettre à jour l’incident Ops')
  }
}
