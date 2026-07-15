import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function normalizeAction(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function moduleLabelFor(moduleKey: string) {
  if (moduleKey === 'voice_terminal') return 'Voice Terminal'
  return moduleKey.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const action = normalizeAction(body.action)
  const moduleKey = String(body.moduleKey || body.module_key || '').trim() || 'voice_terminal'
  const reason = String(body.reason || body.note || '').trim()
  const supabase = supabaseAdmin()

  try {
    if (!action) {
      return NextResponse.json({ ok: false, message: 'Missing CEO action.' }, { status: 400 })
    }

    if (action === 'refresh_status' || action === 'refresh' || action === 'telemetry_refresh') {
      return NextResponse.json({
        ok: true,
        action,
        status: 'completed',
        message:
          process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID
            ? 'CEO System Control refreshed with provider telemetry configuration detected.'
            : 'CEO System Control refreshed. Provider telemetry is not configured, so internal snapshots are shown.',
        report: {
          providerTelemetry:
            process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID
              ? 'configured'
              : 'not_configured',
          runtimeRegistry: supabase ? 'available' : 'not_configured',
          completedAt: new Date().toISOString(),
        },
      })
    }

    if (action === 'disable_module' || action === 'enable_module') {
      if (!supabase) {
        return NextResponse.json(
          { ok: false, action, message: 'Supabase runtime registry is not configured.' },
          { status: 500 },
        )
      }

      const enabled = action === 'enable_module'
      const moduleLabel = moduleLabelFor(moduleKey)

      const { data, error } = await supabase
        .from('system_module_flags')
        .upsert(
          {
            module_key: moduleKey,
            module_name: moduleLabel,
            module_label: moduleLabel,
            module_description: 'Runtime controlled module managed from CEO System Control.',
            module_group: 'system',
            enabled,
            status: enabled ? 'active' : 'disabled',
            reason: reason || (enabled ? 'Restored from CEO System Control' : 'Disabled from CEO System Control'),
            last_action: action,
            last_action_by: 'ceo_system_control',
            last_action_at: new Date().toISOString(),
            updated_by: 'ceo_system_control',
            updated_by_email: body.actorEmail || null,
            action_reason: reason || null,
            control_source: 'ceo_system_control',
            environment: process.env.VERCEL_ENV || 'production',
            metadata: {
              source: 'ceo_system_control',
              action,
              moduleKey,
            },
          },
          { onConflict: 'module_key' },
        )
        .select('*')
        .maybeSingle()

      if (error) {
        return NextResponse.json({ ok: false, action, message: error.message, details: error }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        action,
        status: 'completed',
        message: enabled ? `${moduleLabel} restored.` : `${moduleLabel} disabled.`,
        data,
        report: {
          module: moduleKey,
          enabled,
          completedAt: new Date().toISOString(),
        },
      })
    }

    if (action === 'shutdown_system' || action === 'restore_system' || action === 'emergency_lock') {
      const nextMode =
        action === 'shutdown_system'
          ? 'standby'
          : action === 'emergency_lock'
            ? 'locked'
            : 'normal'

      if (supabase) {
        await supabase.from('system_runtime_events').insert({
          event_type: action,
          severity: action === 'emergency_lock' ? 'critical' : 'control',
          message: `CEO action executed: ${action}`,
          actor_email: body.actorEmail || null,
          metadata: {
            action,
            nextMode,
            reason,
            source: 'ceo_system_control',
          },
        })
      }

      return NextResponse.json({
        ok: true,
        action,
        status: 'completed',
        message:
          action === 'shutdown_system'
            ? 'System standby workflow completed.'
            : action === 'restore_system'
              ? 'System restore workflow completed.'
              : 'Emergency lock workflow completed.',
        report: {
          nextMode,
          completedAt: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({
      ok: true,
      action,
      status: 'completed',
      message: `CEO action completed: ${action}`,
      report: {
        completedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        action,
        message: error instanceof Error ? error.message : 'CEO action failed.',
      },
      { status: 500 },
    )
  }
}
