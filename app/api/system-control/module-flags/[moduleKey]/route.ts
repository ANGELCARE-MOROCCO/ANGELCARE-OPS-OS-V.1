import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function isAdmin(user: any) {
  return ['ceo', 'admin', 'super_admin', 'owner'].includes(String(user?.role || '').toLowerCase())
}

function labelFor(moduleKey: string) {
  if (moduleKey === 'voice_terminal') return 'Voice Terminal'
  return moduleKey
    .split('_')
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')
}

export async function GET(_: Request, { params }: { params: Promise<{ moduleKey: string }> }) {
  try {
    await requireUser()
    const { moduleKey } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('system_module_flags')
      .select('module_key,module_label,enabled,status,reason,last_action,updated_at,updated_by_email')
      .eq('module_key', moduleKey)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        ok: true,
        data: {
          module_key: moduleKey,
          module_label: labelFor(moduleKey),
          enabled: true,
          status: 'active',
          reason: 'No runtime flag found. Default enabled.',
          last_action: 'default_enabled',
          updated_at: null,
          updated_by_email: null,
        },
      })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to load module flag.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ moduleKey: string }> }) {
  try {
    const user = await requireUser()

    if (!isAdmin(user)) {
      return NextResponse.json({ ok: false, error: 'CEO/admin access required.' }, { status: 403 })
    }

    const { moduleKey } = await params
    const body = await request.json().catch(() => null)

    const enabled = Boolean(body?.enabled)
    const reason = String(body?.reason || '').trim() || (enabled ? 'Module restored by CEO System Control.' : 'Module temporarily disabled by CEO System Control.')
    const now = new Date().toISOString()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('system_module_flags')
      .upsert(
        {
          module_key: moduleKey,
          module_label: labelFor(moduleKey),
          enabled,
          status: enabled ? 'active' : 'disabled',
          reason,
          last_action: enabled ? 'restored' : 'disabled',
          updated_by: user.id,
          updated_by_email: user.email || user.username || null,
          updated_at: now,
        },
        { onConflict: 'module_key' },
      )
      .select('module_key,module_label,enabled,status,reason,last_action,updated_at,updated_by_email')
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to update module flag.' },
      { status: 500 },
    )
  }
}
