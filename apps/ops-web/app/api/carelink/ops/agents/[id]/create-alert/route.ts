import { createAgentAlert } from '@/lib/carelink/ops-agents'
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
    const alert = await createAgentAlert(caregiverId, body || {})
    return opsJson({ ok: true, data: alert }, 201)
  } catch (error) {
    return opsError(error, 'Impossible de créer l’alerte agent Ops', 400)
  }
}
