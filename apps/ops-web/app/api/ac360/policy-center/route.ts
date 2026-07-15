
import { NextResponse } from 'next/server'
import { getAc360PolicyCenter, reconcileAc360PolicySafety } from '@/lib/ac360/policy-enforcement'
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction } from '@/lib/ac360/action-wiring'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const orgId = url.searchParams.get('orgId') || undefined
  const result = await getAc360PolicyCenter(orgId)
  return json(result, { status: result.ok ? 200 : 500 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const guarded = await runAc360WiredAction('ac360.policy.reconcile', async () => {
    return reconcileAc360PolicySafety(body.orgId || body.org_id)
  }, {
    orgId: body.orgId || body.org_id,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('policy.reconcile', body.orgId || body.org_id || 'ctx'),
    metadata: { source: 'api.ac360.policy-center.POST', phase: 'phase_1e' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}
