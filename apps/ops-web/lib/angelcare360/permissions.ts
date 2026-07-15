import type { Angelcare360AccessLevel, Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'

const SUPER_ADMIN_ROLES = new Set(['ceo', 'owner', 'super_admin'])
const DIRECTION_ROLES = new Set(['direction', 'principal', 'schooladmin', 'admin', 'administrator', 'manager'])
const RECEPTION_ROLES = new Set(['reception', 'receptionist'])
const TEACHER_ROLES = new Set(['teacher', 'enseignant'])
const PARENT_ROLES = new Set(['parent'])
const STUDENT_ROLES = new Set(['student', 'eleve', 'élève'])
const ACCOUNTING_ROLES = new Set(['comptabilite', 'accountant', 'finance'])
const HR_ROLES = new Set(['rh', 'hr', 'payroll'])
const TRANSPORT_ROLES = new Set(['transport', 'transport_coordinator', 'transport_driver'])
const LIBRARY_ROLES = new Set(['bibliotheque', 'librarian'])
const QUALITY_ROLES = new Set(['qualite', 'quality'])
const SUPPORT_ROLES = new Set(['support', 'support_technique'])

export function normalizeAngelcare360User(user: Partial<Angelcare360SessionUser> | null | undefined): Angelcare360SessionUser | null {
  if (!user?.id) return null

  return {
    id: String(user.id),
    email: user.email ? String(user.email) : null,
    name: user.name ? String(user.name) : null,
    full_name: user.full_name ? String(user.full_name) : null,
    role: user.role ? String(user.role) : null,
    role_key: user.role_key ? String(user.role_key) : null,
    permissions: Array.isArray(user.permissions) ? user.permissions.map(String) : [],
  }
}

function normalizeRoleKey(user: Angelcare360SessionUser | null | undefined) {
  return String(user?.role || user?.role_key || '').trim().toLowerCase()
}

export function getAngelcare360RoleLabel(user: Angelcare360SessionUser | null | undefined): string {
  const role = normalizeRoleKey(user)
  if (SUPER_ADMIN_ROLES.has(role)) return 'Super Admin'
  if (role === 'direction_generale') return 'Direction Générale'
  if (DIRECTION_ROLES.has(role)) return 'Direction d’Établissement'
  if (RECEPTION_ROLES.has(role)) return 'Réception'
  if (TEACHER_ROLES.has(role)) return 'Enseignant'
  if (PARENT_ROLES.has(role)) return 'Parent'
  if (STUDENT_ROLES.has(role)) return 'Élève'
  if (ACCOUNTING_ROLES.has(role)) return 'Comptabilité'
  if (HR_ROLES.has(role)) return 'RH / Paie'
  if (TRANSPORT_ROLES.has(role)) return 'Responsable Transport'
  if (LIBRARY_ROLES.has(role)) return 'Bibliothécaire'
  if (QUALITY_ROLES.has(role)) return 'Responsable Qualité'
  if (SUPPORT_ROLES.has(role)) return 'Support Technique'
  return 'Administration'
}

export function getAngelcare360AccessLevel(user: Angelcare360SessionUser | null | undefined): Angelcare360AccessLevel {
  const role = normalizeRoleKey(user)
  if (SUPER_ADMIN_ROLES.has(role)) return 'super_admin'
  if (role === 'direction_generale' || DIRECTION_ROLES.has(role)) return 'direction'
  if (RECEPTION_ROLES.has(role)) return 'reception'
  if (TEACHER_ROLES.has(role)) return 'enseignant'
  if (PARENT_ROLES.has(role)) return 'parent'
  if (STUDENT_ROLES.has(role)) return 'eleve'
  if (ACCOUNTING_ROLES.has(role)) return 'comptabilite'
  if (HR_ROLES.has(role)) return 'rh'
  if (TRANSPORT_ROLES.has(role)) return 'transport'
  if (LIBRARY_ROLES.has(role)) return 'bibliotheque'
  if (QUALITY_ROLES.has(role)) return 'qualite'
  if (SUPPORT_ROLES.has(role)) return 'support'
  return 'administration'
}

export function buildAngelcare360AccessProfile(user: Angelcare360SessionUser | null | undefined): Angelcare360AccessProfile {
  const accessLevel = getAngelcare360AccessLevel(user)
  const roleLabel = getAngelcare360RoleLabel(user)
  const scopeLabel =
    accessLevel === 'super_admin'
      ? 'Périmètre plateforme'
      : accessLevel === 'direction'
        ? 'Périmètre établissement'
        : accessLevel === 'enseignant'
          ? 'Périmètre pédagogique'
          : accessLevel === 'parent'
            ? 'Périmètre familial'
            : accessLevel === 'eleve'
              ? 'Périmètre élève'
              : 'Périmètre opérationnel'

  return {
    accessLevel,
    roleLabel,
    scopeLabel,
    summary: `${roleLabel} · ${scopeLabel}`,
    canOpenModuleDrawer: true,
    canSeeSensitiveFinance: ['super_admin', 'direction', 'comptabilite', 'rh'].includes(accessLevel),
    canSeeAuditData: ['super_admin', 'direction', 'qualite', 'support'].includes(accessLevel),
    canSeeConfiguration: ['super_admin', 'direction', 'administration', 'qualite', 'support'].includes(accessLevel),
    canSeePeopleData: ['super_admin', 'direction', 'administration', 'reception', 'enseignant', 'comptabilite', 'rh'].includes(accessLevel),
    canSeeOperationalData: true,
  }
}

export function hasAngelcare360Permission(user: Angelcare360SessionUser | null | undefined, permission: string) {
  const role = normalizeRoleKey(user)
  const permissions = Array.isArray(user?.permissions) ? user.permissions.map(String) : []
  if (SUPER_ADMIN_ROLES.has(role)) return true
  if (permissions.includes('*') || permissions.includes('angelcare360.*')) return true
  return permissions.includes(permission)
}

