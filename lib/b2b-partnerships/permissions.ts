import type { B2BPermissionAction, B2BPermissionContext, B2BRole } from './types'

const CEO_ROLES = new Set([
  'CEO',
  'Owner',
  'Founder',
  'CEO / Managing Director',
  'Managing Director',
  'Super Admin',
  'Admin',
])

const MANAGER_ROLES = new Set([
  'Business Development Manager',
  'Operations Manager',
  'Manager',
])

const INTERN_ROLES = new Set([
  'Business Developer Intern',
  'Business Development Intern',
  'Intern',
])

export function normalizeB2BRole(role?: string | null): B2BRole | 'Unknown' {
  if (!role) return 'Unknown'
  if (role === 'Viewer') return 'Viewer'
  if (CEO_ROLES.has(role)) return role === 'Admin' ? 'Admin' : 'CEO / Managing Director'
  if (MANAGER_ROLES.has(role)) return role as B2BRole
  if (INTERN_ROLES.has(role)) return 'Business Developer Intern'
  return 'Unknown'
}

export function canAccessB2BWorkspace(ctx: B2BPermissionContext): boolean {
  const role = normalizeB2BRole(ctx.actorRole)
  return [
    'CEO / Managing Director',
    'Business Development Manager',
    'Business Developer Intern',
    'Operations Manager',
    'Admin',
    'Viewer',
  ].includes(role)
}

export function canPerformB2BAction(action: B2BPermissionAction, ctx: B2BPermissionContext): boolean {
  const role = normalizeB2BRole(ctx.actorRole)

  if (role === 'CEO / Managing Director' || role === 'Admin') return true

  if (role === 'Business Development Manager' || role === 'Operations Manager') {
    return ['read', 'create', 'update', 'archive', 'approve_proposal', 'view_all', 'export'].includes(action)
  }

  if (role === 'Business Developer Intern') {
    if (['archive', 'approve_proposal', 'manage_settings', 'export', 'view_all'].includes(action)) return false
    if (action === 'read' || action === 'create') return true
    if (action === 'update') {
      return ctx.assignedOwnerId === ctx.actorId || ctx.createdBy === ctx.actorId || !ctx.assignedOwnerId
    }
    return false
  }

  if (role === 'Viewer') return action === 'read'
  return false
}

export function requireB2BPermission(
  action: B2BPermissionAction,
  ctx: B2BPermissionContext
): { ok: true } | { ok: false; error: string; status: number } {
  if (!canAccessB2BWorkspace(ctx)) {
    return { ok: false, error: 'B2B workspace access denied.', status: 403 }
  }

  if (!canPerformB2BAction(action, ctx)) {
    return { ok: false, error: 'Insufficient B2B workspace permission.', status: 403 }
  }

  return { ok: true }
}
