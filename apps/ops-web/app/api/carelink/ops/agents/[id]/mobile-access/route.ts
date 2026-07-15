import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertCareLinkMobileAppUserFromAccess } from '@/lib/carelink/mobile-login-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

const ACTIVE_ACCESS_STATUSES = new Set(['active', 'enabled', 'approved', 'live'])

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function lower(value: unknown) {
  return text(value).toLowerCase()
}

function isEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower(value))
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

async function findAuthUserByEmail(admin: any, email: string) {
  if (!admin?.listUsers || !email) return null

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage: 1000 })
    if (error) return null
    const user = Array.isArray(data?.users)
      ? data.users.find((item: AnyRecord) => lower(item.email) === email)
      : null
    if (user) return user
    if (!data?.users?.length || data.users.length < 1000) break
  }

  return null
}

async function ensureAuthUser(input: {
  supabase: Awaited<ReturnType<typeof createClient>>
  existingAuthUserId?: string | null
  email: string
  password: string
  caregiverId: number
}) {
  const admin = (input.supabase as any).auth?.admin
  let authUserId = input.existingAuthUserId || null
  let authWarning = ''

  if (!admin) {
    return { authUserId, authWarning: 'Supabase Auth admin is not available on this server.' }
  }

  try {
    if (!authUserId) {
      const existingUser = await findAuthUserByEmail(admin, input.email)
      if (existingUser?.id) authUserId = existingUser.id
    }

    if (authUserId) {
      if (input.password) {
        const { error } = await admin.updateUserById(authUserId, {
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: { role: 'carelink_mobile_agent', caregiver_id: input.caregiverId },
        })
        if (error?.message) authWarning = error.message
      }
      return { authUserId, authWarning }
    }

    if (!input.password) {
      return { authUserId: null, authWarning: 'A temporary password is required to create the mobile auth user.' }
    }

    const { data, error } = await admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        role: 'carelink_mobile_agent',
        caregiver_id: input.caregiverId,
      },
    })

    if (!error && data?.user?.id) return { authUserId: data.user.id, authWarning }

    return { authUserId: null, authWarning: error?.message || 'Unable to create mobile auth user.' }
  } catch (error) {
    return { authUserId, authWarning: error instanceof Error ? error.message : 'Auth user sync failed.' }
  }
}

async function persistAccess(supabase: Awaited<ReturnType<typeof createClient>>, caregiverId: number, fullRow: AnyRecord) {
  const { data: existing } = await supabase
    .from('carelink_agent_app_access')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  const row = compact(fullRow)

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

    const requestedIdentifier = lower(body.login_identifier || body.username || body.login || body.email || existing?.login_identifier || existing?.username || existing?.email)
    const profileEmail = lower(body.profile_email || body.caregiver_email || body.work_email)
    const requestedEmail = lower(body.email || existing?.email || profileEmail)
    const authEmail = isEmail(requestedEmail) ? requestedEmail : isEmail(profileEmail) ? profileEmail : isEmail(existing?.email) ? lower(existing?.email) : ''
    const loginIdentifier = requestedIdentifier || authEmail
    const password = text(body.password)

    if (action === 'save' && !authEmail) {
      return NextResponse.json({ ok: false, error: 'A valid authentication email is required. If using a username alias, keep a real email in the caregiver Email field.' }, { status: 400 })
    }

    const isShutdown = action === 'shutdown'
    const isRestore = action === 'restore'

    const accessStatus = isShutdown
      ? 'temporarily_suspended'
      : isRestore
        ? 'active'
        : text(body.access_status, existing?.access_status || 'active')

    const mobileEnabled = isShutdown ? false : isRestore ? true : bool(body.mobile_enabled)
    let authUserId = existing?.auth_user_id || null
    let authWarning = ''

    if (action === 'save' && authEmail) {
      const auth = await ensureAuthUser({ supabase, existingAuthUserId: authUserId, email: authEmail, password, caregiverId })
      authUserId = auth.authUserId
      authWarning = auth.authWarning

      if (mobileEnabled && ACTIVE_ACCESS_STATUSES.has(lower(accessStatus)) && !authUserId) {
        return NextResponse.json({
          ok: false,
          error: authWarning || 'CareLink Mobile access cannot be activated until a Supabase Auth user is linked. Enter a temporary password and save access again.',
        }, { status: 409 })
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
        // Database access control remains source of truth.
      }
    }

    const row = compact({
      auth_user_id: authUserId,
      email: authEmail || existing?.email,
      login_identifier: loginIdentifier,
      username: loginIdentifier,
      access_status: accessStatus,
      access_level: text(body.access_level, existing?.access_level || 'carelink_mobile_agent'),
      mobile_enabled: mobileEnabled,
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
      last_invited_at: action === 'save' && authEmail ? now : existing?.last_invited_at,
      last_admin_action: action,
      last_admin_action_at: now,
      updated_at: now,
    })

    const { data, error } = await persistAccess(supabase, caregiverId, row)

    if (error) {
      return NextResponse.json({ ok: false, error: `CareLink mobile access schema/save failed: ${error.message}. Run migration 20260628_carelink_mobile_login_contract_lockdown.sql.` }, { status: 500 })
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
      loginContract: {
        authEmail: data?.email || authEmail,
        loginIdentifier: data?.login_identifier || loginIdentifier,
        authLinked: Boolean(data?.auth_user_id),
        mobileEnabled: Boolean(data?.mobile_enabled),
        accessStatus: data?.access_status || accessStatus,
      },
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to save mobile access',
    }, { status: 500 })
  }
}
