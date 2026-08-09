import { actorFromRevenueOsUser, hasRevenueOsPermission, revenueOsTenantOf } from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'

export function aiRights(user: any) {
  const authenticated = Boolean(user)
  return { read: authenticated, generate: authenticated, manage: authenticated }
}

export const apiError = (code: string, message: string, status = 400) =>
  revenueOsErrorResponse(new RevenueOsError(code, message, { status, recoverable: status >= 500 }))

export const tenantOf = (user: any, payload?: unknown) => revenueOsTenantOf(user, payload)
export const aiActorOf = (user: any, payload?: unknown) => actorFromRevenueOsUser(user, payload)
