import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { getUltraMz1Workspace } from './workspace-registry'
import { assertOperatingCaseTransition } from './validation'
import type {
  OperatingApproval,
  OperatingAssignment,
  OperatingCase,
  OperatingCaseInput,
  OperatingComment,
  OperatingDossierData,
  OperatingEvidence,
  OperatingException,
  OperatingRecoveryAction,
  OperatingTimelineEvent,
} from './types'

const rows = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : []
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''

function fail(action: string, error: unknown): never {
  const candidate = error && typeof error === 'object' ? error as { code?: string; message?: string } : null
  const missing = candidate?.code === '42P01' || candidate?.code === '42883'
  throw new MarketplaceError(
    missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missing
      ? 'La migration Ultra MZ1 Operating Kernel doit être appliquée.'
      : `Impossible de ${action}.`,
    { cause: error, retryable: true },
  )
}

function scopeQuery(query: any, context: MarketplaceRequestContext) {
  if (context.roleKeys.includes('marketplace_admin')) return query
  if (context.tenantId) return query.eq('tenant_id', context.tenantId)
  if (context.territoryId) return query.eq('territory_id', context.territoryId)
  return query
}

function assertWorkspace(workspaceKey: string) {
  const workspace = getUltraMz1Workspace(workspaceKey)
  if (!workspace) throw new MarketplaceError('VALIDATION_ERROR', 'Workspace Ultra MZ1 inconnu.')
  return workspace
}

export async function getOperatingCaseWorkspaceKey(caseId:string):Promise<string>{
  const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_operating_cases').select('workspace_key').eq('id',caseId).single()
  if(error||!data)fail('résoudre le workspace du dossier',error)
  return String(data.workspace_key)
}

export async function listOperatingCases(
  context: MarketplaceRequestContext,
  filters: { workspaceKey?: string; status?: string; priority?: string; query?: string; limit?: number } = {},
): Promise<OperatingCase[]> {
  const db = await createServiceClient()
  let query = db.from('angelcare_marketplace_operating_cases').select('*').order('updated_at', { ascending: false })
  if (filters.workspaceKey) query = query.eq('workspace_key', filters.workspaceKey)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.query) {
    const safe = filters.query.replaceAll('%','').replaceAll(',',' ').slice(0,120)
    query = query.or(`public_reference.ilike.%${safe}%,title.ilike.%${safe}%,source_reference.ilike.%${safe}%`)
  }
  query = scopeQuery(query, context).limit(Math.min(filters.limit || 200, 500))
  const { data, error } = await query
  if (error) fail('charger les dossiers opérationnels', error)
  return rows<OperatingCase>(data)
}

export async function ensureOperatingCase(
  input: OperatingCaseInput,
  context: MarketplaceRequestContext,
  requestId: string,
  request?: Request,
): Promise<OperatingCase> {
  const workspace = assertWorkspace(input.workspaceKey)
  const db = await createServiceClient()
  const { data, error } = await db.rpc('angelcare_marketplace_operating_case_ensure', {
    p_workspace_key: workspace.key,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId,
    p_title: input.title,
    p_actor_id: context.actor.id,
    p_tenant_id: input.tenantId || context.tenantId,
    p_territory_id: input.territoryId || context.territoryId,
    p_source_reference: input.sourceReference || null,
  })
  if (error || !data) fail('matérialiser le dossier opérationnel', error)
  const base = data as OperatingCase
  const patch: Record<string, unknown> = {
    mission: input.mission || workspace.mission,
    priority: input.priority || base.priority,
    risk_level: input.riskLevel || base.risk_level,
    customer_id: input.customerId || null,
    organization_id: input.organizationId || null,
    next_action: input.nextAction || base.next_action,
    due_at: input.dueAt || base.due_at,
    blockers: input.blockers || base.blockers || [],
    financial_exposure: input.financialExposure ?? base.financial_exposure ?? 0,
    currency_label: input.currencyLabel || base.currency_label || 'Dh',
    updated_by: context.actor.id,
    updated_at: new Date().toISOString(),
  }
  const { data: updated, error: updateError } = await db
    .from('angelcare_marketplace_operating_cases')
    .update(patch)
    .eq('id', base.id)
    .select('*')
    .single()
  if (updateError || !updated) fail('compléter le dossier opérationnel', updateError)
  await writeMarketplaceAudit({context,requestId,request,action:'operating.case.ensure',objectType:input.entityType,objectId:input.entityId,afterValue:updated,source:'ultra-mz1-operating-kernel'})
  return updated as OperatingCase
}

export async function getOperatingDossier(caseId: string, context: MarketplaceRequestContext): Promise<OperatingDossierData> {
  const db = await createServiceClient()
  let caseQuery = db.from('angelcare_marketplace_operating_cases').select('*').eq('id', caseId)
  caseQuery = scopeQuery(caseQuery, context)
  const [caseRes,assignmentRes,timelineRes,evidenceRes,approvalRes,exceptionRes,recoveryRes,commentRes] = await Promise.all([
    caseQuery.maybeSingle(),
    db.from('angelcare_marketplace_operating_assignments').select('*').eq('case_id',caseId).eq('status','active').order('assigned_at',{ascending:false}).limit(1).maybeSingle(),
    db.from('angelcare_marketplace_operating_timeline').select('*').eq('case_id',caseId).order('created_at',{ascending:false}).limit(200),
    db.from('angelcare_marketplace_operating_evidence').select('*').eq('case_id',caseId).order('submitted_at',{ascending:false}),
    db.from('angelcare_marketplace_operating_approvals').select('*').eq('case_id',caseId).order('requested_at',{ascending:false}),
    db.from('angelcare_marketplace_operating_exceptions').select('*').eq('case_id',caseId).order('updated_at',{ascending:false}),
    db.from('angelcare_marketplace_operating_recovery_actions').select('*').eq('case_id',caseId).order('requested_at',{ascending:false}),
    db.from('angelcare_marketplace_operating_comments').select('*').eq('case_id',caseId).order('created_at',{ascending:false}).limit(100),
  ])
  for (const response of [caseRes,assignmentRes,timelineRes,evidenceRes,approvalRes,exceptionRes,recoveryRes,commentRes]) {
    if (response.error) fail('hydrater le dossier opérationnel', response.error)
  }
  if (!caseRes.data) throw new MarketplaceError('NOT_FOUND','Dossier opérationnel introuvable.')
  return {
    case: caseRes.data as OperatingCase,
    assignment: assignmentRes.data as OperatingAssignment | null,
    timeline: rows<OperatingTimelineEvent>(timelineRes.data),
    evidence: rows<OperatingEvidence>(evidenceRes.data),
    approvals: rows<OperatingApproval>(approvalRes.data),
    exceptions: rows<OperatingException>(exceptionRes.data),
    recoveries: rows<OperatingRecoveryAction>(recoveryRes.data),
    comments: rows<OperatingComment>(commentRes.data),
  }
}

export async function transitionOperatingCase(input:{caseId:string;nextStatus:OperatingCase['status'];reason:string;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const before = await getOperatingDossier(input.caseId,input.context)
  assertOperatingCaseTransition(before.case.status,input.nextStatus)
  const db=await createServiceClient()
  const {data,error}=await db.rpc('angelcare_marketplace_operating_case_transition',{p_case_id:input.caseId,p_next_status:input.nextStatus,p_reason:input.reason,p_actor_id:input.context.actor.id,p_request_id:input.requestId})
  if(error||!data)fail('faire évoluer le dossier opérationnel',error)
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:`operating.case.${input.nextStatus}`,objectType:before.case.entity_type,objectId:before.case.entity_id,beforeValue:before.case,afterValue:data,reason:input.reason,severity:['blocked','recovery','cancelled'].includes(input.nextStatus)?'warning':'info',source:'ultra-mz1-operating-kernel'})
  return data as OperatingCase
}

export async function assignOperatingCase(input:{caseId:string;assigneeType:string;assigneeId:string;roleLabel:string|null;reason:string;dueAt:string|null;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const db=await createServiceClient()
  const {data,error}=await db.rpc('angelcare_marketplace_operating_assignment_set',{p_case_id:input.caseId,p_assignee_type:input.assigneeType,p_assignee_id:input.assigneeId,p_role_label:input.roleLabel,p_reason:input.reason,p_due_at:input.dueAt,p_actor_id:input.context.actor.id,p_request_id:input.requestId})
  if(error||!data)fail('affecter le dossier opérationnel',error)
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:'operating.case.assigned',objectType:'operating_case',objectId:input.caseId,afterValue:data,reason:input.reason,source:'ultra-mz1-operating-kernel'})
  return data as OperatingAssignment
}

export async function submitOperatingEvidence(input:{caseId:string;evidenceType:string;title:string;sourceType:string;sourceReference:string|null;storageReference:string|null;customerVisible:boolean;metadata:Record<string,unknown>;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const db=await createServiceClient()
  const payload={case_id:input.caseId,evidence_type:input.evidenceType,title:input.title,source_type:input.sourceType,source_reference:input.sourceReference,storage_reference:input.storageReference,customer_visible:input.customerVisible,submitted_by:input.context.actor.id,metadata:input.metadata}
  const {data,error}=await db.from('angelcare_marketplace_operating_evidence').insert(payload).select('*').single()
  if(error||!data)fail('soumettre la preuve opérationnelle',error)
  await db.from('angelcare_marketplace_operating_timeline').insert({case_id:input.caseId,event_kind:'evidence',action:'evidence.submitted',actor_id:input.context.actor.id,request_id:input.requestId,source:'operating-kernel',metadata:{evidence_id:data.id,evidence_type:input.evidenceType}})
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:'operating.evidence.submitted',objectType:'operating_case',objectId:input.caseId,afterValue:data,source:'ultra-mz1-operating-kernel'})
  return data as OperatingEvidence
}

export async function reviewOperatingEvidence(input:{evidenceId:string;decision:'validated'|'rejected';reason:string;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const db=await createServiceClient()
  const {data,error}=await db.from('angelcare_marketplace_operating_evidence').update({validation_status:input.decision,reviewed_by:input.context.actor.id,reviewed_at:new Date().toISOString(),review_reason:input.reason,updated_at:new Date().toISOString()}).eq('id',input.evidenceId).in('validation_status',['submitted','under_review']).select('*').single()
  if(error||!data)fail('réviser la preuve opérationnelle',error)
  await db.from('angelcare_marketplace_operating_timeline').insert({case_id:data.case_id,event_kind:'evidence',action:`evidence.${input.decision}`,actor_id:input.context.actor.id,reason:input.reason,request_id:input.requestId,source:'operating-kernel',metadata:{evidence_id:data.id}})
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:`operating.evidence.${input.decision}`,objectType:'operating_evidence',objectId:String(data.id),afterValue:data,reason:input.reason,source:'ultra-mz1-operating-kernel'})
  return data as OperatingEvidence
}

export async function requestOperatingApproval(input:{caseId:string;approvalKey:string;requiredRole:string|null;evidenceIds:string[];metadata:Record<string,unknown>;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const db=await createServiceClient()
  const {data:latest}=await db.from('angelcare_marketplace_operating_approvals').select('version').eq('case_id',input.caseId).eq('approval_key',input.approvalKey).order('version',{ascending:false}).limit(1).maybeSingle()
  const version=Number(latest?.version||0)+1
  const {data,error}=await db.from('angelcare_marketplace_operating_approvals').insert({case_id:input.caseId,approval_key:input.approvalKey,version,required_role:input.requiredRole,requested_by:input.context.actor.id,evidence_ids:input.evidenceIds,metadata:input.metadata}).select('*').single()
  if(error||!data)fail('demander l’approbation',error)
  await db.from('angelcare_marketplace_operating_cases').update({status:'approval_pending',updated_by:input.context.actor.id,updated_at:new Date().toISOString()}).eq('id',input.caseId).neq('status','closed')
  await db.from('angelcare_marketplace_operating_timeline').insert({case_id:input.caseId,event_kind:'approval',action:'approval.requested',actor_id:input.context.actor.id,request_id:input.requestId,source:'operating-kernel',metadata:{approval_id:data.id,approval_key:input.approvalKey,version}})
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:'operating.approval.requested',objectType:'operating_case',objectId:input.caseId,afterValue:data,source:'ultra-mz1-operating-kernel'})
  return data as OperatingApproval
}

export async function decideOperatingApproval(input:{approvalId:string;decision:'approved'|'rejected'|'returned_for_rework'|'cancelled';reason:string;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const db=await createServiceClient()
  const {data,error}=await db.rpc('angelcare_marketplace_operating_approval_decide',{p_approval_id:input.approvalId,p_decision:input.decision,p_reason:input.reason,p_actor_id:input.context.actor.id,p_request_id:input.requestId})
  if(error||!data)fail('décider l’approbation',error)
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:`operating.approval.${input.decision}`,objectType:'operating_approval',objectId:input.approvalId,afterValue:data,reason:input.reason,source:'ultra-mz1-operating-kernel'})
  return data as OperatingApproval
}

export async function openOperatingException(input:{caseId:string;exceptionType:string;severity:string;summary:string;nextAction:string|null;dueAt:string|null;blockerCodes:string[];financialExposure:number;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const db=await createServiceClient()
  const {data,error}=await db.from('angelcare_marketplace_operating_exceptions').insert({case_id:input.caseId,exception_type:input.exceptionType,severity:input.severity,summary:input.summary,next_action:input.nextAction,due_at:input.dueAt,blocker_codes:input.blockerCodes,financial_exposure:input.financialExposure,owner_id:input.context.actor.id,created_by:input.context.actor.id}).select('*').single()
  if(error||!data)fail('ouvrir l’exception opérationnelle',error)
  await db.from('angelcare_marketplace_operating_cases').update({status:'blocked',risk_level:input.severity==='critical'?'critical':'high',next_action:input.nextAction,updated_by:input.context.actor.id,updated_at:new Date().toISOString()}).eq('id',input.caseId).neq('status','closed')
  await db.from('angelcare_marketplace_operating_timeline').insert({case_id:input.caseId,event_kind:'exception',action:'exception.opened',actor_id:input.context.actor.id,request_id:input.requestId,source:'operating-kernel',metadata:{exception_id:data.id,exception_type:input.exceptionType,severity:input.severity}})
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:'operating.exception.opened',objectType:'operating_case',objectId:input.caseId,afterValue:data,severity:input.severity==='critical'?'critical':'warning',source:'ultra-mz1-operating-kernel'})
  return data as OperatingException
}

export async function transitionOperatingException(input:{exceptionId:string;nextStatus:string;reason:string;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const db=await createServiceClient()
  const {data,error}=await db.rpc('angelcare_marketplace_operating_exception_transition',{p_exception_id:input.exceptionId,p_next_status:input.nextStatus,p_reason:input.reason,p_actor_id:input.context.actor.id,p_request_id:input.requestId})
  if(error||!data)fail('faire évoluer l’exception',error)
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:`operating.exception.${input.nextStatus}`,objectType:'operating_exception',objectId:input.exceptionId,afterValue:data,reason:input.reason,source:'ultra-mz1-operating-kernel'})
  return data as OperatingException
}

export async function recordRecoveryAction(input:{caseId:string;exceptionId:string|null;actionType:string;title:string;reason:string|null;idempotencyKey:string|null;status:string;outcome:string|null;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const db=await createServiceClient()
  const key=input.idempotencyKey||crypto.randomUUID()
  const {data,error}=await db.from('angelcare_marketplace_operating_recovery_actions').insert({case_id:input.caseId,exception_id:input.exceptionId,action_type:input.actionType,title:input.title,reason:input.reason,idempotency_key:key,status:input.status,requested_by:input.context.actor.id,executed_by:input.status==='completed'?input.context.actor.id:null,executed_at:input.status==='completed'?new Date().toISOString():null,outcome:input.outcome}).select('*').single()
  if(error){if((error as {code?:string}).code==='23505')throw new MarketplaceError('CONFLICT','Cette action de recovery a déjà été enregistrée.');fail('enregistrer l’action de recovery',error)}
  await db.from('angelcare_marketplace_operating_cases').update({status:input.status==='completed'?'in_progress':'recovery',updated_by:input.context.actor.id,updated_at:new Date().toISOString()}).eq('id',input.caseId).neq('status','closed')
  await db.from('angelcare_marketplace_operating_timeline').insert({case_id:input.caseId,event_kind:'recovery',action:`recovery.${input.status}`,actor_id:input.context.actor.id,reason:input.reason,request_id:input.requestId,source:'operating-kernel',metadata:{recovery_action_id:data.id,action_type:input.actionType,idempotency_key:key}})
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:`operating.recovery.${input.status}`,objectType:'operating_case',objectId:input.caseId,afterValue:data,reason:input.reason,severity:input.status==='failed'?'warning':'info',source:'ultra-mz1-operating-kernel'})
  return data as OperatingRecoveryAction
}

export async function addOperatingComment(input:{caseId:string;body:string;visibility:string;context:MarketplaceRequestContext;requestId:string;request?:Request}) {
  const db=await createServiceClient()
  const {data,error}=await db.from('angelcare_marketplace_operating_comments').insert({case_id:input.caseId,author_id:input.context.actor.id,body:input.body,visibility:input.visibility}).select('*').single()
  if(error||!data)fail('ajouter la note opérationnelle',error)
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:'operating.comment.added',objectType:'operating_case',objectId:input.caseId,afterValue:{commentId:data.id,visibility:input.visibility},source:'ultra-mz1-operating-kernel'})
  return data as OperatingComment
}
