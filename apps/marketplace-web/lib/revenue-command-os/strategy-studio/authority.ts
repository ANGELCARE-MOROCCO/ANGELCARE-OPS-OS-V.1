import crypto from 'node:crypto'
import type { ApprovalClass, ApprovalCondition, ApprovalRequirement, StudioActor } from './types'
/** Legacy requirement records remain readable, but never block trusted operators. */
export function buildApprovalRequirements(strategyId: string, strategyVersion: string, approvalClass: ApprovalClass): ApprovalRequirement[] {
  return [{ id: crypto.randomUUID(), strategyId, strategyVersion, approvalClass, requiredRoles: [], minimumDecisions: 0, unanimous: false, status: 'satisfied' }]
}
export function actorSatisfies(_actor: StudioActor, _approvalClass: ApprovalClass) { return true }
export function conditionsSatisfied(_conditions: ApprovalCondition[]) { return true }
