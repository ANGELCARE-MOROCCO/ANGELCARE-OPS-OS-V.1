import { NextRequest } from 'next/server'
import { archiveOperatorClient, createOperatorClient, getOperatorClientById, listOperatorClients, updateOperatorClient } from '@/lib/angelcare360/operator/clients'
import { getOperatorOverview } from '@/lib/angelcare360/operator/overview'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'list'
    if (mode === 'overview') return operatorJson({ ok: true, overview: await getOperatorOverview() })
    if (mode === 'detail') {
      const id = request.nextUrl.searchParams.get('id')
      if (!id) return operatorJson({ ok: false, error: 'Le client est requis.' }, 422)
      return operatorJson({ ok: true, client: await getOperatorClientById(id) })
    }
    return operatorJson({ ok: true, clients: await listOperatorClients({ status: request.nextUrl.searchParams.get('status'), lifecycleStage: request.nextUrl.searchParams.get('lifecycleStage'), city: request.nextUrl.searchParams.get('city') }) })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête clients est incomplète.' }, 422)
    if (body.operation === 'create') return operatorJson(await createOperatorClient(body.payload || {}))
    if (body.operation === 'update') return operatorJson(await updateOperatorClient(body.payload || {}))
    if (body.operation === 'archive') return operatorJson(await archiveOperatorClient(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération client inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
