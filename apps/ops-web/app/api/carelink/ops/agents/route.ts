import { createCareLinkOpsAgent, listCareLinkOpsAgents } from '@/lib/carelink/ops-agents'
import { opsError, opsJson, readJsonBody } from '../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    return opsJson(await listCareLinkOpsAgents())
  } catch (error) {
    return opsError(error, 'Impossible de charger les agents CareLink Ops')
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request)
    const dossier = await createCareLinkOpsAgent(body || {})
    return opsJson(dossier, 201)
  } catch (error) {
    return opsError(error, 'Impossible de créer l’agent CareLink Ops', 400)
  }
}
