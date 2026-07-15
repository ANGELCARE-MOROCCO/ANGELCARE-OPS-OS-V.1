
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordAc360PolicyEvent } from '@/lib/ac360/policy-enforcement'
import { getAc360CurrentContext } from '@/lib/ac360/runtime'
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
  const context = await getAc360CurrentContext(orgId)
  const resolvedOrgId = orgId || context.context?.org?.id
  if (!resolvedOrgId) return json({ ok: false, error: 'Unable to resolve AC360 organization.' }, { status: 400 })
  const db = await createClient()
  const { data, error } = await db.from('ac360_policy_events').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(100)
  return json({ ok: !error, events: data || [], error: error?.message }, { status: error ? 500 : 200 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const guarded = await runAc360WiredAction('ac360.policy.events.record', async () => {
    return recordAc360PolicyEvent({
      orgId: body.orgId || body.org_id,
      eventKey: String(body.eventKey || body.event_key || 'policy.manual_event'),
      actionKey: body.actionKey || body.action_key || null,
      featureKey: body.featureKey || body.feature_key || null,
      meterKey: body.meterKey || body.meter_key || null,
      routePath: body.routePath || body.route_path || null,
      httpMethod: body.httpMethod || body.http_method || null,
      severity: body.severity || 'warning',
      status: body.status || 'open',
      message: String(body.message || 'AC360 policy event recorded.'),
      guardDecisionId: body.guardDecisionId || body.guard_decision_id || null,
      overrideRequestId: body.overrideRequestId || body.override_request_id || null,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    })
  }, {
    orgId: body.orgId || body.org_id,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('policy.event.record', `${body.orgId || body.org_id || 'ctx'}:${body.eventKey || body.event_key || 'event'}`),
    metadata: { source: 'api.ac360.policy.events.POST', phase: 'phase_1e' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}
