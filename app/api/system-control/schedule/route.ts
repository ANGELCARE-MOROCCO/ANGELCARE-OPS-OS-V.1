import { NextResponse } from 'next/server'
import { recordRuntimeEvent, recordUsageSnapshot, updateRuntimeState } from '@/lib/system-control/runtime'
import { getSystemControlContext } from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const context = await getSystemControlContext()

    if (!context.authorized) {
      return NextResponse.json(
        { ok: false, error: 'System control access denied.' },
        { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const body = await request.json().catch(() => ({})) as {
      shutdownAt?: string | null
      resumeAt?: string | null
      timezone?: string
      reason?: string | null
      enabledCoreRoutes?: string[]
      disabledModules?: Record<string, unknown>
    }

    const schedule = {
      ...(context.state.schedule || {}),
      shutdownAt: body.shutdownAt || null,
      resumeAt: body.resumeAt || null,
      timezone: body.timezone || context.state.timezone,
      reason: body.reason || context.state.reason || null,
      enabledCoreRoutes: body.enabledCoreRoutes || context.state.enabledCoreRoutes,
      disabledModules: body.disabledModules || context.state.disabledModules,
      createdBy: context.actor.email,
      updatedAt: new Date().toISOString(),
    }

    const nextState = await updateRuntimeState(context.supabase, {
      schedule,
      resume_at: body.resumeAt || context.state.resumeAt || null,
      shutdown_ends_at: body.shutdownAt || context.state.shutdownEndsAt || null,
      timezone: body.timezone || context.state.timezone,
      reason: body.reason || context.state.reason || null,
      enabled_core_routes: body.enabledCoreRoutes || context.state.enabledCoreRoutes,
      disabled_modules: body.disabledModules || context.state.disabledModules,
      last_action_by: context.actor.email || context.state.lastActionBy || 'system',
      last_action_at: new Date().toISOString(),
    })

    const event = await recordRuntimeEvent(context.supabase, {
      eventType: 'runtime_schedule_updated',
      fromMode: context.state.mode,
      toMode: nextState.mode,
      actorEmail: context.actor.email,
      actorRole: context.actor.role,
      payload: {
        schedule,
      },
    })

    await recordUsageSnapshot(context.supabase, {
      source: 'system-control',
      metricKey: 'schedule_update',
      metricValue: 1,
      costEstimate: 0,
      payload: {
        schedule,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        action: 'schedule',
        state: nextState,
        event,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to update schedule',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}
