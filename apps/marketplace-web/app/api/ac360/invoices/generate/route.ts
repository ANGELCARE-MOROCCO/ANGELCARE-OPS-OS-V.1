import { NextResponse } from 'next/server'
import { generateAc360Invoice } from '@/lib/ac360/runtime'
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction } from '@/lib/ac360/action-wiring'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const guarded = await runAc360WiredAction('ac360.invoice.generate', async () => {
    return generateAc360Invoice({
      orgId: body.orgId,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      status: body.status || 'issued',
    })
  }, {
    orgId: body.orgId,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || buildAc360IdempotencyKey('invoice.generate', `${body.orgId || 'ctx'}:${body.periodStart || 'period'}:${body.periodEnd || 'period'}`),
    metadata: { periodStart: body.periodStart, periodEnd: body.periodEnd, invoiceStatus: body.status || 'issued', source: 'api.ac360.invoices.generate.POST' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  const response = NextResponse.json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
