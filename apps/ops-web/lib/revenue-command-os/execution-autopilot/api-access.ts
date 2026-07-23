import type { ExecutionActor } from './types'
import {
  actorFromRevenueOsUser,
  hasRevenueOsPermission,
  revenueOsTenantOf,
} from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'

export function executionRights(user: any) {
  return {
    view: hasRevenueOsPermission(user, 'revenue_os.execution.view', ['revenue_os.view']),
    prepare: hasRevenueOsPermission(user, 'revenue_os.execution.prepare'),
    activate: hasRevenueOsPermission(user, 'revenue_os.execution.activate'),
    approve: hasRevenueOsPermission(user, 'revenue_os.execution.approve'),
    operate: hasRevenueOsPermission(user, 'revenue_os.execution.operate'),
    rollback: hasRevenueOsPermission(user, 'revenue_os.execution.rollback'),
    admin: hasRevenueOsPermission(user, 'revenue_os.execution.admin'),
  }
}

export const tenantOf = (user: any, payload?: unknown) => revenueOsTenantOf(user, payload)

export const actorOf = (user: any, tenantId: string): ExecutionActor => {
  const actor = actorFromRevenueOsUser(user, { tenantId })
  return actor as ExecutionActor
}

export const executionError = (code: string, message: string, status = 400) =>
  revenueOsErrorResponse(new RevenueOsError(code, message, { status, recoverable: status >= 500 }))
