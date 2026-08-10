import { NextResponse } from 'next/server'
import { preflightAc360WiredAction, type Ac360WiringKey } from '@/lib/ac360/action-wiring'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await preflightAc360WiredAction(String(body.wiringKey || body.wiring_key || '') as Ac360WiringKey, {
    orgId: body.orgId || body.org_id,
    quantity: Number(body.quantity || 1),
    idempotencyKey: body.idempotencyKey || body.idempotency_key,
    currentCapacity: body.currentCapacity ?? body.current_capacity ?? null,
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
  })
  const response = NextResponse.json(result, { status: (result as any).allowed ? 200 : 402 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
