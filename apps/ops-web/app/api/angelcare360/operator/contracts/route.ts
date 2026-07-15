import { NextRequest } from 'next/server'
import { createOperatorContract, listOperatorContracts, updateOperatorContractStatus } from '@/lib/angelcare360/operator/contracts'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return operatorJson({ ok: true, contracts: await listOperatorContracts() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête contrats est incomplète.' }, 422)
    if (body.operation === 'create') return operatorJson(await createOperatorContract(body.payload || {}))
    if (body.operation === 'status') return operatorJson(await updateOperatorContractStatus(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération contrat inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
