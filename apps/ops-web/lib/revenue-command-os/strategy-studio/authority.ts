import crypto from 'node:crypto'
import type { ApprovalClass, ApprovalCondition, ApprovalRequirement, StudioActor } from './types'

const roleMap:Record<ApprovalClass,string[]>= {
  standard:['direction','managing_director','ceo'],
  financial:['finance_director','managing_director','ceo'],
  capacity:['operations_director','managing_director','ceo'],
  managing_director:['managing_director','ceo'],
  multi_director:['managing_director','finance_director','operations_director','ceo'],
  conditional_pilot:['direction','managing_director','ceo'],
  high_risk_exception:['managing_director','ceo'],
}
export function buildApprovalRequirements(strategyId:string,strategyVersion:string,approvalClass:ApprovalClass):ApprovalRequirement[]{
  const roles=roleMap[approvalClass]
  return [{id:crypto.randomUUID(),strategyId,strategyVersion,approvalClass,requiredRoles:roles,minimumDecisions:approvalClass==='multi_director'?2:1,unanimous:approvalClass==='multi_director',status:'pending'}]
}
export function actorSatisfies(actor:StudioActor,approvalClass:ApprovalClass){
  const role=actor.role.toLowerCase()
  return roleMap[approvalClass].includes(role)||actor.permissions.includes('*')||actor.permissions.includes(`revenue_os.strategy_studio.approve_${approvalClass}`)
}
export function conditionsSatisfied(conditions:ApprovalCondition[]){return conditions.every(x=>x.status==='satisfied'||x.status==='waived')}
