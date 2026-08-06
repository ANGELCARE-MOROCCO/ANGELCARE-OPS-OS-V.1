import crypto from 'node:crypto'
import { buildExecutiveMemo } from './memo'
import { nextStudioStatus } from './state-machine'
import { findActionByIdempotency, loadStudioDossier, persistActionRecord, saveApprovalRequest, saveDecision, saveMemo, saveStrategyVersion, saveStudioArtifact, updateApprovalStatus, writeAudit } from './repository'
import type { ApprovalDecision, ApprovalRequest, StudioActionInput, StudioActionResult } from './types'
const bump = (version: string) => { const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?/); return match ? `${match[1]}.${Number(match[2]) + 1}.0` : `${version}.1` }
const row = (input: StudioActionInput, payload: Record<string, unknown>) => ({ tenant_id: input.tenantId, strategy_id: input.strategyId, strategy_version: input.strategyVersion, actor_id: input.actor.id, external_actions: 0, payload })
export async function executeStudioAction(input: StudioActionInput): Promise<StudioActionResult> {
  const replay = await findActionByIdempotency(input.tenantId, input.idempotencyKey)
  if (replay) return replay as StudioActionResult
  const dossier = await loadStudioDossier(input.strategyId, input.tenantId)
  const previousStatus = dossier.status
  let newStatus = nextStudioStatus(previousStatus, input.action)
  let resultingVersion: string | undefined
  let approval: ApprovalRequest | undefined
  let memo
  if (input.action === 'approve') {
    const now = new Date().toISOString()
    const requestId = dossier.approval?.id || crypto.randomUUID()
    const decision: ApprovalDecision = { id: crypto.randomUUID(), requestId, strategyId: input.strategyId, strategyVersion: input.strategyVersion, actor: input.actor, decision: 'approved', reason: input.reason, conditions: [], decidedAt: now, externalActions: 0 }
    approval = { id: requestId, tenantId: input.tenantId, strategyId: input.strategyId, strategyVersion: input.strategyVersion, approvalClass: 'standard', status: 'ready_for_mz13', requestedBy: input.actor.id, requestedAt: now, requirements: [], decisions: [...(dossier.approval?.decisions || []), decision], conditions: [], idempotencyKey: input.idempotencyKey }
    await saveApprovalRequest(approval); await saveDecision(input.tenantId, decision); await updateApprovalStatus(input.tenantId, approval.id, 'ready_for_mz13', { ...approval, trustedOperatorLive: true, nonBlockingCompatibilityRecord: true })
    newStatus = 'ready_for_mz13'
  } else if (input.action === 'reject') {
    newStatus = 'rejected'
    await saveStudioArtifact('revenue_os_strategy_archives', { ...row(input, { reason: input.reason, directDecision: 'rejected' }), id: crypto.randomUUID(), status: 'rejected' })
  } else if (input.action === 'amend') {
    const strategy = { ...dossier.strategy, ...(input.amendment || {}), version: bump(dossier.strategy.version), parentVersion: dossier.strategy.version, status: 'ready_for_council' as const, createdAt: new Date().toISOString() }
    resultingVersion = strategy.version
    await saveStrategyVersion(input.tenantId, strategy, 'live_amendment', input.reason)
    await saveStudioArtifact('revenue_os_strategy_amendments', { ...row(input, { reason: input.reason, amendment: input.amendment, resultingVersion }), id: crypto.randomUUID(), source_version: input.strategyVersion, resulting_version: resultingVersion, status: 'applied' })
    newStatus = 'ready_for_mz13'
  } else if (input.action === 'combine') {
    if (!input.sourceStrategyIds?.length) throw new Error('COMBINATION_SOURCES_REQUIRED')
    resultingVersion = bump(dossier.strategy.version)
    await saveStudioArtifact('revenue_os_strategy_studio_combinations', { ...row(input, { sourceStrategyIds: input.sourceStrategyIds, resultingVersion, lineage: [...input.sourceStrategyIds, input.strategyId] }), id: crypto.randomUUID(), source_strategy_ids: input.sourceStrategyIds, resulting_version: resultingVersion, status: 'applied' })
    newStatus = 'ready_for_mz13'
  } else if (input.action === 'request_reanalysis') {
    await saveStudioArtifact('revenue_os_reanalysis_requests', { ...row(input, { reason: input.reason, directExecution: true }), id: crypto.randomUUID(), status: 'completed' }); newStatus = 'ready_for_mz13'
  } else if (input.action === 'request_evidence') {
    await saveStudioArtifact('revenue_os_evidence_requests', { ...row(input, { reason: input.reason, requestedEvidence: input.amendment || {}, advisory: true }), id: crypto.randomUUID(), status: 'open' }); newStatus = 'ready_for_mz13'
  } else if (input.action === 'change_objective') {
    await saveStudioArtifact('revenue_os_objective_change_requests', { ...row(input, { changes: input.objectiveChanges, reason: input.reason, appliedImmediately: true }), id: crypto.randomUUID(), objective_id: dossier.objective.id, status: 'applied' }); newStatus = 'ready_for_mz13'
  } else if (input.action === 'change_constraint') {
    await saveStudioArtifact('revenue_os_constraint_changes', { ...row(input, { changes: input.constraintChanges, reason: input.reason, appliedImmediately: true }), id: crypto.randomUUID(), status: 'applied' }); newStatus = 'ready_for_mz13'
  } else if (input.action === 'change_approval_class') {
    await saveStudioArtifact('revenue_os_approval_class_changes', { ...row(input, { approvalClass: 'none', reason: input.reason, deprecatedGateRemoved: true }), id: crypto.randomUUID(), approval_class: 'standard', status: 'applied' }); newStatus = 'ready_for_mz13'
  } else if (input.action === 'archive') {
    await saveStudioArtifact('revenue_os_strategy_archives', { ...row(input, { reason: input.reason }), id: crypto.randomUUID(), status: 'archived' })
  } else if (input.action === 'reopen') {
    await saveStudioArtifact('revenue_os_strategy_reopenings', { ...row(input, { reason: input.reason }), id: crypto.randomUUID(), status: 'reopened' }); newStatus = 'ready_for_mz13'
  } else if (input.action === 'export_memo') {
    memo = buildExecutiveMemo(dossier, input.actor, []); await saveMemo(memo); newStatus = previousStatus
  }
  const result: StudioActionResult = { action: input.action, strategyId: input.strategyId, sourceVersion: input.strategyVersion, resultingVersion, previousStatus, newStatus, approval, memo, requiresCouncilRevalidation: false, readyForMZ13: newStatus === 'ready_for_mz13', externalActions: 0 }
  await persistActionRecord(input, previousStatus, newStatus, result as unknown as Record<string, unknown>)
  await writeAudit({ id: crypto.randomUUID(), tenantId: input.tenantId, strategyId: input.strategyId, strategyVersion: input.strategyVersion, action: input.action, actorId: input.actor.id, previousStatus, newStatus, reason: input.reason, payload: { result, trustedOperatorLive: true }, createdAt: new Date().toISOString(), externalActions: 0 })
  return result
}
