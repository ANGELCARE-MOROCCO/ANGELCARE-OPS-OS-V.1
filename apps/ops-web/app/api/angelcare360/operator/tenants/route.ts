import { NextRequest } from 'next/server'
import { createOrLinkOperatorTenant, getOperatorTenantAccessSummary, listOperatorTenants, updateOperatorTenantStatus } from '@/lib/angelcare360/operator/tenants'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'list'
    if (mode === 'access') return operatorJson({ ok: true, tenants: await getOperatorTenantAccessSummary() })
    return operatorJson({ ok: true, tenants: await listOperatorTenants() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête tenants est incomplète.' }, 422)
    if (body.operation === 'create' || body.operation === 'link') return operatorJson(await createOrLinkOperatorTenant(body.payload || {}))
    if (body.operation === 'status' || body.operation === 'update') return operatorJson(await updateOperatorTenantStatus(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération tenant inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
