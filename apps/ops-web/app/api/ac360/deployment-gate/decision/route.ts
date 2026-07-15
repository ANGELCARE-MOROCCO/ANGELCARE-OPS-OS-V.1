import { NextResponse } from 'next/server'
import { buildAc360IdempotencyKey, ac360GuardBlockedResponse, runAc360WiredAction } from '@/lib/ac360/action-wiring'
import { decideAc360DeploymentGate } from '@/lib/ac360/phase1f-quality-gate'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const gateKey = body.gateKey || body.gate_key || 'phase2.entry.authorization'
  const decision = body.decision || 'block'
  const guarded = await runAc360WiredAction('ac360.deployment_gate.decide', async () => {
    return decideAc360DeploymentGate({ gateKey, decision, reason: body.reason, metadata: { requestedBy: 'api.ac360.deployment-gate.decision' } })
  }, {
    orgId: body.orgId || body.org_id,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('deployment.decision', `${gateKey}:${decision}`),
    metadata: { source: 'api.ac360.deployment-gate.decision.POST', phase: 'phase_1f', gateKey, decision },
  })

  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}
