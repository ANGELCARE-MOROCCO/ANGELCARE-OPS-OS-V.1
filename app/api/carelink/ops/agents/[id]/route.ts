import {
  archiveCareLinkOpsAgent,
  getCareLinkOpsAgentDossier,
  updateCareLinkOpsAgent,
} from '@/lib/carelink/ops-agents'
import { opsError, opsJson, readJsonBody } from '../../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ id: string }> | { id: string } }

async function readId(context: Context) {
  const params = await context.params
  const id = Number(params.id)
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Invalid caregiver id: ${params.id}`)
  return id
}

export async function GET(_request: Request, context: Context) {
  try {
    const id = await readId(context)
    return opsJson(await getCareLinkOpsAgentDossier(id))
  } catch (error) {
    return opsError(error, 'Impossible de charger le dossier agent CareLink Ops', 404)
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const id = await readId(context)
    const body = await readJsonBody(request)
    return opsJson(await updateCareLinkOpsAgent(id, body || {}))
  } catch (error) {
    return opsError(error, 'Impossible de modifier l’agent CareLink Ops', 400)
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const id = await readId(context)
    const body = await readJsonBody(request)
    return opsJson(await archiveCareLinkOpsAgent(id, typeof body?.reason === 'string' ? body.reason : null))
  } catch (error) {
    return opsError(error, 'Impossible d’archiver l’agent CareLink Ops', 400)
  }
}
