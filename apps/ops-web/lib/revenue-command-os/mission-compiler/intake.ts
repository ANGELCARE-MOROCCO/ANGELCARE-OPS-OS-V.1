import { loadStudioDossier } from '../strategy-studio/repository'
import type { ApprovalDecision, ApprovalRequest } from '../strategy-studio/types'
import { hashObject } from './identifiers'
import type { CompilationEligibility, CompilationSource } from './types'
const readyStatuses=new Set(['approved','conditional_approval','ready_for_mz13'])
function latestApprovedDecision(approval:ApprovalRequest){return [...approval.decisions].reverse().find((d:ApprovalDecision)=>d.decision==='approved'||d.decision==='conditionally_approved')}
export async function loadAndValidateCompilationSource(input:{tenantId:string;strategyId:string;strategyVersion:string;approvalRequestId?:string;approvalDecisionId?:string}):Promise<CompilationEligibility>{
  const dossier=await loadStudioDossier(input.strategyId,input.tenantId);const blockers:string[]=[];const warnings:string[]=[];const reasons:string[]=[]
  if(dossier.strategy.version!==input.strategyVersion)blockers.push('STRATEGY_VERSION_MISMATCH')
  const approval=dossier.approval;if(!approval)throw new Error('MZ12_APPROVAL_REQUIRED')
  if(input.approvalRequestId&&approval.id!==input.approvalRequestId)blockers.push('APPROVAL_REQUEST_MISMATCH')
  if(!readyStatuses.has(approval.status))blockers.push('APPROVAL_NOT_READY_FOR_COMPILATION')
  if(approval.expiresAt&&new Date(approval.expiresAt).getTime()<=Date.now())blockers.push('APPROVAL_EXPIRED')
  const decision=input.approvalDecisionId?approval.decisions.find(d=>d.id===input.approvalDecisionId):latestApprovedDecision(approval)
  if(!decision)blockers.push('APPROVED_DECISION_NOT_FOUND')
  if(decision&&input.approvalDecisionId&&decision.id!==input.approvalDecisionId)blockers.push('APPROVAL_DECISION_MISMATCH')
  const failed=approval.conditions.filter(c=>c.status==='failed');if(failed.length)blockers.push(...failed.map(c=>`APPROVAL_CONDITION_FAILED:${c.id}`))
  const pending=approval.conditions.filter(c=>c.status==='pending');if(pending.length)warnings.push(...pending.map(c=>`APPROVAL_CONDITION_PENDING:${c.id}`))
  if(dossier.council.classification&&!dossier.council.classification.readyForMZ12)blockers.push('MZ11_CLASSIFICATION_NOT_READY')
  if(dossier.context.contradictions.length)warnings.push('SOURCE_CONTEXT_HAS_CONTRADICTIONS')
  if(!dossier.strategy.stopConditions.length)blockers.push('STRATEGY_STOP_CONDITIONS_MISSING')
  if(!dossier.strategy.fallbackPlan.length)blockers.push('STRATEGY_FALLBACK_MISSING')
  reasons.push(`strategy:${dossier.strategy.id}@${dossier.strategy.version}`,`approval:${approval.id}`,`conditions:${approval.conditions.length}`)
  const source:CompilationSource={tenantId:input.tenantId,objective:dossier.objective,strategy:dossier.strategy,dossier,approval,approvalDecisionId:decision?.id||input.approvalDecisionId||'',approvalConditions:approval.conditions,councilRunId:undefined,contextHash:hashObject({context:dossier.context,objective:dossier.objective,strategy:dossier.strategy.version,approval:approval.id})}
  return{eligible:blockers.length===0,conditional:approval.conditions.length>0,reasons,blockers,warnings,source}
}
