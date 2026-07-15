import { NextRequest, NextResponse } from 'next/server'
import { recordAc360UsageEvent } from '@/lib/ac360/foundation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await recordAc360UsageEvent({
      orgId: String(body.orgId || body.org_id || ''),
      meterKey: String(body.meterKey || body.meter_key || ''),
      quantity: Number(body.quantity || 1),
      featureKey: body.featureKey || body.feature_key ? String(body.featureKey || body.feature_key) : undefined,
      actionKey: body.actionKey || body.action_key ? String(body.actionKey || body.action_key) : undefined,
      actorAppUserId: body.actorAppUserId || body.actor_app_user_id ? String(body.actorAppUserId || body.actor_app_user_id) : undefined,
      idempotencyKey: body.idempotencyKey || body.idempotency_key ? String(body.idempotencyKey || body.idempotency_key) : undefined,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    })
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'AC360 usage recording failed.' }, { status: 500 })
  }
}
