import type { ApprovalClass, StudioActor } from './types'
import {
  actorFromRevenueOsUser,
  hasRevenueOsPermission,
  revenueOsTenantOf,
} from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'

export function studioRights(user: any) {
  const authenticated = Boolean(user)
  return { view: authenticated, review: authenticated, approve: authenticated, approveFinancial: authenticated, approveCapacity: authenticated, manageClass: authenticated, exportMemo: authenticated, manage: authenticated }
}

export function canApproveClass(user: any, approvalClass: ApprovalClass) {
  const rights = studioRights(user)
  if (!rights.approve) return false
  if (approvalClass === 'financial' || approvalClass === 'high_risk_exception') return rights.approveFinancial
  if (approvalClass === 'capacity') return rights.approveCapacity
  return true
}

export const tenantOf = (user: any, payload?: unknown) => revenueOsTenantOf(user, payload)

export const actorOf = (user: any): StudioActor => {
  const actor = actorFromRevenueOsUser(user)
  return {
    id: actor.id,
    displayName: actor.displayName,
    role: actor.role,
    permissions: actor.permissions,
  }
}

export const studioError = (code: string, message: string, status = 400) =>
  revenueOsErrorResponse(new RevenueOsError(code, message, { status, recoverable: status >= 500 }))
