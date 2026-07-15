import { NextRequest } from 'next/server'
import { createOperatorPackage, listOperatorPackages, updateOperatorPackage } from '@/lib/angelcare360/operator/plans'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return operatorJson({ ok: true, packages: await listOperatorPackages() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête packages est incomplète.' }, 422)
    if (body.operation === 'create') return operatorJson(await createOperatorPackage(body.payload || {}))
    if (body.operation === 'update') return operatorJson(await updateOperatorPackage(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération package inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
