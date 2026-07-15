import { NextRequest } from 'next/server'
import { createOperatorServiceEvent, getOperatorCustomerHealthDashboard } from '@/lib/angelcare360/operator/health'
import { listOperatorServiceEvents } from '@/lib/angelcare360/operator/service'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return operatorJson({ ok: true, health: await getOperatorCustomerHealthDashboard(), events: await listOperatorServiceEvents() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (body?.operation !== 'create') return operatorJson({ ok: false, error: 'Opération santé inconnue.' }, 400)
    return operatorJson(await createOperatorServiceEvent(body.payload || {}))
  } catch (error) {
    return operatorRouteError(error)
  }
}
