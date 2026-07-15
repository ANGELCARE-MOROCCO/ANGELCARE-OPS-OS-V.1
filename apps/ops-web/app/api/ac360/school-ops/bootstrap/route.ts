import { NextResponse } from 'next/server'
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction } from '@/lib/ac360/action-wiring'
import { bootstrapAc360SchoolOps, resolveAc360SchoolOpsContext } from '@/lib/ac360/school-ops'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const resolved = await resolveAc360SchoolOpsContext(body.orgId || body.org_id)
  if (!resolved.ok) return json(resolved, { status: resolved.status || 400 })

  const guarded = await runAc360WiredAction('ac360.school_ops.bootstrap', async () => {
    return bootstrapAc360SchoolOps(resolved.orgId, { ...(body.metadata || {}), source: 'api.ac360.school_ops.bootstrap.POST' })
  }, {
    orgId: resolved.orgId,
    quantity: 1,
    idempotencyKey: buildAc360IdempotencyKey('school_ops.bootstrap', resolved.orgId),
    metadata: { source: 'api.ac360.school_ops.bootstrap.POST', phase: 'phase_2a_core_school_ops_skeleton' },
  })

  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}
