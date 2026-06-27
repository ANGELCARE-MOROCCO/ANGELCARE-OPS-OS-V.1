import { cookies } from 'next/headers'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

type AnyRecord = Record<string, any>
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

const ACTIVE_ACCESS_STATUSES = new Set(['active', 'enabled', 'approved', 'live'])
const MOBILE_APP_USER_PASSWORD_HASH = 'carelink-supabase-auth-managed'
const MOBILE_APP_USER_PERMISSIONS = ['profile.view', 'staff_portal.view', 'interventions.view']

export class CareLinkMobileLoginError extends Error {
  code: string
  status: number

  constructor(message: string, code = 'carelink_mobile_login_failed', status = 401) {
    super(message)
    this.name = 'CareLinkMobileLoginError'
    this.code = code
    this.status = status
  }
}

function clean(value: unknown) {
  return String(value || '').trim()
}

function lower(value: unknown) {
  return clean(value).toLowerCase()
}

function activeStatus(value: unknown) {
  return ACTIVE_ACCESS_STATUSES.has(lower(value))
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1' || lower(value) === 'yes'
}

function compact(row: AnyRecord) {
  const out: AnyRecord = {}
  Object.entries(row).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  })
  return out
}

async function safeSingle<T = AnyRecord>(promise: any): Promise<T | null> {
  try {
    const { data, error } = await promise
    if (error) return null
    return data || null
  } catch {
    return null
  }
}

async function safeMutation<T = AnyRecord>(promise: any): Promise<T | null> {
  try {
    const { data, error } = await promise
    if (error) return null
    return data || null
  } catch {
    return null
  }
}

async function getCaregiver(supabase: SupabaseClient, caregiverId: unknown) {
  const id = Number(caregiverId)
  if (!Number.isFinite(id)) return null
  return safeSingle<AnyRecord>(supabase.from('caregivers').select('*').eq('id', id).maybeSingle())
}

async function findCareLinkAccessForAuthUser(supabase: SupabaseClient, authUserId: string, email: string) {
  const byAuth = await safeSingle<AnyRecord>(
    supabase
      .from('carelink_agent_app_access')
      .select('*')
      .eq('auth_user_id', authUserId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
  )
  if (byAuth) return byAuth

  if (!email) return null

  return safeSingle<AnyRecord>(
    supabase
      .from('carelink_agent_app_access')
      .select('*')
      .eq('email', email)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
  )
}

function assertCareLinkMobileLoginAccess(access: AnyRecord | null) {
  if (!access) {
    throw new CareLinkMobileLoginError('This user is not provisioned from CareLink OPS Agents.', 'carelink_mobile_not_provisioned', 403)
  }

  if (!bool(access.mobile_enabled)) {
    throw new CareLinkMobileLoginError('CareLink Mobile access is disabled by OPS.', 'carelink_mobile_disabled', 403)
  }

  if (!activeStatus(access.access_status || access.status)) {
    throw new CareLinkMobileLoginError('CareLink Mobile access is not active.', 'carelink_mobile_inactive', 403)
  }

  if (access.revoked_at) {
    throw new CareLinkMobileLoginError('CareLink Mobile access has been revoked.', 'carelink_mobile_revoked', 403)
  }

  if (access.suspended_at) {
    throw new CareLinkMobileLoginError('CareLink Mobile access is suspended.', 'carelink_mobile_suspended', 403)
  }

  if (access.shutdown_until && new Date(access.shutdown_until).getTime() > Date.now()) {
    throw new CareLinkMobileLoginError('CareLink Mobile access is temporarily shut down.', 'carelink_mobile_shutdown', 423)
  }
}

function buildMobileAppUserRow(args: {
  authUserId: string
  access: AnyRecord
  caregiver: AnyRecord | null
  email: string
}) {
  const fullName = clean(args.caregiver?.full_name || args.caregiver?.name || args.caregiver?.display_name || args.email || 'CareLink Agent')
  const phone = clean(args.caregiver?.phone || args.caregiver?.mobile_phone || '')
  const isActive = bool(args.access.mobile_enabled) && activeStatus(args.access.access_status || args.access.status)

  return compact({
    id: args.authUserId,
    full_name: fullName,
    username: args.email,
    password_hash: MOBILE_APP_USER_PASSWORD_HASH,
    role: 'caregiver',
    role_key: 'caregiver',
    status: isActive ? 'active' : 'inactive',
    language: 'fr',
    phone,
    email: args.email,
    department: 'CareLink Mobile',
    job_title: 'CareLink Field Agent',
    permissions: MOBILE_APP_USER_PERMISSIONS,
    must_change_password: false,
    updated_at: new Date().toISOString(),
  })
}

async function findExistingMobileAppUser(supabase: SupabaseClient, authUserId: string, email: string) {
  const byId = await safeSingle<AnyRecord>(supabase.from('app_users').select('*').eq('id', authUserId).maybeSingle())
  if (byId) return byId
  if (!email) return null

  const byEmail = await safeSingle<AnyRecord>(supabase.from('app_users').select('*').eq('email', email).maybeSingle())
  if (byEmail) return byEmail

  return safeSingle<AnyRecord>(supabase.from('app_users').select('*').eq('username', email).maybeSingle())
}

async function saveAppUserWithFallback(supabase: SupabaseClient, existing: AnyRecord | null, fullRow: AnyRecord) {
  let lastError = ''

  const save = async (row: AnyRecord) => {
    try {
      const query = existing?.id
        ? supabase.from('app_users').update(row).eq('id', existing.id).select('*').single()
        : supabase.from('app_users').insert(row).select('*').single()

      const { data, error } = await query
      if (error) {
        lastError = error.message || 'unknown app_users mutation error'
        return null
      }
      return data || null
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'unknown app_users mutation error'
      return null
    }
  }

  const fullSave = await save(fullRow)
  if (fullSave) return fullSave

  const fallback = compact({
    id: existing?.id ? undefined : fullRow.id,
    full_name: fullRow.full_name,
    username: fullRow.username,
    password_hash: fullRow.password_hash,
    role: fullRow.role,
    status: fullRow.status,
    language: fullRow.language,
    phone: fullRow.phone,
    email: fullRow.email,
    department: fullRow.department,
    job_title: fullRow.job_title,
    must_change_password: fullRow.must_change_password,
    updated_at: fullRow.updated_at,
  })

  const fallbackSave = await save(fallback)
  if (fallbackSave) return fallbackSave

  if (!existing?.id) {
    const fallbackWithoutForcedId = { ...fallback }
    delete fallbackWithoutForcedId.id

    const fallbackWithoutForcedIdSave = await save(fallbackWithoutForcedId)
    if (fallbackWithoutForcedIdSave) return fallbackWithoutForcedIdSave

    const minimalWithoutForcedId = compact({
      full_name: fullRow.full_name || fullRow.email || 'CareLink Agent',
      username: fullRow.username || fullRow.email,
      password_hash: fullRow.password_hash,
      role: fullRow.role || 'caregiver',
      status: fullRow.status || 'active',
      email: fullRow.email,
      updated_at: fullRow.updated_at,
    })

    const minimalWithoutForcedIdSave = await save(minimalWithoutForcedId)
    if (minimalWithoutForcedIdSave) return minimalWithoutForcedIdSave
  }

  throw new CareLinkMobileLoginError(
    `Unable to sync CareLink Mobile app user${lastError ? `: ${lastError}` : '.'}`,
    'carelink_mobile_app_user_sync_failed',
    500,
  )
}

async function safeLinkCaregiverToAppUser(supabase: SupabaseClient, caregiverId: unknown, appUserId: string, authUserId: string) {
  const id = Number(caregiverId)
  if (!Number.isFinite(id)) return

  for (const row of [
    { app_user_id: appUserId },
    { user_id: appUserId },
    { account_user_id: appUserId },
    { auth_user_id: authUserId },
    { supabase_user_id: authUserId },
  ]) {
    await safeMutation(supabase.from('caregivers').update(row).eq('id', id))
  }
}

async function safeLinkAccessToAppUser(supabase: SupabaseClient, accessId: unknown, appUserId: string, authUserId: string) {
  if (!accessId) return

  for (const row of [
    { app_user_id: appUserId, auth_user_id: authUserId, updated_at: new Date().toISOString() },
    { user_id: appUserId, auth_user_id: authUserId, updated_at: new Date().toISOString() },
    { auth_user_id: authUserId, updated_at: new Date().toISOString() },
  ]) {
    await safeMutation(supabase.from('carelink_agent_app_access').update(row).eq('id', accessId))
  }
}

export async function upsertCareLinkMobileAppUserFromAccess(args: {
  supabase: SupabaseClient
  authUserId: string
  email: string
  caregiverId: number
  access?: AnyRecord | null
}) {
  const email = lower(args.email)
  if (!args.authUserId || !email) return null

  const caregiver = await getCaregiver(args.supabase, args.caregiverId)
  const access = args.access || await findCareLinkAccessForAuthUser(args.supabase, args.authUserId, email)
  const existing = await findExistingMobileAppUser(args.supabase, args.authUserId, email)
  const row = buildMobileAppUserRow({ authUserId: args.authUserId, access: access || {}, caregiver, email })
  const appUser = await saveAppUserWithFallback(args.supabase, existing, row)

  await safeLinkCaregiverToAppUser(args.supabase, args.caregiverId, String(appUser.id), args.authUserId)
  await safeLinkAccessToAppUser(args.supabase, access?.id, String(appUser.id), args.authUserId)

  return appUser
}

export async function createCareLinkMobileAppSession(args: { supabase: SupabaseClient; appUserId: string }) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000)

  const { error } = await args.supabase.from('app_sessions').insert({
    user_id: args.appUserId,
    session_token: token,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    throw new CareLinkMobileLoginError(error.message, 'carelink_mobile_session_create_failed', 500)
  }

  await args.supabase
    .from('app_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', args.appUserId)

  const cookieStore = await cookies()
  cookieStore.set(APP_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })

  return { token, expiresAt }
}

export async function loginCareLinkMobileAgent(args: { identifier: string; password: string }) {
  const identifier = lower(args.identifier)
  const password = clean(args.password)

  if (!identifier || !password) {
    throw new CareLinkMobileLoginError('Login and password are required.', 'carelink_mobile_credentials_required', 400)
  }

  if (!identifier.includes('@')) {
    throw new CareLinkMobileLoginError('Use the login email created in CareLink OPS Agents.', 'carelink_mobile_email_required', 400)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password })

  if (error || !data?.user?.id) {
    throw new CareLinkMobileLoginError('Invalid CareLink Mobile login credentials.', 'carelink_mobile_invalid_credentials', 401)
  }

  const authUserId = data.user.id
  const email = lower(data.user.email || identifier)
  const access = await findCareLinkAccessForAuthUser(supabase, authUserId, email)

  assertCareLinkMobileLoginAccess(access)

  const caregiverId = Number(access?.caregiver_id)
  if (!Number.isFinite(caregiverId)) {
    throw new CareLinkMobileLoginError('CareLink Mobile user is not linked to a caregiver profile.', 'carelink_mobile_caregiver_missing', 403)
  }

  const appUser = await upsertCareLinkMobileAppUserFromAccess({
    supabase,
    authUserId,
    email,
    caregiverId,
    access,
  })

  if (!appUser?.id) {
    throw new CareLinkMobileLoginError('CareLink Mobile app user sync failed.', 'carelink_mobile_app_user_missing', 500)
  }

  await createCareLinkMobileAppSession({ supabase, appUserId: String(appUser.id) })

  return {
    ok: true,
    redirectTo: '/carelink',
    caregiverId,
    appUserId: String(appUser.id),
  }
}

export function careLinkMobileLoginErrorMessage(value: unknown) {
  if (value instanceof CareLinkMobileLoginError) return value.message
  if (value instanceof Error) return value.message
  return 'CareLink Mobile login failed.'
}
