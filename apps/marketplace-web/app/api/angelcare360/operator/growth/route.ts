import { NextRequest } from 'next/server'
import { executeGrowthOperation, loadGrowthWorkspaceSnapshot } from '@/lib/angelcare360/operator/growth'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return operatorJson({ ok: true, snapshot: await loadGrowthWorkspaceSnapshot() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La commande commerciale est incomplète.' }, 422)
    return operatorJson(await executeGrowthOperation(body.operation, body.payload || {}))
  } catch (error) {
    return operatorRouteError(error)
  }
}
