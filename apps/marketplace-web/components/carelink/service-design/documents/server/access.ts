import 'server-only'

const privileged = new Set(['ceo', 'owner', 'direction', 'admin', 'super_admin', 'operations_manager', 'ops_manager'])

export function canUseServiceDesignDocuments(user: Record<string, unknown> | null | undefined) {
  if (!user) return false
  const role = String(user.role || user.role_key || '').trim().toLowerCase()
  if (privileged.has(role)) return true
  const permissions = Array.isArray(user.permissions) ? user.permissions.map(String) : []
  return permissions.includes('*') || permissions.some((permission) => permission === 'homeservice_design.view' || permission === 'homeservice_design.view_planning' || permission === 'homeservice_design.view_commercial' || permission === 'homeservice_design.view_performance' || permission === 'homeservice_design.manage_documents' || permission.startsWith('homeservice_design.'))
}
