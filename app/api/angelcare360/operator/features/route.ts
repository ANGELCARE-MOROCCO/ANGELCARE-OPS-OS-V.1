import { NextRequest } from 'next/server'
import { getOperatorModuleEntitlements, listOperatorFeatureFlags, listOperatorUsageLimits, updateOperatorFeatureFlag, updateOperatorUsageLimit } from '@/lib/angelcare360/operator/features'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'flags'
    if (mode === 'usage') return operatorJson({ ok: true, usageLimits: await listOperatorUsageLimits() })
    if (mode === 'entitlements') return operatorJson({ ok: true, entitlements: await getOperatorModuleEntitlements() })
    return operatorJson({ ok: true, flags: await listOperatorFeatureFlags() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ entity?: string; operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête fonctionnalités est incomplète.' }, 422)
    if (body.entity === 'flag' && body.operation === 'update') return operatorJson(await updateOperatorFeatureFlag(body.payload || {}))
    if (body.entity === 'usage' && body.operation === 'update') return operatorJson(await updateOperatorUsageLimit(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération fonctionnalité inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
