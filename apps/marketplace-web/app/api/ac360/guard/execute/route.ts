import { NextResponse } from 'next/server'
import { executeAc360GuardedAction } from '@/lib/ac360/guard'
import { ac360PolicyToGuardResult, resolveAc360PolicySafety } from '@/lib/ac360/policy-enforcement'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const actionKey = String(body.actionKey || body.action_key || '')
  const policy = await resolveAc360PolicySafety({
    orgId: body.orgId || body.org_id,
    actionKey,
    routePath: body.routePath || body.route_path || '/api/ac360/guard/execute',
    httpMethod: 'POST',
    quantity: Number(body.quantity || 1),
    metadata: { ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}), source: 'api.ac360.guard.execute.POST', phase: 'phase_1e' },
  })
  if (!policy.allowed) return json(ac360PolicyToGuardResult(policy, actionKey), { status: 402 })

  const result = await executeAc360GuardedAction({
    orgId: body.orgId || body.org_id,
    actionKey,
    quantity: Number(body.quantity || 1),
    idempotencyKey: body.idempotencyKey || body.idempotency_key,
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    currentCapacity: body.currentCapacity ?? body.current_capacity ?? null,
  })

  return json(result, { status: result.ok ? 200 : 400 })
}
