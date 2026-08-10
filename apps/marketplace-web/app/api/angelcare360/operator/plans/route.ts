import { NextRequest } from 'next/server'
import { createOperatorPackage, createOperatorPlan, listOperatorPackages, listOperatorPlans, retireOperatorPlan, updateOperatorPackage, updateOperatorPlan } from '@/lib/angelcare360/operator/plans'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'plans'
    if (mode === 'packages') return operatorJson({ ok: true, packages: await listOperatorPackages() })
    return operatorJson({ ok: true, plans: await listOperatorPlans() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ entity?: string; operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête plans est incomplète.' }, 422)
    if (body.entity === 'package') {
      if (body.operation === 'create') return operatorJson(await createOperatorPackage(body.payload || {}))
      if (body.operation === 'update') return operatorJson(await updateOperatorPackage(body.payload || {}))
    }
    if (body.entity === 'plan') {
      if (body.operation === 'create') return operatorJson(await createOperatorPlan(body.payload || {}))
      if (body.operation === 'update') return operatorJson(await updateOperatorPlan(body.payload || {}))
      if (body.operation === 'retire') return operatorJson(await retireOperatorPlan(body.payload || {}))
    }
    return operatorJson({ ok: false, error: 'Opération plan inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
