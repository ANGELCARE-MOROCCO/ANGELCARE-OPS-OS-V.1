import { NextRequest } from 'next/server'
import { createOperatorRenewal, listOperatorRenewals, updateOperatorRenewalStatus } from '@/lib/angelcare360/operator/renewals'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return operatorJson({ ok: true, renewals: await listOperatorRenewals() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête renouvellements est incomplète.' }, 422)
    if (body.operation === 'create') return operatorJson(await createOperatorRenewal(body.payload || {}))
    if (body.operation === 'status') return operatorJson(await updateOperatorRenewalStatus(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération renouvellement inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
