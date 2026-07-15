import { NextResponse } from 'next/server'
import { grantAc360Credits } from '@/lib/ac360/runtime'
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction } from '@/lib/ac360/action-wiring'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const guarded = await runAc360WiredAction('ac360.credits.topup', async () => {
    return grantAc360Credits({
      orgId: body.orgId,
      amount: Number(body.amount || 0),
      reason: body.reason,
      idempotencyKey: body.idempotencyKey,
    })
  }, {
    orgId: body.orgId,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || buildAc360IdempotencyKey('credits.topup', `${body.orgId || 'ctx'}:${body.amount || 0}`),
    metadata: { amount: Number(body.amount || 0), reason: body.reason, source: 'api.ac360.credits.topup.POST' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  const response = NextResponse.json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
