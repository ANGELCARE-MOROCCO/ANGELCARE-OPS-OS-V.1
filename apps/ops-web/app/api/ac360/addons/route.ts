import { NextResponse } from 'next/server'
import { activateAc360Addon, cancelAc360Addon, getAc360BillingCenter } from '@/lib/ac360/runtime'
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
  const result = await getAc360BillingCenter(orgId)
  return json({ ok: result.ok, addons: result.billing?.addons || [], activeAddonKeys: result.billing?.activeAddonKeys || [], context: result.context || null }, { status: result.ok ? 200 : 500 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const guarded = await runAc360WiredAction('ac360.addon.activate', async () => {
    return activateAc360Addon({ orgId: body.orgId, addonKey: body.addonKey, quantity: body.quantity, billingInterval: body.billingInterval })
  }, {
    orgId: body.orgId,
    quantity: 1,
    idempotencyKey: buildAc360IdempotencyKey('addon.activate', `${body.orgId || 'ctx'}:${body.addonKey || 'addon'}`),
    metadata: { addonKey: body.addonKey, billingInterval: body.billingInterval, source: 'api.ac360.addons.POST' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}))
  const guarded = await runAc360WiredAction('ac360.addon.cancel', async () => {
    return cancelAc360Addon({ orgId: body.orgId, addonKey: body.addonKey, cancelAtPeriodEnd: body.cancelAtPeriodEnd })
  }, {
    orgId: body.orgId,
    quantity: 1,
    idempotencyKey: buildAc360IdempotencyKey('addon.cancel', `${body.orgId || 'ctx'}:${body.addonKey || 'addon'}`),
    metadata: { addonKey: body.addonKey, cancelAtPeriodEnd: body.cancelAtPeriodEnd, source: 'api.ac360.addons.DELETE' },
  })
  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}
