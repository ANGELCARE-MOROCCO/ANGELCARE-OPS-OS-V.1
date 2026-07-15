import { NextResponse } from 'next/server'
import { getSystemControlContext } from '../../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isTruthy(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
  if (typeof value === 'number') return value !== 0
  return false
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getSystemControlContext()

    if (!context.authorized) {
      return NextResponse.json(
        { ok: false, error: 'System control access denied.' },
        { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const { id: rawId } = await params
    const id = String(rawId || '').trim()
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Route id is required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>

    const { data: existing, error: fetchError } = await context.supabase
      .from('system_route_registry')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json(
        { ok: false, error: fetchError.message || 'Unable to load route record.' },
        { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Route record not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const nextModuleKey = typeof body.module_key === 'string' && body.module_key.trim() ? String(body.module_key).trim().toLowerCase() : String(existing.module_key || '').toLowerCase() || null
    const nextRiskLevel = typeof body.risk_level === 'string' && body.risk_level.trim() ? String(body.risk_level).trim().toLowerCase() : String(existing.risk_level || 'normal')
    const nextIsHeavy = body.is_heavy === undefined ? Boolean(existing.is_heavy) : isTruthy(body.is_heavy)
    const nextIsLiveSync = body.is_live_sync === undefined ? Boolean(existing.is_live_sync) : isTruthy(body.is_live_sync)
    const nextIsAllowedInStandby = body.is_allowed_in_standby === undefined ? Boolean(existing.is_allowed_in_standby) : isTruthy(body.is_allowed_in_standby)

    const { data: saved, error: saveError } = await context.supabase
      .from('system_route_registry')
      .update({
        module_key: nextModuleKey,
        risk_level: nextRiskLevel,
        is_heavy: nextIsHeavy,
        is_live_sync: nextIsLiveSync,
        is_allowed_in_standby: nextIsAllowedInStandby,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (saveError) {
      return NextResponse.json(
        { ok: false, error: saveError.message || 'Unable to update route registry entry.' },
        { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const { error: eventError } = await context.supabase.from('system_policy_events').insert([{
      event_type: 'runtime_route_updated',
      module_key: nextModuleKey,
      route_path: String(existing.route_path || null),
      actor_email: context.actor.email || context.user?.email || null,
      before_payload: existing,
      after_payload: saved,
      message: `Route registry updated for ${String(existing.route_path || id)}.`,
    }])

    if (eventError) {
      return NextResponse.json(
        { ok: false, error: eventError.message || 'Route saved but audit write failed.' },
        { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        route: saved,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to update route registry entry',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}

