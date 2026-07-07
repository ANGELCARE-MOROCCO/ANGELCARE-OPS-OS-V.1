import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import type { Angelcare360PermissionRecord, Angelcare360RoleRecord } from '@/types/angelcare360/rbac'
import { buildAngelcare360AccessProfile, normalizeAngelcare360User } from '@/lib/angelcare360/permissions'

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
}

export class Angelcare360AccessError extends Error {
  status: number

  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

async function getActiveSchool(
  schoolId?: string | null,
): Promise<Angelcare360SchoolRecord | null> {
  const supabase = await createClient()

  if (schoolId) {
    const { data } = await supabase
      .from('angelcare360_schools')
      .select('id, school_code, name, status, language, currency, timezone')
      .eq('id', schoolId)
      .maybeSingle()

    if (data) return data as Angelcare360SchoolRecord
  }

  const { data } = await supabase
    .from('angelcare360_schools')
    .select('id, school_code, name, status, language, currency, timezone')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return (data as Angelcare360SchoolRecord | null) ?? null
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

  for (const row of (permissionRows || []) as Array<Angelcare360RolePermissionRow>) {
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

  const school = await getActiveSchool(options?.schoolId)
  const access = buildAngelcare360AccessProfile(user)

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
    }
  }

  const schoolSettings = await getSchoolSettings(school.id)
  const academicYear = await getCurrentAcademicYear(school.id)
  const { roles, permissions, primaryRoleKey } = await getRolesAndPermissions(user.id, school.id)

  return {
    user,
    access,
    school,
    schoolSettings,
    academicYear,
    roles,
    permissions,
    primaryRoleKey,
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

  if (context.access.accessLevel === 'super_admin') {
    return context
  }

  if (context.permissions.has(permissionKey) || context.permissions.has('angelcare360.*') || context.permissions.has('*')) {
    return context
  }

  throw new Angelcare360AccessError('Vous n’avez pas l’autorisation requise pour cette action.', 403)
}
