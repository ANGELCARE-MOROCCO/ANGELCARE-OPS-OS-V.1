import crypto from 'node:crypto'
import { actorSatisfies, buildApprovalRequirements, conditionsSatisfied } from './authority'
import { buildExecutiveMemo } from './memo'
import { nextStudioStatus } from './state-machine'
import { findActionByIdempotency, loadStudioDossier, persistActionRecord, saveApprovalRequest, saveDecision, saveMemo, saveStrategyVersion, saveStudioArtifact, updateApprovalStatus, writeAudit } from './repository'
import type { ApprovalCondition, ApprovalDecision, ApprovalRequest, StudioActionInput, StudioActionResult, StudioStatus } from './types'

const bump=(version:string)=>{const m=version.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);if(!m)return`${version}.1`;return`${m[1]}.${Number(m[2])+1}.0`}
const row=(input:StudioActionInput,payload:Record<string,unknown>)=>({tenant_id:input.tenantId,strategy_id:input.strategyId,strategy_version:input.strategyVersion,actor_id:input.actor.id,external_actions:0,payload})
export async function executeStudioAction(input:StudioActionInput):Promise<StudioActionResult>{
  const replay=await findActionByIdempotency(input.tenantId,input.idempotencyKey);if(replay)return replay as StudioActionResult
  const dossier=await loadStudioDossier(input.strategyId,input.tenantId);if(dossier.strategy.version!==input.strategyVersion&&dossier.versions.length)throw new Error('STRATEGY_VERSION_CONFLICT')
  const previousStatus=dossier.status;const conditional=Boolean(input.conditions?.length);let newStatus=nextStudioStatus(previousStatus,input.action,conditional);let resultingVersion:string|undefined;let approval:ApprovalRequest|undefined;let memo;let requiresCouncilRevalidation=false
  if(input.action==='approve'){
    const approvalClass=input.approvalClass||dossier.approval?.approvalClass||'standard';if(!actorSatisfies(input.actor,approvalClass))throw new Error('APPROVAL_AUTHORITY_INSUFFICIENT')
    const councilReady=Boolean(dossier.council.classification?.readyForMZ12);if(!councilReady)throw new Error('COUNCIL_CLASSIFICATION_NOT_READY')
    const conditions=(input.conditions||[]).map(c=>({...c,id:c.id||crypto.randomUUID(),machineReadable:true as const,evidenceIds:c.evidenceIds||[]}))
    approval=dossier.approval||{id:crypto.randomUUID(),tenantId:input.tenantId,strategyId:input.strategyId,strategyVersion:input.strategyVersion,approvalClass,status:newStatus,requestedBy:input.actor.id,requestedAt:new Date().toISOString(),requirements:buildApprovalRequirements(input.strategyId,input.strategyVersion,approvalClass),decisions:[],conditions,expiresAt:undefined,idempotencyKey:input.idempotencyKey}
    const decision:ApprovalDecision={id:crypto.randomUUID(),requestId:approval.id,strategyId:input.strategyId,strategyVersion:input.strategyVersion,actor:input.actor,decision:conditional?'conditionally_approved':'approved',reason:input.reason,conditions,decidedAt:new Date().toISOString(),externalActions:0}
    approval={...approval,approvalClass,conditions,decisions:[...(approval.decisions||[]),decision]}
    const required=Math.max(...approval.requirements.map(r=>r.minimumDecisions),1);const distinctApprovers=new Set(approval.decisions.map(d=>d.actor.id)).size;const authoritySatisfied=distinctApprovers>=required
    approval.requirements=approval.requirements.map(r=>({...r,status:authoritySatisfied?'satisfied':'pending'}))
    if(conditional)newStatus='conditional_approval';else if(authoritySatisfied&&conditionsSatisfied(conditions))newStatus='ready_for_mz13';else newStatus='under_review'
    approval.status=newStatus;await saveApprovalRequest(approval);await saveDecision(input.tenantId,decision);await updateApprovalStatus(input.tenantId,approval.id,newStatus,{...approval,status:newStatus})
  }else if(input.action==='reject'){
    const approvalClass=input.approvalClass||dossier.approval?.approvalClass||'standard'
    approval=dossier.approval||{id:crypto.randomUUID(),tenantId:input.tenantId,strategyId:input.strategyId,strategyVersion:input.strategyVersion,approvalClass,status:'rejected',requestedBy:input.actor.id,requestedAt:new Date().toISOString(),requirements:buildApprovalRequirements(input.strategyId,input.strategyVersion,approvalClass),decisions:[],conditions:[],expiresAt:undefined,idempotencyKey:input.idempotencyKey}
    const decision:ApprovalDecision={id:crypto.randomUUID(),requestId:approval.id,strategyId:input.strategyId,strategyVersion:input.strategyVersion,actor:input.actor,decision:'rejected',reason:input.reason,conditions:approval.conditions||[],decidedAt:new Date().toISOString(),externalActions:0}
    approval={...approval,approvalClass,status:'rejected',decisions:[...(approval.decisions||[]),decision]}
    await saveApprovalRequest(approval);await saveDecision(input.tenantId,decision);await updateApprovalStatus(input.tenantId,approval.id,'rejected',{...approval})
  }else if(input.action==='amend'){
    const strategy={...dossier.strategy,...(input.amendment||{}),version:bump(dossier.strategy.version),parentVersion:dossier.strategy.version,status:'draft' as const,createdAt:new Date().toISOString()};resultingVersion=strategy.version;requiresCouncilRevalidation=true;await saveStrategyVersion(input.tenantId,strategy,'mz12_amendment',input.reason);await saveStudioArtifact('revenue_os_strategy_amendments',{...row(input,{reason:input.reason,amendment:input.amendment,resultingVersion}),id:crypto.randomUUID(),source_version:input.strategyVersion,resulting_version:resultingVersion,status:'draft'})
  }else if(input.action==='combine'){
    if(!input.sourceStrategyIds?.length)throw new Error('COMBINATION_SOURCES_REQUIRED');resultingVersion=bump(dossier.strategy.version);requiresCouncilRevalidation=true;await saveStudioArtifact('revenue_os_strategy_studio_combinations',{...row(input,{sourceStrategyIds:input.sourceStrategyIds,resultingVersion,lineage:[...input.sourceStrategyIds,input.strategyId]}),id:crypto.randomUUID(),source_strategy_ids:input.sourceStrategyIds,resulting_version:resultingVersion,status:'needs_council_revalidation'})
  }else if(input.action==='request_reanalysis'){
    requiresCouncilRevalidation=true;await saveStudioArtifact('revenue_os_reanalysis_requests',{...row(input,{reason:input.reason}),id:crypto.randomUUID(),status:'open'})
  }else if(input.action==='request_evidence'){
    await saveStudioArtifact('revenue_os_evidence_requests',{...row(input,{reason:input.reason,requestedEvidence:input.amendment||{}}),id:crypto.randomUUID(),status:'open'})
    if(dossier.approval){approval={...dossier.approval,status:'evidence_requested'};await updateApprovalStatus(input.tenantId,dossier.approval.id,'evidence_requested',{...approval})}
  }else if(input.action==='change_objective'){
    requiresCouncilRevalidation=true;await saveStudioArtifact('revenue_os_objective_change_requests',{...row(input,{changes:input.objectiveChanges,reason:input.reason}),id:crypto.randomUUID(),objective_id:dossier.objective.id,status:'pending_reanalysis'})
  }else if(input.action==='change_constraint'){
    requiresCouncilRevalidation=true;await saveStudioArtifact('revenue_os_constraint_changes',{...row(input,{changes:input.constraintChanges,reason:input.reason}),id:crypto.randomUUID(),status:'pending_reanalysis'})
  }else if(input.action==='change_approval_class'){
    if(!input.approvalClass)throw new Error('APPROVAL_CLASS_REQUIRED');await saveStudioArtifact('revenue_os_approval_class_changes',{...row(input,{approvalClass:input.approvalClass,reason:input.reason}),id:crypto.randomUUID(),approval_class:input.approvalClass,status:'applied'})
  }else if(input.action==='archive'){
    await saveStudioArtifact('revenue_os_strategy_archives',{...row(input,{reason:input.reason}),id:crypto.randomUUID(),status:'archived'})
  }else if(input.action==='reopen'){
    await saveStudioArtifact('revenue_os_strategy_reopenings',{...row(input,{reason:input.reason}),id:crypto.randomUUID(),status:'reopened'})
  }else if(input.action==='export_memo'){
    memo=buildExecutiveMemo(dossier,input.actor,input.conditions||[]);await saveMemo(memo);newStatus=previousStatus
  }
  const result:StudioActionResult={action:input.action,strategyId:input.strategyId,sourceVersion:input.strategyVersion,resultingVersion,previousStatus,newStatus,approval,memo,requiresCouncilRevalidation,readyForMZ13:newStatus==='ready_for_mz13',externalActions:0}
  await persistActionRecord(input,previousStatus,newStatus,result as unknown as Record<string,unknown>)
  await writeAudit({id:crypto.randomUUID(),tenantId:input.tenantId,strategyId:input.strategyId,strategyVersion:input.strategyVersion,action:input.action,actorId:input.actor.id,previousStatus,newStatus,reason:input.reason,payload:{result},createdAt:new Date().toISOString(),externalActions:0})
  return result
}
