import { hasRevenueOsPermission, revenueOsTenantOf } from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'
import { aiRights } from '../ai/api-access'

export function councilRights(user: any) {
  const ai = aiRights(user)
  return {
    read: ai.read || hasRevenueOsPermission(user, 'revenue_os.council.view'),
    run: ai.generate || hasRevenueOsPermission(user, 'revenue_os.council.run'),
    manage: ai.manage || hasRevenueOsPermission(user, 'revenue_os.council.manage'),
  }
}

export const tenantOf = (user: any, payload?: unknown) => revenueOsTenantOf(user, payload)
export const councilError = (code: string, message: string, status = 400) =>
  revenueOsErrorResponse(new RevenueOsError(code, message, { status, recoverable: status >= 500 }))
