
import { NextResponse } from 'next/server'
import { resolveAc360PolicySafety } from '@/lib/ac360/policy-enforcement'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await resolveAc360PolicySafety({
    orgId: body.orgId || body.org_id,
    actionKey: String(body.actionKey || body.action_key || ''),
    featureKey: body.featureKey || body.feature_key || null,
    meterKey: body.meterKey || body.meter_key || null,
    routePath: body.routePath || body.route_path || null,
    httpMethod: body.httpMethod || body.http_method || null,
    quantity: Number(body.quantity || 1),
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
  })
  const response = NextResponse.json(result, { status: result.allowed ? 200 : 402 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
