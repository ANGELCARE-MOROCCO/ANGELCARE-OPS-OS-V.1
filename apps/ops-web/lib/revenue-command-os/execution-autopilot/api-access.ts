import type { ExecutionActor } from './types'
import { actorFromRevenueOsUser, revenueOsTenantOf } from '../access'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse } from '../http'

export function executionRights(_user: any) {
  return { view:true, prepare:true, activate:true, approve:true, operate:true, rollback:true, admin:true }
}
export const tenantOf = (user:any,payload?:unknown)=>revenueOsTenantOf(user,payload)
export const actorOf=(user:any,tenantId:string):ExecutionActor=>actorFromRevenueOsUser(user,{tenantId}) as ExecutionActor
export const executionError=(code:string,message:string,status=400)=>revenueOsErrorResponse(new RevenueOsError(code,message,{status,recoverable:status>=500}))
