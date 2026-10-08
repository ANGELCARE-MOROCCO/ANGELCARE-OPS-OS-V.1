import { NextRequest } from 'next/server'
import { listOperatorUsageLimits, updateOperatorUsageLimit } from '@/lib/angelcare360/operator/usage'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return operatorJson({ ok: true, usageLimits: await listOperatorUsageLimits() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (body?.operation !== 'update') return operatorJson({ ok: false, error: 'Opération d’usage inconnue.' }, 400)
    return operatorJson(await updateOperatorUsageLimit(body.payload || {}))
  } catch (error) {
    return operatorRouteError(error)
  }
}
