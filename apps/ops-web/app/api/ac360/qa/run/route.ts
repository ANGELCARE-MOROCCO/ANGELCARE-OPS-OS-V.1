import { NextResponse } from 'next/server'
import { buildAc360IdempotencyKey, ac360GuardBlockedResponse, runAc360WiredAction } from '@/lib/ac360/action-wiring'
import { runAc360FoundationQa } from '@/lib/ac360/phase1f-quality-gate'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const orgId = body.orgId || body.org_id
  const guarded = await runAc360WiredAction('ac360.qa.run', async () => {
    return runAc360FoundationQa({ orgId, metadata: { requestedBy: 'api.ac360.qa.run' } })
  }, {
    orgId,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('qa.run', orgId || 'ctx'),
    metadata: { source: 'api.ac360.qa.run.POST', phase: 'phase_1f' },
  })

  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}
