import type { CompilerActor } from './types'
import {
  actorFromRevenueOsUser,
  hasRevenueOsPermission,
  revenueOsTenantOf,
} from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'

export function compilerRights(user: any) {
  const authenticated = Boolean(user)
  return { view: authenticated, compile: authenticated, recompile: authenticated, resolve: authenticated, rollback: authenticated, prepare: authenticated, acceptRisk: authenticated }
}

export const tenantOf = (user: any, payload?: unknown) => revenueOsTenantOf(user, payload)

export const actorOf = (user: any, tenantId: string): CompilerActor => {
  const actor = actorFromRevenueOsUser(user, { tenantId })
  return actor as CompilerActor
}

export const compilerError = (code: string, message: string, status = 400) =>
  revenueOsErrorResponse(new RevenueOsError(code, message, { status, recoverable: status >= 500 }))
