import { NextResponse } from 'next/server'
import {
  buildRestoreProgressPlan,
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
      command?: 'restore_now'
      reason?: string
      timezone?: string
    }

    const plan = buildRestoreProgressPlan({
      state: context.state,
      command: body.command || 'restore_now',
      reason: body.reason || null,
      timezone: body.timezone || context.state.timezone,
    })

    for (const step of plan.steps) {
      await recordUsageSnapshot(context.supabase, {
        source: 'system-control',
        metricKey: `restore_${step.key}`,
        metricValue: step.percent,
        costEstimate: 0,
        payload: {
          command: plan.command,
          step,
          reason: body.reason || null,
          mode: plan.finalState.mode,
        },
      })
    }

    const nextState = await updateRuntimeState(context.supabase, {
      ...plan.finalState,
      last_action_by: context.actor.email || context.state.lastActionBy || 'system',
      last_action_at: new Date().toISOString(),
      schedule: {
        ...(context.state.schedule || {}),
        resumeAt: new Date().toISOString(),
        timezone: body.timezone || context.state.timezone,
        reason: body.reason || null,
        command: plan.command,
        shutdownExecutedAt: context.state.schedule?.shutdownExecutedAt || context.state.shutdownStartedAt || context.state.schedule?.shutdownAt || null,
        restoreExecutedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    })

    const event = await recordRuntimeEvent(context.supabase, {
      eventType: 'runtime_restore_transition',
      fromMode: context.state.mode,
      toMode: nextState.mode,
      actorEmail: context.actor.email,
      actorRole: context.actor.role,
      payload: {
        command: plan.command,
        reason: body.reason || null,
        timezone: body.timezone || context.state.timezone,
        steps: plan.steps,
        finalState: plan.finalState,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        action: 'restore',
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
        error: error instanceof Error ? error.message : 'Unable to execute restore',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}
