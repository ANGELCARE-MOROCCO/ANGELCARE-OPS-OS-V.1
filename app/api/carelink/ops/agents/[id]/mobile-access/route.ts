import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertCareLinkMobileAppUserFromAccess } from '@/lib/carelink/mobile-login-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'yes'
}

function compact(row: AnyRecord) {
  const out: AnyRecord = {}
  Object.entries(row).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  })
  return out
}

async function persistAccess(supabase: Awaited<ReturnType<typeof createClient>>, caregiverId: number, fullRow: AnyRecord) {
  const { data: existing } = await supabase
    .from('carelink_agent_app_access')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  const save = async (row: AnyRecord) => {
    if (existing?.id) {
      return await supabase
        .from('carelink_agent_app_access')
        .update(row)
        .eq('id', existing.id)
        .select('*')
        .single()
    }

    return await supabase
      .from('carelink_agent_app_access')
      .insert({ caregiver_id: caregiverId, ...row })
      .select('*')
      .single()
  }

  let result = await save(fullRow)

  if (!result.error) return result

  const fallback = compact({
    email: fullRow.email,
    auth_user_id: fullRow.auth_user_id,
    access_status: fullRow.access_status,
    access_level: fullRow.access_level,
    mobile_enabled: fullRow.mobile_enabled,
    can_view_missions: fullRow.can_view_missions,
    can_accept_missions: fullRow.can_accept_missions,
    can_submit_reports: fullRow.can_submit_reports,
    can_view_payments: fullRow.can_view_payments,
    device_policy: fullRow.device_policy,
    notes: fullRow.notes,
    last_invited_at: fullRow.last_invited_at,
    updated_at: new Date().toISOString(),
  })

  return await save(fallback)
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const caregiverId = Number(params.id)

    if (!Number.isFinite(caregiverId)) {
      return NextResponse.json({ ok: false, error: 'Invalid caregiver id' }, { status: 400 })
    }

    const body = await request.json()
    const action = text(body.action, 'save')
    const now = new Date().toISOString()
    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('carelink_agent_app_access')
      .select('*')
      .eq('caregiver_id', caregiverId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    let authUserId = existing?.auth_user_id || null
    let authWarning = ''

    const email = text(body.email || existing?.email)
    const password = text(body.password)

    if (action === 'save' && email && password && !authUserId) {
      try {
        const admin = (supabase as any).auth?.admin
        if (admin?.createUser) {
          const { data, error } = await admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              role: 'carelink_mobile_agent',
              caregiver_id: caregiverId,
            },
          })

          if (!error && data?.user?.id) {
            authUserId = data.user.id
          } else if (error?.message) {
            authWarning = error.message
          }
        }
      } catch (error) {
        authWarning = error instanceof Error ? error.message : 'Auth user creation skipped'
      }
    }

    if ((action === 'shutdown' || action === 'restore') && existing?.auth_user_id) {
      try {
        const admin = (supabase as any).auth?.admin
        if (admin?.updateUserById) {
          await admin.updateUserById(existing.auth_user_id, {
            ban_duration: action === 'shutdown' ? '876600h' : 'none',
          })
        }
      } catch {
        // Keep database access control as source of truth even if Auth admin is unavailable.
      }
    }

    const isShutdown = action === 'shutdown'
    const isRestore = action === 'restore'

    const accessStatus = isShutdown
      ? 'temporarily_suspended'
      : isRestore
        ? 'active'
        : text(body.access_status, existing?.access_status || 'active')

    const row = compact({
      auth_user_id: authUserId,
      email,
      access_status: accessStatus,
      access_level: text(body.access_level, existing?.access_level || 'carelink_mobile_agent'),
      mobile_enabled: isShutdown ? false : isRestore ? true : bool(body.mobile_enabled),
      can_view_missions: isShutdown ? false : bool(body.can_view_missions),
      can_accept_missions: isShutdown ? false : bool(body.can_accept_missions),
      can_submit_reports: isShutdown ? false : bool(body.can_submit_reports),
      can_view_payments: isShutdown ? false : bool(body.can_view_payments),
      device_policy: text(body.device_policy, existing?.device_policy || ''),
      session_limit: Number(body.session_limit || existing?.session_limit || 1),
      geo_fence_required: bool(body.geo_fence_required),
      pin_reset_required: bool(body.pin_reset_required),
      emergency_access_allowed: bool(body.emergency_access_allowed),
      security_notes: text(body.security_notes, existing?.security_notes || ''),
      notes: text(body.notes, existing?.notes || ''),
      suspension_reason: isShutdown ? text(body.suspension_reason, 'Temporary mobile access shutdown') : existing?.suspension_reason,
      shutdown_until: isShutdown ? body.shutdown_until || null : existing?.shutdown_until,
      suspended_at: isShutdown ? now : existing?.suspended_at,
      suspended_by: isShutdown ? text(body.admin_name, 'CareLink Ops Admin') : existing?.suspended_by,
      restored_at: isRestore ? now : existing?.restored_at,
      restored_by: isRestore ? text(body.admin_name, 'CareLink Ops Admin') : existing?.restored_by,
      last_invited_at: action === 'save' && email ? now : existing?.last_invited_at,
      last_admin_action: action,
      last_admin_action_at: now,
      updated_at: now,
    })

    const { data, error } = await persistAccess(supabase, caregiverId, row)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    let appUser = null
    let appUserWarning = ''
    if (data?.auth_user_id && data?.email) {
      try {
        appUser = await upsertCareLinkMobileAppUserFromAccess({
          supabase,
          authUserId: String(data.auth_user_id),
          email: String(data.email),
          caregiverId,
          access: data,
        })
      } catch (error) {
        appUserWarning = error instanceof Error ? error.message : 'CareLink mobile app user sync skipped'
      }
    }

    return NextResponse.json({
      ok: true,
      action,
      access: data,
      appUser,
      authWarning,
      appUserWarning,
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to save mobile access',
    }, { status: 500 })
  }
}
