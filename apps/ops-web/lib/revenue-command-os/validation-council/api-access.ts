import { hasRevenueOsPermission, revenueOsTenantOf } from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'
import { aiRights } from '../ai/api-access'

export function councilRights(user: any) {
  const authenticated = Boolean(user)
  return { read: authenticated, run: authenticated, manage: authenticated }
}

export const tenantOf = (user: any, payload?: unknown) => revenueOsTenantOf(user, payload)
export const councilError = (code: string, message: string, status = 400) =>
  revenueOsErrorResponse(new RevenueOsError(code, message, { status, recoverable: status >= 500 }))
