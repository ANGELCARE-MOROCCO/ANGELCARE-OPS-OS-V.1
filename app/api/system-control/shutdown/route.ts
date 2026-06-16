import { NextResponse } from 'next/server'
import {
  buildShutdownProgressPlan,
  recordRuntimeEvent,
  recordUsageSnapshot,
  updateRuntimeState,
} from '@/lib/system-control/runtime'
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
      command?: 'shutdown_now' | 'emergency_lock' | 'disable_polling_only' | 'disable_heavy_sync_only'
      reason?: string
      resumeAt?: string
      timezone?: string
      enabledCoreRoutes?: string[]
      disabledModules?: Record<string, unknown>
    }

    const plan = buildShutdownProgressPlan({
      state: context.state,
      command: body.command || 'shutdown_now',
      reason: body.reason || context.state.reason || 'Protected standby mode enabled.',
      resumeAt: body.resumeAt || context.state.resumeAt || null,
      timezone: body.timezone || context.state.timezone,
      disabledModules: body.disabledModules || {},
      enabledCoreRoutes: body.enabledCoreRoutes || context.state.enabledCoreRoutes,
    })

    for (const step of plan.steps) {
      await recordUsageSnapshot(context.supabase, {
        source: 'system-control',
        metricKey: `shutdown_${step.key}`,
        metricValue: step.percent,
        costEstimate: 0,
        payload: {
          command: plan.command,
          step,
          reason: body.reason || context.state.reason || null,
          mode: plan.finalState.mode,
        },
      })
    }

    const nextState = await updateRuntimeState(context.supabase, {
      ...plan.finalState,
      last_action_by: context.actor.email || context.state.lastActionBy || 'system',
      last_action_at: new Date().toISOString(),
      reason: body.reason || context.state.reason || plan.finalState.reason || null,
      schedule: {
        ...(context.state.schedule || {}),
        shutdownAt: new Date().toISOString(),
        resumeAt: body.resumeAt || context.state.resumeAt || null,
        timezone: body.timezone || context.state.timezone,
        reason: body.reason || context.state.reason || null,
        command: plan.command,
      },
    })

    const event = await recordRuntimeEvent(context.supabase, {
      eventType: 'runtime_shutdown_transition',
      fromMode: context.state.mode,
      toMode: nextState.mode,
      actorEmail: context.actor.email,
      actorRole: context.actor.role,
      payload: {
        command: plan.command,
        reason: body.reason || context.state.reason || null,
        resumeAt: body.resumeAt || context.state.resumeAt || null,
        timezone: body.timezone || context.state.timezone,
        steps: plan.steps,
        finalState: plan.finalState,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        action: 'shutdown',
        progress: plan.steps,
        state: nextState,
        event,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to execute shutdown',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}
