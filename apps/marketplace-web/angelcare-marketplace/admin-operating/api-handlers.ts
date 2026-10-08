import { requireMarketplaceApiContext,requireMarketplaceWorkspaceApiContext } from '../auth/context'
import { apiFailure,apiSuccess,cleanOptionalText,parseJsonObject,requestId,requireText } from '../server/request'
import {
  addOperatingComment,assignOperatingCase,decideOperatingApproval,ensureOperatingCase,getOperatingDossier,getOperatingCaseWorkspaceKey,
  listOperatingCases,openOperatingException,recordRecoveryAction,requestOperatingApproval,reviewOperatingEvidence,
  submitOperatingEvidence,transitionOperatingCase,transitionOperatingException,
} from './repository'
import { assertUuid,operatingPriority,operatingRisk,textArray } from './validation'
import type { OperatingCaseStatus } from './types'

const obj=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}

export async function handleOperatingCases(request:Request){
 const id=requestId(request)
 try{
  if(request.method==='POST'){
   const b=await parseJsonObject(request)
   const workspaceKey=requireText(b.workspaceKey,'workspaceKey','Workspace',120)
   const context=await requireMarketplaceWorkspaceApiContext(workspaceKey,'marketplace.operating_kernel.manage')
   const data=await ensureOperatingCase({
    workspaceKey,entityType:requireText(b.entityType,'entityType','Type objet',120),entityId:assertUuid(b.entityId,'Identifiant objet'),title:requireText(b.title,'title','Titre',300),
    mission:cleanOptionalText(b.mission,1000),priority:operatingPriority(b.priority),riskLevel:operatingRisk(b.riskLevel),tenantId:cleanOptionalText(b.tenantId,80),territoryId:cleanOptionalText(b.territoryId,80),customerId:cleanOptionalText(b.customerId,80),organizationId:cleanOptionalText(b.organizationId,80),nextAction:cleanOptionalText(b.nextAction,1000),dueAt:cleanOptionalText(b.dueAt,80),blockers:textArray(b.blockers),financialExposure:Number(b.financialExposure||0),currencyLabel:cleanOptionalText(b.currencyLabel,20)||'Dh',sourceReference:cleanOptionalText(b.sourceReference,200),
   },context,id,request)
   return apiSuccess(data,{requestId:id,status:201})
  }
  const u=new URL(request.url),workspaceKey=u.searchParams.get('workspaceKey')||undefined
  const context=workspaceKey?await requireMarketplaceWorkspaceApiContext(workspaceKey,'marketplace.operating_kernel.view'):await requireMarketplaceApiContext('marketplace.operating_kernel.view')
  return apiSuccess(await listOperatingCases(context,{workspaceKey,status:u.searchParams.get('status')||undefined,priority:u.searchParams.get('priority')||undefined,query:u.searchParams.get('q')||undefined,limit:Number(u.searchParams.get('limit')||200)}),{requestId:id})
 }catch(e){return apiFailure(e,id)}
}

export async function handleOperatingCaseDossier(request:Request,caseId:string){const id=requestId(request);try{const cid=assertUuid(caseId,'Dossier'),workspaceKey=await getOperatingCaseWorkspaceKey(cid);return apiSuccess(await getOperatingDossier(cid,await requireMarketplaceWorkspaceApiContext(workspaceKey,'marketplace.operating_kernel.view')),{requestId:id})}catch(e){return apiFailure(e,id)}}

async function caseWorkspaceContext(caseId:string,permission:'marketplace.operating_kernel.manage'|'marketplace.operating_kernel.approve'){const workspaceKey=await getOperatingCaseWorkspaceKey(caseId);return requireMarketplaceWorkspaceApiContext(workspaceKey,permission)}

export async function handleOperatingCaseTransition(request:Request,caseId:string){const id=requestId(request);try{const cid=assertUuid(caseId,'Dossier');const context=await caseWorkspaceContext(cid,'marketplace.operating_kernel.manage');const b=await parseJsonObject(request);return apiSuccess(await transitionOperatingCase({caseId:cid,nextStatus:requireText(b.nextStatus,'nextStatus','Statut',60) as OperatingCaseStatus,reason:requireText(b.reason,'reason','Raison',2000),context,requestId:id,request}),{requestId:id})}catch(e){return apiFailure(e,id)}}

export async function handleOperatingCaseAssignment(request:Request,caseId:string){const id=requestId(request);try{const cid=assertUuid(caseId,'Dossier');const context=await caseWorkspaceContext(cid,'marketplace.operating_kernel.manage');const b=await parseJsonObject(request);return apiSuccess(await assignOperatingCase({caseId:cid,assigneeType:requireText(b.assigneeType,'assigneeType','Type assignee',40),assigneeId:assertUuid(b.assigneeId,'Assignee'),roleLabel:cleanOptionalText(b.roleLabel,120),reason:requireText(b.reason,'reason','Raison',1200),dueAt:cleanOptionalText(b.dueAt,80),context,requestId:id,request}),{requestId:id,status:201})}catch(e){return apiFailure(e,id)}}

export async function handleOperatingEvidence(request:Request,caseId:string){const id=requestId(request);try{const cid=assertUuid(caseId,'Dossier');const context=await caseWorkspaceContext(cid,'marketplace.operating_kernel.manage');const b=await parseJsonObject(request);return apiSuccess(await submitOperatingEvidence({caseId:cid,evidenceType:requireText(b.evidenceType,'evidenceType','Type de preuve',100),title:requireText(b.title,'title','Titre',300),sourceType:cleanOptionalText(b.sourceType,80)||'manual',sourceReference:cleanOptionalText(b.sourceReference,300),storageReference:cleanOptionalText(b.storageReference,1000),customerVisible:b.customerVisible===true,metadata:obj(b.metadata),context,requestId:id,request}),{requestId:id,status:201})}catch(e){return apiFailure(e,id)}}

export async function handleOperatingEvidenceReview(request:Request,evidenceId:string){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.operating_kernel.approve');const b=await parseJsonObject(request);const decision=String(b.decision||'');if(decision!=='validated'&&decision!=='rejected')throw new Error('Décision invalide');return apiSuccess(await reviewOperatingEvidence({evidenceId:assertUuid(evidenceId,'Preuve'),decision,reason:requireText(b.reason,'reason','Raison',2000),context,requestId:id,request}),{requestId:id})}catch(e){return apiFailure(e,id)}}

export async function handleOperatingApprovals(request:Request,caseId:string){const id=requestId(request);try{const cid=assertUuid(caseId,'Dossier');const context=await caseWorkspaceContext(cid,'marketplace.operating_kernel.manage');const b=await parseJsonObject(request);return apiSuccess(await requestOperatingApproval({caseId:cid,approvalKey:requireText(b.approvalKey,'approvalKey','Clé approbation',120),requiredRole:cleanOptionalText(b.requiredRole,120),evidenceIds:textArray(b.evidenceIds).map(v=>assertUuid(v,'Preuve')),metadata:obj(b.metadata),context,requestId:id,request}),{requestId:id,status:201})}catch(e){return apiFailure(e,id)}}

export async function handleOperatingApprovalDecision(request:Request,approvalId:string){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.operating_kernel.approve');const b=await parseJsonObject(request);const decision=String(b.decision||'');if(!['approved','rejected','returned_for_rework','cancelled'].includes(decision))throw new Error('Décision invalide');return apiSuccess(await decideOperatingApproval({approvalId:assertUuid(approvalId,'Approbation'),decision:decision as 'approved'|'rejected'|'returned_for_rework'|'cancelled',reason:requireText(b.reason,'reason','Raison',2000),context,requestId:id,request}),{requestId:id})}catch(e){return apiFailure(e,id)}}

export async function handleOperatingExceptions(request:Request,caseId:string){const id=requestId(request);try{const cid=assertUuid(caseId,'Dossier');const context=await caseWorkspaceContext(cid,'marketplace.operating_kernel.manage');const b=await parseJsonObject(request);return apiSuccess(await openOperatingException({caseId:cid,exceptionType:requireText(b.exceptionType,'exceptionType','Type exception',120),severity:['low','medium','high','critical'].includes(String(b.severity))?String(b.severity):'medium',summary:requireText(b.summary,'summary','Résumé',2000),nextAction:cleanOptionalText(b.nextAction,1000),dueAt:cleanOptionalText(b.dueAt,80),blockerCodes:textArray(b.blockerCodes),financialExposure:Number(b.financialExposure||0),context,requestId:id,request}),{requestId:id,status:201})}catch(e){return apiFailure(e,id)}}

export async function handleOperatingExceptionTransition(request:Request,exceptionId:string){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.operating_kernel.manage');const b=await parseJsonObject(request);return apiSuccess(await transitionOperatingException({exceptionId:assertUuid(exceptionId,'Exception'),nextStatus:requireText(b.nextStatus,'nextStatus','Statut',80),reason:requireText(b.reason,'reason','Raison',2000),context,requestId:id,request}),{requestId:id})}catch(e){return apiFailure(e,id)}}

export async function handleOperatingRecovery(request:Request,caseId:string){const id=requestId(request);try{const cid=assertUuid(caseId,'Dossier');const context=await caseWorkspaceContext(cid,'marketplace.operating_kernel.manage');const b=await parseJsonObject(request);return apiSuccess(await recordRecoveryAction({caseId:cid,exceptionId:b.exceptionId?assertUuid(b.exceptionId,'Exception'):null,actionType:requireText(b.actionType,'actionType','Type recovery',120),title:requireText(b.title,'title','Titre',300),reason:cleanOptionalText(b.reason,2000),idempotencyKey:cleanOptionalText(b.idempotencyKey,200),status:['planned','approved','in_progress','completed','failed','cancelled'].includes(String(b.status))?String(b.status):'planned',outcome:cleanOptionalText(b.outcome,2000),context,requestId:id,request}),{requestId:id,status:201})}catch(e){return apiFailure(e,id)}}

export async function handleOperatingComment(request:Request,caseId:string){const id=requestId(request);try{const cid=assertUuid(caseId,'Dossier');const context=await caseWorkspaceContext(cid,'marketplace.operating_kernel.manage');const b=await parseJsonObject(request);return apiSuccess(await addOperatingComment({caseId:cid,body:requireText(b.body,'body','Commentaire',5000),visibility:['internal','customer','partner','provider','vendor'].includes(String(b.visibility))?String(b.visibility):'internal',context,requestId:id,request}),{requestId:id,status:201})}catch(e){return apiFailure(e,id)}}
