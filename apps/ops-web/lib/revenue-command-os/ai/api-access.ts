import { actorFromRevenueOsUser, hasRevenueOsPermission, revenueOsTenantOf } from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'

export function aiRights(user: any) {
  return {
    read: hasRevenueOsPermission(user, 'revenue_os.ai.view', ['revenue_os.view', 'revenue_os.strategy.view']),
    generate: hasRevenueOsPermission(user, 'revenue_os.ai.generate', ['revenue_os.strategy.manage']),
    manage: hasRevenueOsPermission(user, 'revenue_os.ai.manage'),
  }
}

export const apiError = (code: string, message: string, status = 400) =>
  revenueOsErrorResponse(new RevenueOsError(code, message, { status, recoverable: status >= 500 }))

export const tenantOf = (user: any, payload?: unknown) => revenueOsTenantOf(user, payload)
export const aiActorOf = (user: any, payload?: unknown) => actorFromRevenueOsUser(user, payload)
