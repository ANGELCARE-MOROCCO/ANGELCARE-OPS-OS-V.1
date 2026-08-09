import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import { normalizeRevenueOsError, RevenueOsError } from '../errors'
import { writeRevenueOsAuditEvent } from '../repository'
import type {
  RevenueCampaignPattern,
  RevenueCaseStudy,
  RevenueDoctrine,
  RevenueDoctrineMutationInput,
  RevenueKnowledgeApproval,
  RevenueKnowledgeApprovalDecision,
  RevenueKnowledgeAsset,
  RevenueKnowledgeBootstrap,
  RevenueKnowledgeConflict,
  RevenueKnowledgeConflictStatus,
  RevenueKnowledgeIndexJob,
  RevenueKnowledgeRelationship,
  RevenueKnowledgeStatus,
  RevenueKnowledgeValidationIssue,
  RevenueKnowledgeVersion,
  RevenueObjectionPattern,
  RevenuePartnerBenefit,
  RevenuePlaybook,
  RevenuePolicyRestriction,
  RevenueBrandRequirement,
  RevenueSalesScript,
} from '../types'
import {
  REVENUE_KNOWLEDGE_MODULE_VERSION,
  REVENUE_KNOWLEDGE_MUTATION_ALLOWLIST,
  REVENUE_KNOWLEDGE_RELEASE_CODE,
  REVENUE_KNOWLEDGE_SECTIONS,
} from './constants'
import {
  REVENUE_KNOWLEDGE_SEED_APPROVALS,
  REVENUE_KNOWLEDGE_SEED_ASSETS,
  REVENUE_KNOWLEDGE_SEED_BRAND_REQUIREMENTS,
  REVENUE_KNOWLEDGE_SEED_CAMPAIGN_PATTERNS,
  REVENUE_KNOWLEDGE_SEED_CASES,
  REVENUE_KNOWLEDGE_SEED_CONFLICTS,
  REVENUE_KNOWLEDGE_SEED_DOCTRINES,
  REVENUE_KNOWLEDGE_SEED_INDEX_JOBS,
  REVENUE_KNOWLEDGE_SEED_OBJECTIONS,
  REVENUE_KNOWLEDGE_SEED_PARTNER_BENEFITS,
  REVENUE_KNOWLEDGE_SEED_PLAYBOOKS,
  REVENUE_KNOWLEDGE_SEED_RELATIONSHIPS,
  REVENUE_KNOWLEDGE_SEED_RESTRICTIONS,
  REVENUE_KNOWLEDGE_SEED_SCRIPTS,
  REVENUE_KNOWLEDGE_SEED_VALIDATION_ISSUES,
  REVENUE_KNOWLEDGE_SEED_VERSIONS,
} from './seed-data'
import { assertKnowledgeStatusTransition, calculateKnowledgeReadiness, validateRevenueKnowledgeModel } from './validation'

const CONTRACT_VERSION = 'AC-REVENUE-OS-CANONICAL-2026.07'
type Row = Record<string, any>
type Actor = { id?: string; label: string }

function arr<T = string>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : [] }
function num(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback }
function iso(value: unknown) { return typeof value === 'string' && value ? value : new Date().toISOString() }
function status(value: unknown): RevenueKnowledgeStatus {
  const allowed: RevenueKnowledgeStatus[] = ['draft','in-review','approved','effective','suspended','retired','rejected']
  return allowed.includes(value as RevenueKnowledgeStatus) ? value as RevenueKnowledgeStatus : 'draft'
}

function doctrine(row: Row): RevenueDoctrine {
  return {
    id: String(row.id), code: row.code, title: row.title, summary: row.summary || '', knowledgeType: row.knowledge_type,
    ownerRole: row.owner_role || '', department: row.department || '', businessUnitCodes: arr(row.business_unit_codes),
    status: status(row.status), confidentiality: row.confidentiality || 'internal', version: row.version || '1.0',
    effectiveFrom: row.effective_from || undefined, effectiveTo: row.effective_to || undefined, nextReviewAt: row.next_review_at || undefined,
    reviewCycleDays: num(row.review_cycle_days, 90), supersedesCode: row.supersedes_code || undefined,
    applicableCommandFamilies: arr(row.applicable_command_families), applicableSegmentCodes: arr(row.applicable_segment_codes),
    applicableOfferCodes: arr(row.applicable_offer_codes), tags: arr(row.tags), sourceAuthority: row.source_authority || '',
    contentBlocks: arr(row.content_blocks), rules: arr(row.rules), evidenceRefs: arr(row.evidence_refs), source: 'database',
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  }
}

function asset(row: Row): RevenueKnowledgeAsset {
  return {
    id: String(row.id), code: row.code, title: row.title, assetType: row.asset_type, description: row.description || '',
    ownerRole: row.owner_role || '', businessUnitCodes: arr(row.business_unit_codes), confidentiality: row.confidentiality || 'internal',
    status: status(row.status), version: row.version || '1.0', effectiveFrom: row.effective_from || undefined, sourceUri: row.source_uri || undefined,
    fileName: row.file_name || undefined, mimeType: row.mime_type || undefined, checksum: row.checksum || undefined,
    pageCount: row.page_count == null ? undefined : num(row.page_count), language: row.language || 'fr', tags: arr(row.tags),
    linkedDoctrineCodes: arr(row.linked_doctrine_codes), indexStatus: row.index_status || 'not-indexed', chunkCount: num(row.chunk_count),
    source: 'database', createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  }
}

function relationship(row: Row): RevenueKnowledgeRelationship {
  return { id:String(row.id), code:row.code, sourceType:row.source_type, sourceCode:row.source_code, relationshipType:row.relationship_type, targetType:row.target_type, targetCode:row.target_code, rationale:row.rationale || '', active:Boolean(row.active) }
}
function script(row: Row): RevenueSalesScript {
  return { id:String(row.id), code:row.code, name:row.name, channel:row.channel, stage:row.stage || '', segmentCodes:arr(row.segment_codes), offerCodes:arr(row.offer_codes), objective:row.objective || '', opening:row.opening || '', body:row.body || '', callToAction:row.call_to_action || '', fallback:row.fallback || '', prohibitedClaims:arr(row.prohibited_claims), requiredPersonalizationFields:arr(row.required_personalization_fields), status:status(row.status), version:row.version || '1.0', ownerRole:row.owner_role || '', updatedAt:iso(row.updated_at) }
}
function objection(row: Row): RevenueObjectionPattern {
  return { id:String(row.id), code:row.code, objection:row.objection, category:row.category, segmentCodes:arr(row.segment_codes), offerCodes:arr(row.offer_codes), diagnosticQuestions:arr(row.diagnostic_questions), responseFramework:arr(row.response_framework), evidenceRefs:arr(row.evidence_refs), escalationTrigger:row.escalation_trigger || '', prohibitedResponse:row.prohibited_response || '', status:status(row.status), updatedAt:iso(row.updated_at) }
}
function caseStudy(row: Row): RevenueCaseStudy {
  return { id:String(row.id), code:row.code, title:row.title, caseType:row.case_type, businessUnitCode:row.business_unit_code || '', segmentCode:row.segment_code || '', marketCode:row.market_code || '', context:row.context || '', problem:row.problem || '', actions:arr(row.actions), outcome:row.outcome || '', measurableSignals:row.measurable_signals || {}, lessons:arr(row.lessons), reusablePatterns:arr(row.reusable_patterns), evidenceRefs:arr(row.evidence_refs), status:status(row.status), confidentiality:row.confidentiality || 'restricted', updatedAt:iso(row.updated_at) }
}
function campaign(row: Row): RevenueCampaignPattern {
  return { id:String(row.id), code:row.code, name:row.name, patternType:row.pattern_type, objective:row.objective || '', applicability:arr(row.applicability), sequence:arr(row.sequence), requiredSignals:arr(row.required_signals), stopConditions:arr(row.stop_conditions), successMetrics:arr(row.success_metrics), riskControls:arr(row.risk_controls), status:status(row.status), version:row.version || '1.0', updatedAt:iso(row.updated_at) }
}
function playbook(row: Row): RevenuePlaybook {
  return { id:String(row.id), code:row.code, name:row.name, objective:row.objective || '', businessUnitCodes:arr(row.business_unit_codes), segmentCodes:arr(row.segment_codes), trigger:row.trigger || '', preconditions:arr(row.preconditions), steps:arr(row.steps), completionRule:row.completion_rule || '', escalationPolicy:row.escalation_policy || '', status:status(row.status), version:row.version || '1.0', ownerRole:row.owner_role || '', updatedAt:iso(row.updated_at) }
}
function restriction(row: Row): RevenuePolicyRestriction {
  return { id:String(row.id), code:row.code, name:row.name, restrictionType:row.restriction_type, scope:arr(row.scope), rule:row.rule || '', prohibitedActions:arr(row.prohibited_actions), requiredApproverRole:row.required_approver_role || undefined, escalationPath:row.escalation_path || '', severity:row.severity || 'high', status:status(row.status), effectiveFrom:row.effective_from || undefined, updatedAt:iso(row.updated_at) }
}
function brand(row: Row): RevenueBrandRequirement {
  return { id:String(row.id), code:row.code, name:row.name, scope:arr(row.scope), requirement:row.requirement || '', allowedPatterns:arr(row.allowed_patterns), prohibitedPatterns:arr(row.prohibited_patterns), evidenceRequired:arr(row.evidence_required), status:status(row.status), updatedAt:iso(row.updated_at) }
}
function benefit(row: Row): RevenuePartnerBenefit {
  return { id:String(row.id), code:row.code, name:row.name, segmentCodes:arr(row.segment_codes), offerCodes:arr(row.offer_codes), valueStatement:row.value_statement || '', eligibilityRules:arr(row.eligibility_rules), validityWindow:row.validity_window || undefined, approvalRole:row.approval_role || '', communicationRules:arr(row.communication_rules), status:status(row.status), updatedAt:iso(row.updated_at) }
}
function approval(row: Row): RevenueKnowledgeApproval {
  return { id:String(row.id), code:row.code, resourceType:row.resource_type, resourceCode:row.resource_code, resourceVersion:row.resource_version || '1.0', requestedBy:row.requested_by_label || row.requested_by || '', requestedAt:iso(row.requested_at), requiredApproverRole:row.required_approver_role || '', decision:row.decision || 'pending', decidedBy:row.decided_by_label || undefined, decidedAt:row.decided_at || undefined, rationale:row.rationale || undefined, checklist:arr(row.checklist) }
}
function conflict(row: Row): RevenueKnowledgeConflict {
  return { id:String(row.id), code:row.code, conflictType:row.conflict_type, leftResourceCode:row.left_resource_code, rightResourceCode:row.right_resource_code, summary:row.summary || '', risk:row.risk || '', recommendedResolution:row.recommended_resolution || '', status:row.status || 'open', severity:row.severity || 'high', detectedAt:iso(row.detected_at), resolvedAt:row.resolved_at || undefined, resolvedBy:row.resolved_by_label || undefined, resolution:row.resolution || undefined }
}
function version(row: Row): RevenueKnowledgeVersion {
  return { id:String(row.id), resourceType:row.resource_type, resourceCode:row.resource_code, version:row.version, status:status(row.status), changeReason:row.change_reason || '', snapshotHash:row.snapshot_hash || '', createdBy:row.created_by_label || '', createdAt:iso(row.created_at), approvedBy:row.approved_by_label || undefined, approvedAt:row.approved_at || undefined }
}
function indexJob(row: Row): RevenueKnowledgeIndexJob {
  return { id:String(row.id), code:row.code, assetCode:row.asset_code, requestedAt:iso(row.requested_at), status:row.status || 'queued', chunkCount:num(row.chunk_count), error:row.error || undefined, completedAt:row.completed_at || undefined }
}
function validationIssue(row: Row): RevenueKnowledgeValidationIssue {
  return { id:String(row.id), code:row.code, resourceType:row.resource_type, resourceCode:row.resource_code, category:row.category, severity:row.severity, title:row.title, detail:row.detail || '', recommendedAction:row.recommended_action || '', status:row.status || 'open', detectedAt:iso(row.detected_at) }
}

async function safeRows(supabase: any, table: string, order = 'updated_at') {
  const result = await supabase.from(table).select('*').order(order, { ascending: false })
  if (result.error) throw result.error
  return (result.data || []) as Row[]
}

function seedBootstrap(): RevenueKnowledgeBootstrap {
  const base: RevenueKnowledgeBootstrap = {
    contractVersion: CONTRACT_VERSION, releaseCode: REVENUE_KNOWLEDGE_RELEASE_CODE, moduleVersion: REVENUE_KNOWLEDGE_MODULE_VERSION,
    generatedAt: new Date().toISOString(), storageMode: 'contract-seed', sections: REVENUE_KNOWLEDGE_SECTIONS,
    doctrines: REVENUE_KNOWLEDGE_SEED_DOCTRINES, assets: REVENUE_KNOWLEDGE_SEED_ASSETS,
    relationships: REVENUE_KNOWLEDGE_SEED_RELATIONSHIPS, scripts: REVENUE_KNOWLEDGE_SEED_SCRIPTS,
    objections: REVENUE_KNOWLEDGE_SEED_OBJECTIONS, cases: REVENUE_KNOWLEDGE_SEED_CASES,
    campaignPatterns: REVENUE_KNOWLEDGE_SEED_CAMPAIGN_PATTERNS, playbooks: REVENUE_KNOWLEDGE_SEED_PLAYBOOKS,
    restrictions: REVENUE_KNOWLEDGE_SEED_RESTRICTIONS, brandRequirements: REVENUE_KNOWLEDGE_SEED_BRAND_REQUIREMENTS,
    partnerBenefits: REVENUE_KNOWLEDGE_SEED_PARTNER_BENEFITS, approvals: REVENUE_KNOWLEDGE_SEED_APPROVALS,
    conflicts: REVENUE_KNOWLEDGE_SEED_CONFLICTS, versions: REVENUE_KNOWLEDGE_SEED_VERSIONS,
    indexJobs: REVENUE_KNOWLEDGE_SEED_INDEX_JOBS, validationIssues: REVENUE_KNOWLEDGE_SEED_VALIDATION_ISSUES,
    readiness: { overall:0, approvedDoctrineCoverage:0, provenanceCoverage:0, versionIntegrity:0, conflictSafety:0, indexingReadiness:0, authorityCoverage:0, reviewFreshness:0 },
    counters: { effectiveDoctrines:0, approvedDoctrines:0, draftDoctrines:0, indexedAssets:0, openApprovals:0, openConflicts:0, criticalIssues:0, overdueReviews:0 },
  }
  return finalize(base)
}

function finalize(base: RevenueKnowledgeBootstrap): RevenueKnowledgeBootstrap {
  const validationIssues = base.validationIssues.length ? base.validationIssues : validateRevenueKnowledgeModel(base)
  const readiness = calculateKnowledgeReadiness({ ...base, validationIssues })
  const now = Date.now()
  return {
    ...base, validationIssues, readiness,
    counters: {
      effectiveDoctrines: base.doctrines.filter((item) => item.status === 'effective').length,
      approvedDoctrines: base.doctrines.filter((item) => item.status === 'approved').length,
      draftDoctrines: base.doctrines.filter((item) => item.status === 'draft' || item.status === 'in-review').length,
      indexedAssets: base.assets.filter((item) => item.indexStatus === 'indexed').length,
      openApprovals: base.approvals.filter((item) => item.decision === 'pending').length,
      openConflicts: base.conflicts.filter((item) => item.status === 'open' || item.status === 'under-review').length,
      criticalIssues: validationIssues.filter((item) => item.status === 'open' && item.severity === 'critical').length,
      overdueReviews: base.doctrines.filter((item) => item.status === 'effective' && item.nextReviewAt && new Date(item.nextReviewAt).getTime() < now).length,
    },
  }
}

export async function readRevenueKnowledgeMemory(): Promise<{ bootstrap: RevenueKnowledgeBootstrap; warnings: string[] }> {
  try {
    const supabase = await createServiceClient()
    const doctrineRows = await safeRows(supabase, 'revenue_os_doctrines')
    if (!doctrineRows.length) return { bootstrap: seedBootstrap(), warnings: ['Migration MZ03 appliquée mais bibliothèque vide: affichage du référentiel contractuel.'] }
    const [assetRows, relationshipRows, scriptRows, objectionRows, caseRows, campaignRows, playRows, restrictionRows, brandRows, benefitRows, approvalRows, conflictRows, versionRows, jobRows, issueRows] = await Promise.all([
      safeRows(supabase,'revenue_os_knowledge_assets'), safeRows(supabase,'revenue_os_knowledge_relationships','created_at'),
      safeRows(supabase,'revenue_os_sales_scripts'), safeRows(supabase,'revenue_os_objection_patterns'), safeRows(supabase,'revenue_os_case_studies'),
      safeRows(supabase,'revenue_os_campaign_patterns'), safeRows(supabase,'revenue_os_playbooks'), safeRows(supabase,'revenue_os_policy_restrictions'),
      safeRows(supabase,'revenue_os_brand_requirements'), safeRows(supabase,'revenue_os_partner_benefits'), safeRows(supabase,'revenue_os_knowledge_approvals','requested_at'),
      safeRows(supabase,'revenue_os_knowledge_conflicts','detected_at'), safeRows(supabase,'revenue_os_knowledge_versions','created_at'),
      safeRows(supabase,'revenue_os_knowledge_index_jobs','requested_at'), safeRows(supabase,'revenue_os_knowledge_validation_issues','detected_at'),
    ])
    const bootstrap = finalize({
      contractVersion:CONTRACT_VERSION, releaseCode:REVENUE_KNOWLEDGE_RELEASE_CODE, moduleVersion:REVENUE_KNOWLEDGE_MODULE_VERSION,
      generatedAt:new Date().toISOString(), storageMode:'supabase', sections:REVENUE_KNOWLEDGE_SECTIONS,
      doctrines:doctrineRows.map(doctrine), assets:assetRows.map(asset), relationships:relationshipRows.map(relationship),
      scripts:scriptRows.map(script), objections:objectionRows.map(objection), cases:caseRows.map(caseStudy), campaignPatterns:campaignRows.map(campaign),
      playbooks:playRows.map(playbook), restrictions:restrictionRows.map(restriction), brandRequirements:brandRows.map(brand), partnerBenefits:benefitRows.map(benefit),
      approvals:approvalRows.map(approval), conflicts:conflictRows.map(conflict), versions:versionRows.map(version), indexJobs:jobRows.map(indexJob),
      validationIssues:issueRows.map(validationIssue), readiness:{overall:0,approvedDoctrineCoverage:0,provenanceCoverage:0,versionIntegrity:0,conflictSafety:0,indexingReadiness:0,authorityCoverage:0,reviewFreshness:0},
      counters:{effectiveDoctrines:0,approvedDoctrines:0,draftDoctrines:0,indexedAssets:0,openApprovals:0,openConflicts:0,criticalIssues:0,overdueReviews:0},
    })
    return { bootstrap, warnings: [] }
  } catch (error) {
    return { bootstrap: seedBootstrap(), warnings: [`Stockage Doctrine MZ03 indisponible: ${normalizeRevenueOsError(error).message}`] }
  }
}

function cleanPayload(payload: Record<string, unknown>) {
  const result: Record<string, unknown> = {}
  for (const key of REVENUE_KNOWLEDGE_MUTATION_ALLOWLIST) if (payload[key] !== undefined) result[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = payload[key]
  return result
}

function nextStatus(operation: RevenueDoctrineMutationInput['operation']): RevenueKnowledgeStatus | null {
  return ({ 'submit-review':'in-review', approve:'approved', reject:'rejected', activate:'effective', suspend:'suspended', retire:'retired' } as Partial<Record<RevenueDoctrineMutationInput['operation'],RevenueKnowledgeStatus>>)[operation] || null
}

export async function mutateRevenueDoctrine(input: RevenueDoctrineMutationInput, actor: Actor) {
  try {
    const supabase = await createServiceClient()
    const now = new Date().toISOString()
    let response: { data: Row | null; error: any }
    if (input.operation === 'create') {
      if (typeof input.payload.code !== 'string' || typeof input.payload.title !== 'string') throw new RevenueOsError('REVENUE_KNOWLEDGE_INVALID_INPUT','Code et titre sont requis.',{status:400})
      response = await supabase.from('revenue_os_doctrines').insert({ ...cleanPayload(input.payload), code:input.payload.code, title:input.payload.title, summary:input.payload.summary || '', knowledge_type:input.payload.knowledgeType || 'commercial-doctrine', version:'1.0', status:'draft', source:'manual', created_by:actor.id || null, created_by_label:actor.label, updated_at:now }).select('*').single()
    } else {
      if (!input.id) throw new RevenueOsError('REVENUE_KNOWLEDGE_INVALID_INPUT','Identifiant doctrinal requis.',{status:400})
      const currentResult = await supabase.from('revenue_os_doctrines').select('*').eq('id',input.id).single()
      if (currentResult.error || !currentResult.data) throw currentResult.error || new Error('Doctrine introuvable')
      const current = doctrine(currentResult.data)
      const target = nextStatus(input.operation)
      if (target) assertKnowledgeStatusTransition(current.status,target)
      const updates = input.operation === 'update' ? cleanPayload(input.payload) : { status:target, effective_from:target === 'effective' ? (current.effectiveFrom || now.slice(0,10)) : currentResult.data.effective_from }
      response = await supabase.from('revenue_os_doctrines').update({ ...updates, updated_at:now }).eq('id',input.id).select('*').single()
    }
    if (response.error || !response.data) throw response.error || new Error('Mutation sans résultat')
    const mapped = doctrine(response.data)
    const snapshotHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(mapped))).then((buffer) => Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2,'0')).join(''))
    const existing = await supabase.from('revenue_os_knowledge_versions').select('version').eq('resource_code',mapped.code).eq('version',mapped.version).maybeSingle()
    if (!existing.data) await supabase.from('revenue_os_knowledge_versions').insert({ resource_type:'doctrine', resource_code:mapped.code, version:mapped.version, status:mapped.status, change_reason:String(input.payload.changeReason || input.operation), snapshot:mapped, snapshot_hash:snapshotHash, created_by:actor.id || null, created_by_label:actor.label, approved_by: mapped.status === 'approved' || mapped.status === 'effective' ? actor.id || null : null, approved_by_label:mapped.status === 'approved' || mapped.status === 'effective' ? actor.label : null, approved_at:mapped.status === 'approved' || mapped.status === 'effective' ? now : null })
    await writeRevenueOsAuditEvent({ action:`knowledge.doctrine.${input.operation}`, actorId:actor.id, actorLabel:actor.label, actorType:'user', resourceType:'revenue_doctrine', resourceId:mapped.id, outcome:'success', summary:`${input.operation} doctrine ${mapped.code} · ${mapped.version}`, metadata:{status:mapped.status,release:'MZ03'} },supabase)
    return mapped
  } catch (error) {
    if (error instanceof RevenueOsError) throw error
    throw new RevenueOsError('REVENUE_KNOWLEDGE_STORAGE_FAILURE','La mutation doctrinale a échoué. Vérifiez la migration MZ03 et les permissions.',{status:503,recoverable:true,cause:normalizeRevenueOsError(error)})
  }
}

export async function decideKnowledgeApproval(id: string, decision: RevenueKnowledgeApprovalDecision, rationale: string, actor: Actor) {
  if (!['approved','rejected','changes-requested','cancelled'].includes(decision)) throw new RevenueOsError('REVENUE_KNOWLEDGE_INVALID_INPUT','Décision d’approbation non autorisée.',{status:400})
  try {
    const supabase = await createServiceClient(); const now=new Date().toISOString()
    const result=await supabase.from('revenue_os_knowledge_approvals').update({decision,decided_by:actor.id || null,decided_by_label:actor.label,decided_at:now,rationale,updated_at:now}).eq('id',id).select('*').single()
    if(result.error) throw result.error
    const mapped=approval(result.data)
    if(mapped.resourceType==='doctrine') {
      const target=decision==='approved'?'approved':decision==='rejected'?'rejected':'draft'
      await supabase.from('revenue_os_doctrines').update({status:target,updated_at:now}).eq('code',mapped.resourceCode).eq('version',mapped.resourceVersion)
    }
    await writeRevenueOsAuditEvent({action:'knowledge.approval.decided',actorId:actor.id,actorLabel:actor.label,actorType:'user',resourceType:'knowledge_approval',resourceId:id,outcome:'success',summary:`${mapped.resourceCode}: ${decision}`,metadata:{rationale}},supabase)
    return mapped
  } catch(error) { throw new RevenueOsError('REVENUE_KNOWLEDGE_STORAGE_FAILURE','La décision d’approbation n’a pas pu être enregistrée.',{status:503,recoverable:true,cause:normalizeRevenueOsError(error)}) }
}

export async function resolveKnowledgeConflict(id: string, nextStatus: RevenueKnowledgeConflictStatus, resolution: string, actor: Actor) {
  if(!['under-review','resolved','accepted-risk','dismissed'].includes(nextStatus)) throw new RevenueOsError('REVENUE_KNOWLEDGE_INVALID_INPUT','Statut de conflit non autorisé.',{status:400})
  try { const supabase=await createServiceClient(); const now=new Date().toISOString(); const result=await supabase.from('revenue_os_knowledge_conflicts').update({status:nextStatus,resolution,resolved_at:nextStatus==='resolved'?now:null,resolved_by:actor.id || null,resolved_by_label:actor.label,updated_at:now}).eq('id',id).select('*').single(); if(result.error) throw result.error; await writeRevenueOsAuditEvent({action:'knowledge.conflict.updated',actorId:actor.id,actorLabel:actor.label,actorType:'user',resourceType:'knowledge_conflict',resourceId:id,outcome:'success',summary:`Conflit ${result.data.code} → ${nextStatus}`,metadata:{resolution}},supabase); return conflict(result.data) } catch(error) { throw new RevenueOsError('REVENUE_KNOWLEDGE_STORAGE_FAILURE','Le conflit n’a pas pu être modifié.',{status:503,recoverable:true,cause:normalizeRevenueOsError(error)}) }
}

export async function queueKnowledgeIndexJob(assetId: string, actor: Actor) {
  try { const supabase=await createServiceClient(); const assetResult=await supabase.from('revenue_os_knowledge_assets').select('*').eq('id',assetId).single(); if(assetResult.error) throw assetResult.error; const current=asset(assetResult.data); if(!['approved','effective'].includes(current.status)) throw new RevenueOsError('REVENUE_KNOWLEDGE_INDEX_BLOCKED','Seuls les actifs approuvés ou effectifs peuvent être indexés.',{status:409}); if(current.confidentiality==='restricted') throw new RevenueOsError('REVENUE_KNOWLEDGE_INDEX_BLOCKED','Un actif restreint exige une revue de confidentialité avant indexation.',{status:409}); const code=`INDEX-${current.code}-${Date.now()}`; const result=await supabase.from('revenue_os_knowledge_index_jobs').insert({code,asset_code:current.code,status:'queued',requested_by:actor.id || null,requested_by_label:actor.label}).select('*').single(); if(result.error) throw result.error; await supabase.from('revenue_os_knowledge_assets').update({index_status:'queued',updated_at:new Date().toISOString()}).eq('id',assetId); await writeRevenueOsAuditEvent({action:'knowledge.index.queued',actorId:actor.id,actorLabel:actor.label,actorType:'user',resourceType:'knowledge_asset',resourceId:assetId,outcome:'success',summary:`Indexation préparée pour ${current.code}.`,metadata:{jobCode:code,noExternalModelInvoked:true}},supabase); return indexJob(result.data) } catch(error) { if(error instanceof RevenueOsError) throw error; throw new RevenueOsError('REVENUE_KNOWLEDGE_STORAGE_FAILURE','Le job d’indexation n’a pas pu être créé.',{status:503,recoverable:true,cause:normalizeRevenueOsError(error)}) }
}

export async function persistKnowledgeValidation(actor: Actor) {
  const {bootstrap}=await readRevenueKnowledgeMemory(); const issues=validateRevenueKnowledgeModel({...bootstrap,validationIssues:[]}); const readiness=calculateKnowledgeReadiness({...bootstrap,validationIssues:issues})
  try { const supabase=await createServiceClient(); for(const current of issues) { const result=await supabase.from('revenue_os_knowledge_validation_issues').upsert({code:current.code,resource_type:current.resourceType,resource_code:current.resourceCode,category:current.category,severity:current.severity,title:current.title,detail:current.detail,recommended_action:current.recommendedAction,status:current.status,detected_at:current.detectedAt,updated_at:new Date().toISOString()},{onConflict:'code,resource_code'}); if(result.error) throw result.error } await supabase.from('revenue_os_knowledge_snapshots').insert({snapshot_code:`KNW-${Date.now()}`,release_code:REVENUE_KNOWLEDGE_RELEASE_CODE,readiness_score:readiness.overall,snapshot:{counters:bootstrap.counters,readiness,issueCount:issues.length},created_by:actor.id || null,created_by_label:actor.label,status:readiness.overall>=90&&!issues.some((x)=>x.severity==='critical')?'validated':'needs-validation'}); await writeRevenueOsAuditEvent({action:'knowledge.validation.completed',actorId:actor.id,actorLabel:actor.label,actorType:'user',resourceType:'knowledge_model',outcome:'success',summary:`Validation doctrine: ${readiness.overall}% · ${issues.length} points.`,metadata:{readiness,issueCount:issues.length}},supabase); return {readiness,issues} } catch(error) { throw new RevenueOsError('REVENUE_KNOWLEDGE_VALIDATION_STORAGE_FAILURE','La validation a été calculée mais ne peut pas être persistée.',{status:503,recoverable:true,cause:normalizeRevenueOsError(error)}) }
}

export async function updateKnowledgeValidationStatus(id: string, nextStatus: RevenueKnowledgeValidationIssue['status'], actor: Actor) {
  if(!['open','acknowledged','resolved','waived'].includes(nextStatus)) throw new RevenueOsError('REVENUE_KNOWLEDGE_INVALID_INPUT','Statut de validation non autorisé.',{status:400})
  try { const supabase=await createServiceClient(); const result=await supabase.from('revenue_os_knowledge_validation_issues').update({status:nextStatus,resolved_at:nextStatus==='resolved'?new Date().toISOString():null,resolved_by:nextStatus==='resolved'?actor.id || null:null,resolved_by_label:nextStatus==='resolved'?actor.label:null,updated_at:new Date().toISOString()}).eq('id',id).select('*').single(); if(result.error) throw result.error; return validationIssue(result.data) } catch(error) { throw new RevenueOsError('REVENUE_KNOWLEDGE_STORAGE_FAILURE','Le point de validation n’a pas pu être modifié.',{status:503,recoverable:true,cause:normalizeRevenueOsError(error)}) }
}
