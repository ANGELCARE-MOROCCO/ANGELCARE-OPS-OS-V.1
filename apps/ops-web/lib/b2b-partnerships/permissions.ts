export type B2BPermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'archive'
  | 'approve_proposal'
  | 'view_all'
  | 'export'

export type B2BPermissionContext = {
  actorId: string
  actorRole?: string | null
  permissions?: string[] | null
  assignedOwnerId?: string | null
  createdBy?: string | null
}

export function normalizeB2BRole(role?: string | null) {
  const normalized = String(role || '').trim().toLowerCase().replace(/[_-]+/g, ' ')
  if (['ceo', 'admin', 'direction', 'owner', 'founder', 'super admin', 'root admin', 'managing director', 'ceo / managing director'].includes(normalized)) return 'executive'
  if (['business development manager', 'operations manager', 'manager', 'commercial director', 'partnership manager'].includes(normalized)) return 'manager'
  if (['business developer intern', 'business development intern', 'intern', 'stagiaire'].includes(normalized)) return 'intern'
  if (['viewer', 'read only', 'readonly'].includes(normalized)) return 'viewer'
  return normalized || 'unknown'
}

function hasAny(perms: string[], keys: string[]) {
  return keys.some((key) => perms.includes(key))
}

export function requireB2BPermission(
  action: B2BPermissionAction,
  ctx: B2BPermissionContext
): { ok: true } | { ok: false; error: string; status: number } {
  const perms = Array.isArray(ctx.permissions) ? ctx.permissions.map(String) : []

  if (perms.includes('*') || perms.includes('b2b.manage') || perms.includes('b2b_partnerships.manage_settings')) {
    return { ok: true }
  }

  const canAccess = hasAny(perms, ['b2b_partnerships.access', 'b2b_partnerships.read', 'b2b.view', 'workspace.view'])
  const canRead = canAccess || hasAny(perms, ['b2b_partnerships.read'])
  const canCreate = hasAny(perms, ['b2b_partnerships.create', 'b2b_partnerships.update'])
  const canUpdate = hasAny(perms, ['b2b_partnerships.update'])
  const canDelete = hasAny(perms, ['b2b_partnerships.delete'])
  const canReports = hasAny(perms, ['b2b_partnerships.manage_reports'])
  const canAutomation = hasAny(perms, ['b2b_partnerships.manage_automation'])
  const canCampaigns = hasAny(perms, ['b2b_partnerships.manage_campaigns'])
  const canTemplates = hasAny(perms, ['b2b_partnerships.manage_templates'])

  if (action === 'read' || action === 'view_all') {
    if (canRead || canTemplates || canCampaigns || canReports || canAutomation) return { ok: true }
  }

  if (action === 'create' && (canCreate || canCampaigns || canTemplates)) return { ok: true }
  if (action === 'update' && (canUpdate || canCampaigns || canTemplates || canAutomation)) return { ok: true }
  if (action === 'archive' && canDelete) return { ok: true }
  if (action === 'approve_proposal' && (canUpdate || canReports)) return { ok: true }
  if (action === 'export' && canReports) return { ok: true }

  const role = normalizeB2BRole(ctx.actorRole)

  if (role === 'executive') return { ok: true }
  if (role === 'manager') return { ok: true }

  if (role === 'viewer') {
    return action === 'read' || action === 'view_all'
      ? { ok: true }
      : { ok: false, error: 'Read-only B2B access.', status: 403 }
  }

  if (role === 'intern') {
    if (action === 'read' || action === 'create') return { ok: true }
    if (
      action === 'update' &&
      (!ctx.assignedOwnerId || ctx.assignedOwnerId === ctx.actorId || ctx.createdBy === ctx.actorId)
    ) {
      return { ok: true }
    }
    return { ok: false, error: 'Intern access is restricted for this B2B action.', status: 403 }
  }

  return { ok: false, error: 'B2B workspace access denied.', status: 403 }
}
