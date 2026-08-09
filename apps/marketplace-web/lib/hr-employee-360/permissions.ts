import { getCurrentUser } from '@/lib/getUser'
import type { Employee360PermissionSet } from './types'

type Actor = {
  id?: string | null
  full_name?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
  department?: string | null
  permissions?: string[] | null
  tenant_id?: string | null
  organization_id?: string | null
  status?: string | null
}

export type Employee360Actor = {
  id: string
  name: string
  email: string | null
  role: string
  tenantId: string | null
  organizationId: string | null
  permissions: string[]
  access: Employee360PermissionSet
}

function normalizedPermissions(actor: Actor): string[] {
  return Array.from(
    new Set(
      (Array.isArray(actor.permissions) ? actor.permissions : [])
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

function hasPermission(permissions: string[], candidates: string[]): boolean {
  if (permissions.includes('*') || permissions.includes('hr.*')) return true
  return candidates.some((candidate) => {
    const normalized = candidate.toLowerCase()
    return permissions.includes(normalized)
  })
}

function isPrivilegedRole(actor: Actor): boolean {
  const role = `${actor.role || ''} ${actor.department || ''}`.toLowerCase()
  return [
    'super admin',
    'super_admin',
    'ceo',
    'managing director',
    'directeur général',
    'hr director',
    'directeur rh',
    'human resources',
    'ressources humaines',
    'administrator',
  ].some((value) => role.includes(value))
}

function resolveAccess(actor: Actor): Employee360PermissionSet {
  const permissions = normalizedPermissions(actor)
  const privileged = isPrivilegedRole(actor)
  const read = privileged || hasPermission(permissions, [
    'hr.view',
    'hr.employees.view',
    'hr.employees.read',
    'hr.staff.view',
  ])
  const editProfile = privileged || hasPermission(permissions, [
    'hr.manage',
    'hr.employees.manage',
    'hr.employees.update',
    'hr.staff.update',
  ])
  const manageDomains = privileged || hasPermission(permissions, [
    'hr.manage',
    'hr.employee360.manage',
    'hr.employee360.domain.manage',
    'hr.employees.update',
  ])
  const manageLifecycle = privileged || hasPermission(permissions, [
    'hr.manage',
    'hr.employee360.lifecycle.manage',
    'hr.employees.lifecycle',
  ])
  const archive = privileged || hasPermission(permissions, [
    'hr.manage',
    'hr.employees.archive',
  ])
  const restore = privileged || hasPermission(permissions, [
    'hr.manage',
    'hr.employees.restore',
  ])
  const viewCompensation = privileged || hasPermission(permissions, [
    'hr.payroll.view',
    'hr.compensation.view',
    'hr.employee360.compensation.view',
  ])
  const manageCompensation = privileged || hasPermission(permissions, [
    'hr.payroll.manage',
    'hr.compensation.manage',
    'hr.employee360.compensation.manage',
  ])
  const validate = privileged || hasPermission(permissions, [
    'hr.manage',
    'hr.employee360.validate',
    'hr.approvals.decide',
  ])
  const print = read || hasPermission(permissions, ['hr.employee360.print'])

  return {
    read,
    editProfile,
    manageDomains,
    manageLifecycle,
    archive,
    restore,
    viewCompensation,
    manageCompensation,
    validate,
    print,
  }
}

export async function requireEmployee360Actor(
  requirement: keyof Employee360PermissionSet = 'read',
): Promise<Employee360Actor> {
  const raw = await getCurrentUser()
  const actor = raw as Actor | null

  if (!actor?.id || actor.status !== 'active') {
    throw Object.assign(new Error('Session utilisateur requise.'), { status: 401, code: 'UNAUTHENTICATED' })
  }

  const access = resolveAccess(actor)
  if (!access[requirement]) {
    throw Object.assign(new Error('Autorisation RH Employee 360 insuffisante.'), {
      status: 403,
      code: 'FORBIDDEN',
    })
  }

  return {
    id: actor.id,
    name: String(actor.full_name || actor.name || actor.email || 'Utilisateur RH'),
    email: actor.email ? String(actor.email) : null,
    role: String(actor.role || actor.department || 'Utilisateur RH'),
    tenantId: actor.tenant_id ? String(actor.tenant_id) : null,
    organizationId: actor.organization_id ? String(actor.organization_id) : null,
    permissions: normalizedPermissions(actor),
    access,
  }
}
