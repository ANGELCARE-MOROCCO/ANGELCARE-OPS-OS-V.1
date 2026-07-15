
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAc360CurrentContext } from '@/lib/ac360/runtime'
import { scanAc360RouteCoverage } from '@/lib/ac360/policy-enforcement'
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
  await getAc360CurrentContext(orgId)
  const db = await createClient()
  const { data, error } = await db.from('ac360_route_coverage_audits').select('*').order('target_module', { ascending: true }).order('route_path', { ascending: true })
  return json({ ok: !error, coverage: data || [], error: error?.message }, { status: error ? 500 : 200 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const guarded = await runAc360WiredAction('ac360.route_coverage.scan', async () => {
    return scanAc360RouteCoverage()
  }, {
    orgId: body.orgId || body.org_id,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('route.coverage.scan', body.orgId || body.org_id || 'ctx'),
    metadata: { source: 'api.ac360.route-coverage.scan.POST', phase: 'phase_1e' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}
