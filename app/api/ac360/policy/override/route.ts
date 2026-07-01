
import { NextResponse } from 'next/server'
import { decideAc360PolicyOverride, requestAc360PolicyOverride } from '@/lib/ac360/policy-enforcement'
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction } from '@/lib/ac360/action-wiring'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const guarded = await runAc360WiredAction('ac360.policy.override.request', async () => {
    return requestAc360PolicyOverride({
      orgId: body.orgId || body.org_id,
      actionKey: String(body.actionKey || body.action_key || ''),
      reason: String(body.reason || ''),
      featureKey: body.featureKey || body.feature_key,
      meterKey: body.meterKey || body.meter_key,
      routePath: body.routePath || body.route_path,
      quantity: Number(body.quantity || 1),
      requestedBehavior: body.requestedBehavior || body.requested_behavior,
      expiresAt: body.expiresAt || body.expires_at,
      guardDecisionId: body.guardDecisionId || body.guard_decision_id,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    })
  }, {
    orgId: body.orgId || body.org_id,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('policy.override.request', `${body.orgId || body.org_id || 'ctx'}:${body.actionKey || body.action_key || 'action'}`),
    metadata: { source: 'api.ac360.policy.override.POST', requestedActionKey: body.actionKey || body.action_key, phase: 'phase_1e' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))
  const guarded = await runAc360WiredAction('ac360.policy.override.decide', async () => {
    return decideAc360PolicyOverride({
      requestId: String(body.requestId || body.request_id || ''),
      decision: String(body.decision || 'denied') as 'approved' | 'denied' | 'cancelled',
      decisionReason: String(body.decisionReason || body.decision_reason || ''),
      expiresAt: body.expiresAt || body.expires_at,
    })
  }, {
    orgId: body.orgId || body.org_id,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('policy.override.decide', body.requestId || body.request_id || 'request'),
    metadata: { source: 'api.ac360.policy.override.PATCH', requestId: body.requestId || body.request_id, decision: body.decision, phase: 'phase_1e' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}
