import type { CockpitActor, CockpitRoleView } from './types'
import {
  actorFromRevenueOsUser,
  hasRevenueOsPermission,
  normalizeRevenueOsRole,
  revenueOsTenantOf,
} from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'

export interface CockpitRights {
  view: boolean
  executiveView: boolean
  commercialView: boolean
  operationsView: boolean
  financeView: boolean
  export: boolean
  intervene: boolean
  assignIntervention: boolean
  resolveException: boolean
  manageViews: boolean
  admin: boolean
}

export function cockpitRights(user: any): CockpitRights {
  return {
    view: hasRevenueOsPermission(user, 'revenue_os.cockpit.view', ['revenue_os.view']),
    executiveView: hasRevenueOsPermission(user, 'revenue_os.cockpit.executive_view'),
    commercialView: hasRevenueOsPermission(user, 'revenue_os.cockpit.commercial_view'),
    operationsView: hasRevenueOsPermission(user, 'revenue_os.cockpit.operations_view'),
    financeView: hasRevenueOsPermission(user, 'revenue_os.cockpit.finance_view'),
    export: hasRevenueOsPermission(user, 'revenue_os.cockpit.export'),
    intervene: hasRevenueOsPermission(user, 'revenue_os.cockpit.intervene'),
    assignIntervention: hasRevenueOsPermission(user, 'revenue_os.cockpit.assign_intervention'),
    resolveException: hasRevenueOsPermission(user, 'revenue_os.cockpit.resolve_exception'),
    manageViews: hasRevenueOsPermission(user, 'revenue_os.cockpit.manage_views'),
    admin: hasRevenueOsPermission(user, 'revenue_os.cockpit.admin'),
  }
}

export const cockpitTenantOf = (user: any, payload?: unknown): string => revenueOsTenantOf(user, payload)

export function cockpitActorOf(user: any, tenantId: string, requestedView?: string): CockpitActor {
  const actor = actorFromRevenueOsUser(user, { tenantId })
  return { ...actor, roleView: resolveRoleView(actor, requestedView) }
}

export function resolveRoleView(user: any, requestedView?: string): CockpitRoleView {
  const role = normalizeRevenueOsRole(user?.role ?? user?.role_key)
  const requested = String(requestedView || '').toLowerCase()
  if (['commercial', 'operations', 'finance', 'agent', 'executive'].includes(requested)) {
    return requested as CockpitRoleView
  }
  if (role.includes('finance')) return 'finance'
  if (role.includes('operation')) return 'operations'
  if (role.includes('commercial') || role.includes('sales') || role.includes('business')) return 'commercial'
  if (['agent', 'staff', 'commercial_agent', 'b2b_agent'].includes(role)) return 'agent'
  return 'executive'
}

export const cockpitError = (code: string, message: string, status = 400) =>
  revenueOsErrorResponse(new RevenueOsError(code, message, { status, recoverable: status >= 500 }))
