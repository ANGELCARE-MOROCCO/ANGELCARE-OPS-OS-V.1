import type { CompilerActor } from './types'
import {
  actorFromRevenueOsUser,
  hasRevenueOsPermission,
  revenueOsTenantOf,
} from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'

export function compilerRights(user: any) {
  return {
    view: hasRevenueOsPermission(user, 'revenue_os.mission_compiler.view', ['revenue_os.view']),
    compile: hasRevenueOsPermission(user, 'revenue_os.mission_compiler.compile'),
    recompile: hasRevenueOsPermission(user, 'revenue_os.mission_compiler.recompile'),
    resolve: hasRevenueOsPermission(user, 'revenue_os.mission_compiler.resolve'),
    rollback: hasRevenueOsPermission(user, 'revenue_os.mission_compiler.rollback'),
    prepare: hasRevenueOsPermission(user, 'revenue_os.mission_compiler.prepare_propagation'),
    acceptRisk: hasRevenueOsPermission(user, 'revenue_os.mission_compiler.accept_risk'),
  }
}

export const tenantOf = (user: any, payload?: unknown) => revenueOsTenantOf(user, payload)

export const actorOf = (user: any, tenantId: string): CompilerActor => {
  const actor = actorFromRevenueOsUser(user, { tenantId })
  return actor as CompilerActor
}

export const compilerError = (code: string, message: string, status = 400) =>
  revenueOsErrorResponse(new RevenueOsError(code, message, { status, recoverable: status >= 500 }))
