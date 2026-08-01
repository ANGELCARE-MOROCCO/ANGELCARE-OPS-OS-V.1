import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { cookies } from 'next/headers'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import type { Angelcare360PermissionRecord, Angelcare360RoleRecord } from '@/types/angelcare360/rbac'
import { buildAngelcare360AccessProfile, normalizeAngelcare360User } from '@/lib/angelcare360/permissions'
import { loadAngelcare360RuntimeEntitlements } from '@/lib/angelcare360/server/entitlements'
import { getAngelcare360ModuleKeyForPermission, isAngelcare360ModuleEnabled } from '@/lib/angelcare360/entitlements'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'

export type Angelcare360SchoolRecord = {
  id: string
  school_code: string
  name: string
  status: string
  language?: string | null
  currency?: string | null
  timezone?: string | null
}

export type Angelcare360SchoolSettingsRecord = {
  id: string
  school_id: string
  default_language?: string | null
  default_currency?: string | null
  default_timezone?: string | null
  status: string
}

export type Angelcare360AcademicYearRecord = {
  id: string
  school_id: string
  year_code: string
  label: string
  starts_on: string
  ends_on: string
  status: string
  is_current?: boolean
}

export type Angelcare360UserRoleRow = {
  role_id: string
  role: Pick<Angelcare360RoleRecord, 'id' | 'role_key' | 'label' | 'scope' | 'school_id'>
}

export type Angelcare360RolePermissionRow = {
  permission_key: string
  permission: Pick<Angelcare360PermissionRecord, 'permission_key' | 'domain_key' | 'action_key' | 'label'>
}

export type Angelcare360AccessContext = {
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
  school: Angelcare360SchoolRecord | null
  schoolSettings: Angelcare360SchoolSettingsRecord | null
  academicYear: Angelcare360AcademicYearRecord | null
  roles: Array<Pick<Angelcare360RoleRecord, 'id' | 'role_key' | 'label' | 'scope'>>
  permissions: Set<string>
  primaryRoleKey: string | null
  runtimeEntitlements: Angelcare360RuntimeEntitlements
  supportAccess?: Record<string, unknown> | null
}

export class Angelcare360AccessError extends Error {
  status: number

  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

async function getAllowedSchoolIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_user_roles')
    .select('school_id')
    .eq('app_user_id', userId)
    .eq('status', 'active')

  return [...new Set(((data || []) as Array<{ school_id?: string | null }>)
    .map((row) => row.school_id)
    .filter((value): value is string => Boolean(value)))]
}

async function getActiveSchool(
  userId: string,
  isSuperAdmin: boolean,
  schoolId?: string | null,
): Promise<Angelcare360SchoolRecord | null> {
  const supabase = await createClient()
  const allowedSchoolIds = isSuperAdmin ? [] : await getAllowedSchoolIds(userId)

  if (schoolId) {
    if (!isSuperAdmin && !allowedSchoolIds.includes(schoolId)) return null
    const { data } = await supabase
      .from('angelcare360_schools')
      .select('id, school_code, name, status, language, currency, timezone')
      .eq('id', schoolId)
      .maybeSingle()
    return (data as Angelcare360SchoolRecord | null) ?? null
  }

  if (!isSuperAdmin && allowedSchoolIds.length === 0) return null

  let query = supabase
    .from('angelcare360_schools')
    .select('id, school_code, name, status, language, currency, timezone')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)

  if (!isSuperAdmin) query = query.in('id', allowedSchoolIds)
  const { data } = await query.maybeSingle()
  return (data as Angelcare360SchoolRecord | null) ?? null
}

async function getActiveSupportAccess(operatorUserId: string) {
  try {
    const cookieStore = await cookies()
    const supportSessionId = cookieStore.get('angelcare360_support_access')?.value
    if (!supportSessionId) return null
    const supabase = await createClient()
    const { data } = await supabase
      .from('angelcare360_operator_tenant_support_access_sessions')
      .select('*, tenant:angelcare360_operator_tenants(id,school_id,tenant_slug), client:angelcare360_operator_clients(display_name)')
      .eq('id', supportSessionId)
      .eq('operator_user_id', operatorUserId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    return data?.tenant?.school_id ? data : null
  } catch { return null }
}

async function getCurrentAcademicYear(schoolId: string): Promise<Angelcare360AcademicYearRecord | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_academic_years')
    .select('id, school_id, year_code, label, starts_on, ends_on, status, is_current')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('is_current', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as Angelcare360AcademicYearRecord | null) ?? null
}

async function getSchoolSettings(schoolId: string): Promise<Angelcare360SchoolSettingsRecord | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_school_settings')
    .select('id, school_id, default_language, default_currency, default_timezone, status')
    .eq('school_id', schoolId)
    .maybeSingle()

  return (data as Angelcare360SchoolSettingsRecord | null) ?? null
}

async function getRolesAndPermissions(userId: string, schoolId: string) {
  const supabase = await createClient()

  const { data: roleRows } = await supabase
    .from('angelcare360_user_roles')
    .select('role_id, role:angelcare360_roles(id, role_key, label, scope, school_id)')
    .eq('app_user_id', userId)
    .eq('school_id', schoolId)
    .eq('status', 'active')

  const roles = ((roleRows || []) as Array<{
    role_id: string
    role: Pick<Angelcare360RoleRecord, 'id' | 'role_key' | 'label' | 'scope' | 'school_id'> | Array<Pick<Angelcare360RoleRecord, 'id' | 'role_key' | 'label' | 'scope' | 'school_id'>> | null
  }>)
    .map((item) => (Array.isArray(item.role) ? item.role[0] : item.role))
    .filter(Boolean) as Array<Pick<Angelcare360RoleRecord, 'id' | 'role_key' | 'label' | 'scope' | 'school_id'>>

  const roleIds = roles.map((role) => role.id)

  const { data: permissionRows } = roleIds.length
    ? await supabase
        .from('angelcare360_role_permissions')
        .select('permission_key, permission:angelcare360_permissions(permission_key, domain_key, action_key, label)')
        .in('role_id', roleIds)
        .eq('effect', 'allow')
    : { data: [] }

  const permissions = new Set<string>()

  for (const row of ((permissionRows || []) as unknown) as Array<Angelcare360RolePermissionRow>) {
    if (row.permission_key) permissions.add(row.permission_key)
  }

  return {
    roles,
    permissions,
    primaryRoleKey: roles[0]?.role_key ?? null,
  }
}

export async function getAngelcare360AccessContext(options?: {
  schoolId?: string | null
}): Promise<Angelcare360AccessContext | null> {
  const rawUser = await getCurrentAppUser()
  const user = normalizeAngelcare360User(rawUser as Partial<Angelcare360SessionUser> | null)

  if (!user) return null

  const access = buildAngelcare360AccessProfile(user)
  const supportAccess = await getActiveSupportAccess(user.id)
  const requestedSchoolId = supportAccess?.tenant?.school_id || options?.schoolId
  const school = await getActiveSchool(user.id, access.accessLevel === 'super_admin' || Boolean(supportAccess), requestedSchoolId)

  if (!school) {
    return {
      user,
      access,
      school: null,
      schoolSettings: null,
      academicYear: null,
      roles: [],
      permissions: new Set<string>(),
      primaryRoleKey: null,
      runtimeEntitlements: await loadAngelcare360RuntimeEntitlements({ userId: user.id, schoolId: null }),
      supportAccess,
    }
  }

  const schoolSettings = await getSchoolSettings(school.id)
  const academicYear = await getCurrentAcademicYear(school.id)
  const { roles, permissions, primaryRoleKey } = await getRolesAndPermissions(user.id, school.id)
  for (const permission of access.permissions) permissions.add(permission)
  for (const denied of access.deniedPermissions) {
    for (const permission of [...permissions]) {
      if (permission === denied || (denied.endsWith('.*') && permission.startsWith(denied.slice(0, -1)))) permissions.delete(permission)
    }
  }
  if (supportAccess) {
    const supabase = await createClient()
    const allowedActions = supportAccess.access_mode === 'read_only' ? ['view','export','audit'] : supportAccess.access_mode === 'guided_support' ? ['view','export','audit','create','update','notify'] : ['view','export','audit','create','update','notify','assign','configure']
    const { data: supportPermissions } = await supabase.from('angelcare360_permissions').select('permission_key,action_key').in('action_key', allowedActions).eq('status', 'active')
    for (const permission of supportPermissions || []) permissions.add(String(permission.permission_key))
  }
  const runtimeEntitlements = await loadAngelcare360RuntimeEntitlements({ userId: user.id, schoolId: school.id })

  return {
    user,
    access,
    school,
    schoolSettings,
    academicYear,
    roles,
    permissions,
    primaryRoleKey,
    runtimeEntitlements,
    supportAccess,
  }
}

export async function requireAngelcare360Permission(
  permissionKey: string,
  options?: { schoolId?: string | null; context?: Angelcare360AccessContext | null },
) {
  const context = options?.context ?? (await getAngelcare360AccessContext({ schoolId: options?.schoolId }))

  if (!context) {
    throw new Angelcare360AccessError('Vous devez être connecté pour utiliser AngelCare 360.', 401)
  }

  const explicitlyDenied = context.access.deniedPermissions.some((denied) => denied === permissionKey || (denied.endsWith('.*') && permissionKey.startsWith(denied.slice(0, -1))))
  const permissionGranted = !explicitlyDenied && (context.access.accessLevel === 'super_admin'
    || context.permissions.has(permissionKey)
    || context.permissions.has('angelcare360.*')
    || context.permissions.has('*'))

  if (!permissionGranted) {
    throw new Angelcare360AccessError('Vous n’avez pas l’autorisation requise pour cette action.', 403)
  }

  const moduleKey = getAngelcare360ModuleKeyForPermission(permissionKey)
  if (moduleKey && context.access.moduleKeys.length && !context.access.moduleKeys.includes(moduleKey)) {
    throw new Angelcare360AccessError(`Le module ${moduleKey} est hors du périmètre attribué à cet administrateur.`, 403)
  }
  if (!isAngelcare360ModuleEnabled(context.runtimeEntitlements, moduleKey)) {
    const restriction = context.runtimeEntitlements.restrictedModules.find((item) => item.key === moduleKey)
    throw new Angelcare360AccessError(
      restriction?.reason
        || `Le module ${moduleKey || 'demandé'} n’est pas inclus ou actif pour ce tenant.`,
      403,
    )
  }

  return context
}
