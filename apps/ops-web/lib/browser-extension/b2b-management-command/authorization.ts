import { loadUserAccess } from '../runtime'

const MANAGEMENT_PERMISSIONS = new Set([
  'extension.b2b.manager_control',
  'extension.b2b.staff_execution_quality',
  'extension.b2b.b2b_reporting',
  'extension.b2b.controlled_automation',
])

export async function authorizeManagementWorkspaceHydration(db: any, userId: string) {
  const access = await loadUserAccess(db, userId)
  if (!access.modules.some((row: any) => row.module_key === 'revenue_b2b')) return { ok: false as const, status: 403, error: 'MODULE_NOT_ASSIGNED' }
  const assigned = access.capabilities.filter((row: any) => MANAGEMENT_PERMISSIONS.has(row.capability_key))
  if (!assigned.length) return { ok: false as const, status: 403, error: 'MANAGEMENT_CAPABILITY_NOT_ASSIGNED' }
  return { ok: true as const, access, assigned }
}
