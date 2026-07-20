import { loadUserAccess } from '../runtime'

const PARTNER_PERMISSIONS = new Set([
  'extension.b2b.operational_handoff',
  'extension.b2b.partner_activation',
  'extension.b2b.partner_performance',
  'extension.b2b.upsell_cross_sell',
  'extension.b2b.renewal_management',
  'extension.b2b.tender_rfp_intelligence',
])

export async function authorizePartnerWorkspaceHydration(db: any, userId: string) {
  const access = await loadUserAccess(db, userId)
  if (!access.modules.some((row: any) => row.module_key === 'revenue_b2b')) return { ok: false as const, status: 403, error: 'MODULE_NOT_ASSIGNED' }
  const assigned = access.capabilities.filter((row: any) => PARTNER_PERMISSIONS.has(row.capability_key))
  if (!assigned.length) return { ok: false as const, status: 403, error: 'PARTNER_CAPABILITY_NOT_ASSIGNED' }
  return { ok: true as const, access, assigned }
}
