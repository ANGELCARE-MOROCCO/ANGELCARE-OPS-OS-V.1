import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { measureAc360Capacity } from '@/lib/ac360/guard'
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
  const { data, error } = await db.from('ac360_capacity_snapshots').select('*').eq('org_id', resolvedOrgId).order('measured_at', { ascending: false }).limit(80)
  return json({ ok: !error, snapshots: data || [], error: error?.message }, { status: error ? 500 : 200 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const orgId = body.orgId || body.org_id
  const capacityKey = String(body.capacityKey || body.capacity_key || '')
  const guarded = await runAc360WiredAction('ac360.capacity.snapshot', async () => {
    return measureAc360Capacity({
      orgId,
      capacityKey,
      currentValue: body.currentValue ?? body.current_value,
      sourceTable: body.sourceTable || body.source_table,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    })
  }, {
    orgId,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('capacity.snapshot', `${orgId || 'ctx'}:${capacityKey}:${Date.now()}`),
    metadata: { capacityKey, sourceTable: body.sourceTable || body.source_table, source: 'api.ac360.capacity.snapshot.POST' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : 400 })
}
