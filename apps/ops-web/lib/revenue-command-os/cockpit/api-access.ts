import { NextResponse } from 'next/server'
import type { CockpitActor, CockpitRoleView } from './types'

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
  const permissions = new Set<string>((Array.isArray(user?.permissions) ? user.permissions : []).map(String))
  const role = String(user?.role || user?.role_key || '').toLowerCase()
  const all = permissions.has('*') || ['admin','super_admin','managing_director','direction'].includes(role)
  return {
    view: all || permissions.has('revenue_os.cockpit.view') || permissions.has('revenue_os.view'),
    executiveView: all || permissions.has('revenue_os.cockpit.executive_view'),
    commercialView: all || permissions.has('revenue_os.cockpit.commercial_view'),
    operationsView: all || permissions.has('revenue_os.cockpit.operations_view'),
    financeView: all || permissions.has('revenue_os.cockpit.finance_view'),
    export: all || permissions.has('revenue_os.cockpit.export'),
    intervene: all || permissions.has('revenue_os.cockpit.intervene'),
    assignIntervention: all || permissions.has('revenue_os.cockpit.assign_intervention'),
    resolveException: all || permissions.has('revenue_os.cockpit.resolve_exception'),
    manageViews: all || permissions.has('revenue_os.cockpit.manage_views'),
    admin: all || permissions.has('revenue_os.cockpit.admin'),
  }
}

export const cockpitTenantOf = (user: any, payload?: any): string => String(payload?.tenantId || user?.tenant_id || user?.tenantId || user?.organization_id || 'angelcare')

export function cockpitActorOf(user: any, tenantId: string, requestedView?: string): CockpitActor {
  const permissions = Array.isArray(user?.permissions) ? user.permissions.map(String) : []
  return {
    id: String(user?.id || user?.email || 'current-user'),
    displayName: String(user?.full_name || user?.name || user?.email || 'Direction Revenue'),
    role: String(user?.role || user?.role_key || 'revenue_operator'),
    permissions,
    tenantId,
    roleView: resolveRoleView(user, requestedView),
  }
}

export function resolveRoleView(user: any, requestedView?: string): CockpitRoleView {
  const role = String(user?.role || user?.role_key || '').toLowerCase()
  const requested = String(requestedView || '').toLowerCase()
  if (requested === 'commercial' || requested === 'operations' || requested === 'finance' || requested === 'agent' || requested === 'executive') return requested
  if (role.includes('finance')) return 'finance'
  if (role.includes('operation')) return 'operations'
  if (role.includes('commercial') || role.includes('sales') || role.includes('business')) return 'commercial'
  if (['agent','staff','commercial_agent','b2b_agent'].includes(role)) return 'agent'
  return 'executive'
}

export const cockpitError = (code: string, message: string, status = 400) => NextResponse.json({ ok: false, error: { code, message } }, { status })
