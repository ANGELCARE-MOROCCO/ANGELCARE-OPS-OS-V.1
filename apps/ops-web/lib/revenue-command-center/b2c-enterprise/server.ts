import { createClient as createSupabaseAdmin } from '@/lib/supabase/contract-client'

import { requireRevenueApiAccess } from "@/lib/revenue-command-center/api-access"
import {
  cleanNumber, cleanString, logRevenueAction, logRevenueActivity, revenueClient,
} from "@/lib/revenue-command-center/canonical-server"

export const B2C_STAGES = [
  "lead","intake","qualified","consultation","recommendation","quoted","matching","confirmed",
  "onboarding","activation_pending","active","retention","recovery","completed","cancelled","lost","archived",
] as const
export type B2CStage = (typeof B2C_STAGES)[number]

const STAGE_ALIASES: Record<string,B2CStage> = {
  inquiry:"lead",new:"lead",new_lead:"lead",qualification:"intake",quote:"quoted",
  care_start:"activation_pending",care_started:"active",client:"active",inactive:"archived",
}

export function nowIso(){return new Date().toISOString()}
export function normalizeB2CStage(value:unknown):B2CStage{
  const raw=cleanString(value,"lead").toLowerCase().replaceAll("-","_").replaceAll(" ","_")
  const normalized=STAGE_ALIASES[raw]||raw
  return B2C_STAGES.includes(normalized as B2CStage)?normalized as B2CStage:"lead"
}
export function uuidOrNull(value:unknown){const v=cleanString(value);return v||null}
export function textIdOrNull(value:unknown){const v=cleanString(value);return v||null}
export function json(value:unknown,fallback:Record<string,unknown>={}){return value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:fallback}
export function bool(value:unknown,fallback=false){if(typeof value==="boolean")return value;const raw=cleanString(value).toLowerCase();if(["true","1","yes","oui"].includes(raw))return true;if(["false","0","no","non"].includes(raw))return false;return fallback}

export async function b2cContext(permission:string|string[]="revenue.b2c.read"){
  const access=await requireRevenueApiAccess(permission)
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_KEY
  const supabase=url&&key?createSupabaseAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):await revenueClient()
  return {access,supabase:supabase as any}
}
export function isMissingRelation(error:unknown){
  const message=String((error as any)?.message||error||"")
  return /relation .* does not exist|table .* does not exist|schema cache|could not find the table|column .* does not exist|function .* does not exist/i.test(message)
}
export async function optionalRows(client:any,table:string,select="*",configure?:(query:any)=>any){
  let query=client.from(table).select(select)
  if(configure)query=configure(query)
  const result=await query
  if(!result.error)return {rows:result.data||[],available:true}
  if(isMissingRelation(result.error))return {rows:[],available:false,error:result.error.message}
  throw new Error(result.error.message)
}
export async function optionalOne(client:any,table:string,select:string,configure:(query:any)=>any){
  const result=await configure(client.from(table).select(select)).maybeSingle()
  if(!result.error)return {row:result.data||null,available:true}
  if(isMissingRelation(result.error))return {row:null,available:false,error:result.error.message}
  throw new Error(result.error.message)
}
export async function updateRow(client:any,table:string,id:string,patch:Record<string,unknown>){
  const result=await client.from(table).update({...patch,updated_at:nowIso()}).eq("id",id).select("*").single()
  if(result.error)throw new Error(result.error.message)
  return result.data
}
export async function getB2CCase(client:any,id:string){
  let result=await client.from("revenue_b2c_command_view").select("*").eq("id",id).maybeSingle()
  if(result.error&&isMissingRelation(result.error))result=await client.from("revenue_b2c_cases").select("*").eq("id",id).maybeSingle()
  if(result.error)throw new Error(result.error.message)
  return result.data||null
}

export function normalizeCasePayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  const parentName=cleanString(body.parentName||body.parent_name||body.familyName||body.family_name||body.name,"Famille sans nom")
  return {
    parent_name:parentName,
    family_name:cleanString(body.familyName||body.family_name,parentName),
    family_reference:cleanString(body.familyReference||body.family_reference)||null,
    city:cleanString(body.city,"Non affectée"),
    service_interest:cleanString(body.serviceInterest||body.service_interest||body.serviceType,"home_childcare"),
    stage:normalizeB2CStage(body.stage||body.lifecycleStage),
    status:cleanString(body.status,"active"),
    priority:cleanString(body.priority,"high"),
    urgency:cleanString(body.urgency,"medium"),
    estimated_value_mad:Math.max(0,cleanNumber(body.estimatedValueMad||body.estimated_value_mad||body.valueMad,0)),
    owner:cleanString(body.owner,"B2C Relationship Officer"),
    owner_id:uuidOrNull(body.ownerId||body.owner_id),
    phone:cleanString(body.phone)||null,
    email:cleanString(body.email).toLowerCase()||null,
    preferred_channel:cleanString(body.preferredChannel||body.preferred_channel,"whatsapp"),
    prospect_text_id:textIdOrNull(body.prospectId||body.prospect_text_id||body.prospect_id),
    account_id:uuidOrNull(body.accountId||body.account_id),
    opportunity_id:uuidOrNull(body.opportunityId||body.opportunity_id),
    accepted_proposal_id:uuidOrNull(body.proposalId||body.accepted_proposal_id),
    contract_id:uuidOrNull(body.contractId||body.contract_id),
    operational_handoff_id:uuidOrNull(body.operationalHandoffId||body.operational_handoff_id),
    desired_start_date:cleanString(body.desiredStartDate||body.desired_start_date)||null,
    intake_status:cleanString(body.intakeStatus||body.intake_status,"pending"),
    qualification_status:cleanString(body.qualificationStatus||body.qualification_status,"not_started"),
    consultation_status:cleanString(body.consultationStatus||body.consultation_status,"not_scheduled"),
    recommendation_status:cleanString(body.recommendationStatus||body.recommendation_status,"not_started"),
    quote_status:cleanString(body.quoteStatus||body.quote_status,"not_started"),
    matching_status:cleanString(body.matchingStatus||body.matching_status,"not_started"),
    onboarding_status:cleanString(body.onboardingStatus||body.onboarding_status,"not_started"),
    activation_status:cleanString(body.activationStatus||body.activation_status,"not_ready"),
    care_start_status:cleanString(body.careStartStatus||body.care_start_status,"not_started"),
    relationship_status:cleanString(body.relationshipStatus||body.relationship_status,"prospect"),
    retention_status:cleanString(body.retentionStatus||body.retention_status,"not_applicable"),
    risk_status:cleanString(body.riskStatus||body.risk_status,"clear"),
    satisfaction_score:Math.max(0,Math.min(100,cleanNumber(body.satisfactionScore||body.satisfaction_score,0))),
    next_action:cleanString(body.nextAction||body.next_action,"Compléter l’intake famille"),
    next_action_at:cleanString(body.nextActionAt||body.next_action_at)||null,
    metadata:{...json(body.metadata),notes:cleanString(body.notes)||undefined},
  }
}
export function normalizeRequirementPayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  return {
    b2c_case_id:cleanString(body.caseId||body.b2cCaseId||body.b2c_case_id),
    beneficiary_id:uuidOrNull(body.beneficiaryId||body.beneficiary_id),
    service_type:cleanString(body.serviceType||body.service_type,"home_childcare"),
    schedule_summary:cleanString(body.scheduleSummary||body.schedule_summary),
    start_date:cleanString(body.startDate||body.start_date)||null,
    end_date:cleanString(body.endDate||body.end_date)||null,
    frequency:cleanString(body.frequency),
    location:cleanString(body.location),
    language_preferences:cleanString(body.languagePreferences||body.language_preferences),
    caregiver_profile:cleanString(body.caregiverProfile||body.caregiver_profile),
    transport_constraints:cleanString(body.transportConstraints||body.transport_constraints),
    safety_considerations:cleanString(body.safetyConsiderations||body.safety_considerations),
    family_priorities:cleanString(body.familyPriorities||body.family_priorities),
    deal_breakers:cleanString(body.dealBreakers||body.deal_breakers),
    budget_min_mad:Math.max(0,cleanNumber(body.budgetMinMad||body.budget_min_mad,0)),
    budget_max_mad:Math.max(0,cleanNumber(body.budgetMaxMad||body.budget_max_mad,0)),
    status:cleanString(body.status,"active"),
    metadata:json(body.metadata),
  }
}
export function normalizeMatchingCandidate(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  return {
    matching_cycle_id:cleanString(body.matchingCycleId||body.matching_cycle_id),
    caregiver_reference:cleanString(body.caregiverReference||body.caregiver_reference),
    caregiver_name_snapshot:cleanString(body.caregiverName||body.caregiver_name_snapshot),
    eligibility_status:cleanString(body.eligibilityStatus||body.eligibility_status,"pending"),
    availability_status:cleanString(body.availabilityStatus||body.availability_status,"unverified"),
    location_fit_score:Math.max(0,Math.min(100,cleanNumber(body.locationFitScore||body.location_fit_score,0))),
    schedule_fit_score:Math.max(0,Math.min(100,cleanNumber(body.scheduleFitScore||body.schedule_fit_score,0))),
    language_fit_score:Math.max(0,Math.min(100,cleanNumber(body.languageFitScore||body.language_fit_score,0))),
    experience_fit_score:Math.max(0,Math.min(100,cleanNumber(body.experienceFitScore||body.experience_fit_score,0))),
    overall_fit_score:Math.max(0,Math.min(100,cleanNumber(body.overallFitScore||body.overall_fit_score,0))),
    eligibility_reason:cleanString(body.eligibilityReason||body.eligibility_reason),
    rejection_reason:cleanString(body.rejectionReason||body.rejection_reason)||null,
    metadata:json(body.metadata),
  }
}
export async function recordB2CEvent(client:any,input:{
  caseRecord?:Record<string,any>|null
  caseId?:string|null
  eventType:string
  title:string
  previousState?:unknown
  newState?:unknown
  reason?:string|null
  payload?:Record<string,unknown>
  result?:Record<string,unknown>
  actorId?:string|null
  severity?:string
}){
  const caseId=input.caseId||input.caseRecord?.id||null
  if(caseId){
    const history=await client.from("revenue_b2c_status_history").insert({
      b2c_case_id:caseId,event_type:input.eventType,previous_state:input.previousState??null,new_state:input.newState??null,
      reason:input.reason||null,actor_id:input.actorId||null,metadata:{payload:input.payload||{},result:input.result||{}},
    })
    if(history.error&&!isMissingRelation(history.error))throw new Error(history.error.message)
  }
  await logRevenueActivity(client,{
    entityType:"b2c",entityId:caseId,eventType:input.eventType,title:input.title,
    body:input.reason||null,severity:input.severity||"info",metadata:{payload:input.payload||{},result:input.result||{}},
  }).catch(()=>undefined)
  await logRevenueAction(client,{
    actionType:input.eventType,entityType:"b2c",entityId:caseId,
    payload:{...(input.payload||{}),title:input.title},result:input.result||{},
  }).catch(()=>undefined)
}
function sum(rows:Array<Record<string,any>>,field:string){return rows.reduce((total,row)=>total+Number(row[field]||0),0)}
function countBy(rows:Array<Record<string,any>>,fn:(row:Record<string,any>)=>boolean){return rows.filter(fn).length}

export async function loadB2CPortfolio(client:any,caseId?:string|null){
  let casesResult=await optionalRows(client,"revenue_b2c_command_view","*",q=>caseId?q.eq("id",caseId):q.order("updated_at",{ascending:false}).limit(500))
  if(!casesResult.available)casesResult=await optionalRows(client,"revenue_b2c_cases","*",q=>caseId?q.eq("id",caseId):q.neq("status","archived").order("updated_at",{ascending:false}).limit(500))
  const cases=casesResult.rows
  const ids=cases.map((row:any)=>row.id).filter(Boolean)
  const scoped=(table:string)=>(q:any)=>{
    if(caseId)return q.eq("b2c_case_id",caseId).order("created_at",{ascending:false}).limit(500)
    if(ids.length)return q.in("b2c_case_id",ids.slice(0,200)).order("created_at",{ascending:false}).limit(1000)
    return q.limit(0)
  }
  const [
    guardians,beneficiaries,requirements,needsAssessments,consultations,recommendations,
    matchingCycles,matchingCandidates,matchingDecisions,onboardingPlans,onboardingItems,
    activationGates,careStarts,satisfactionChecks,complaints,retentionRisks,retentionPlans,
    recoveryPlans,recoveryCheckpoints,emergencyContacts,familyInstructions,statusHistory,evidence,
  ]=await Promise.all([
    optionalRows(client,"revenue_b2c_guardians","*",scoped("revenue_b2c_guardians")),
    optionalRows(client,"revenue_b2c_beneficiaries","*",scoped("revenue_b2c_beneficiaries")),
    optionalRows(client,"revenue_b2c_service_requirements","*",scoped("revenue_b2c_service_requirements")),
    optionalRows(client,"revenue_b2c_needs_assessments","*",scoped("revenue_b2c_needs_assessments")),
    optionalRows(client,"revenue_b2c_consultations","*",scoped("revenue_b2c_consultations")),
    optionalRows(client,"revenue_b2c_service_recommendations","*",scoped("revenue_b2c_service_recommendations")),
    optionalRows(client,"revenue_b2c_matching_cycles","*",scoped("revenue_b2c_matching_cycles")),
    optionalRows(client,"revenue_b2c_matching_candidates","*",q=>caseId?q.eq("b2c_case_id",caseId).order("created_at",{ascending:false}).limit(500):q.limit(1000)),
    optionalRows(client,"revenue_b2c_matching_decisions","*",scoped("revenue_b2c_matching_decisions")),
    optionalRows(client,"revenue_b2c_onboarding_plans","*",scoped("revenue_b2c_onboarding_plans")),
    optionalRows(client,"revenue_b2c_onboarding_items","*",q=>caseId?q.eq("b2c_case_id",caseId).order("created_at",{ascending:false}).limit(500):q.limit(1000)),
    optionalRows(client,"revenue_b2c_activation_gates","*",scoped("revenue_b2c_activation_gates")),
    optionalRows(client,"revenue_b2c_care_starts","*",scoped("revenue_b2c_care_starts")),
    optionalRows(client,"revenue_b2c_satisfaction_checks","*",scoped("revenue_b2c_satisfaction_checks")),
    optionalRows(client,"revenue_b2c_complaints","*",scoped("revenue_b2c_complaints")),
    optionalRows(client,"revenue_b2c_retention_risks","*",scoped("revenue_b2c_retention_risks")),
    optionalRows(client,"revenue_b2c_retention_plans","*",scoped("revenue_b2c_retention_plans")),
    optionalRows(client,"revenue_b2c_recovery_plans","*",scoped("revenue_b2c_recovery_plans")),
    optionalRows(client,"revenue_b2c_recovery_checkpoints","*",q=>caseId?q.eq("b2c_case_id",caseId).order("created_at",{ascending:false}).limit(500):q.limit(1000)),
    optionalRows(client,"revenue_b2c_emergency_contacts","*",scoped("revenue_b2c_emergency_contacts")),
    optionalRows(client,"revenue_b2c_family_instructions","*",scoped("revenue_b2c_family_instructions")),
    optionalRows(client,"revenue_b2c_status_history","*",scoped("revenue_b2c_status_history")),
    optionalRows(client,"revenue_b2c_evidence","*",scoped("revenue_b2c_evidence")),
  ])
  const caseFilter=(row:any)=>!caseId||String(row.b2c_case_id||row.entity_id||"")===caseId
  const [tasks,communications,appointments,proposals,contracts,paymentConfirmations,operationalHandoffs]=await Promise.all([
    optionalRows(client,"revenue_tasks","*",q=>caseId?q.eq("entity_type","b2c").eq("entity_id",caseId).order("created_at",{ascending:false}).limit(300):q.eq("entity_type","b2c").order("created_at",{ascending:false}).limit(1000)),
    optionalRows(client,"revenue_communication_events","*",q=>caseId?q.contains("metadata",{b2c_case_id:caseId}).order("occurred_at",{ascending:false}).limit(300):q.order("occurred_at",{ascending:false}).limit(500)),
    optionalRows(client,"revenue_appointments","*",q=>caseId?q.eq("entity_type","b2c").eq("entity_id",caseId).order("appointment_at",{ascending:false}).limit(300):q.eq("entity_type","b2c").order("appointment_at",{ascending:false}).limit(500)),
    optionalRows(client,"revenue_proposals","*",q=>caseId?q.eq("context_type","b2c").eq("b2c_case_id",caseId).order("updated_at",{ascending:false}).limit(100):q.eq("context_type","b2c").order("updated_at",{ascending:false}).limit(500)),
    optionalRows(client,"revenue_contracts","*",q=>caseId?q.contains("metadata",{b2c_case_id:caseId}).order("updated_at",{ascending:false}).limit(100):q.order("updated_at",{ascending:false}).limit(500)),
    optionalRows(client,"revenue_payment_confirmations","*",q=>q.order("created_at",{ascending:false}).limit(500)),
    optionalRows(client,"revenue_operational_handoffs","*",q=>q.order("created_at",{ascending:false}).limit(500)),
  ])
  const activeCases=cases.filter((row:any)=>!["archived","cancelled","lost","completed"].includes(String(row.stage||row.status)))
  const summary={
    total:cases.length,
    newLeads:countBy(cases,row=>["lead","inquiry","new"].includes(String(row.stage))),
    intakePending:countBy(cases,row=>String(row.intake_status||"pending")!=="completed"),
    qualified:countBy(cases,row=>["qualified","consultation","recommendation","quoted","matching","confirmed","onboarding","activation_pending","active"].includes(String(row.stage))),
    consultationPending:countBy(cases,row=>["pending","scheduled","not_scheduled"].includes(String(row.consultation_status||"not_scheduled"))),
    quoted:countBy(cases,row=>["quoted","sent","accepted"].includes(String(row.quote_status||row.stage))),
    matching:countBy(cases,row=>["matching","presented","accepted","rematching"].includes(String(row.matching_status||row.stage))),
    onboarding:countBy(cases,row=>["onboarding","in_progress"].includes(String(row.onboarding_status||row.stage))),
    activationBlocked:countBy(cases,row=>["blocked","conditions_pending","payment_pending"].includes(String(row.activation_status))),
    activeFamilies:countBy(cases,row=>String(row.stage)==="active"||String(row.relationship_status)==="active"),
    retentionRisk:countBy(cases,row=>String(row.retention_status)==="at_risk"||String(row.risk_status)!=="clear"),
    recovery:countBy(cases,row=>String(row.stage)==="recovery"||String(row.retention_status)==="recovery"),
    highValue:countBy(cases,row=>Number(row.estimated_value_mad||0)>=15000),
    pipelineMad:sum(activeCases,"estimated_value_mad"),
    contractedMad:sum(cases.filter((row:any)=>Boolean(row.contract_id)),"estimated_value_mad"),
    realizedMad:0,
    averageSatisfaction:cases.length?Math.round(sum(cases,"satisfaction_score")/Math.max(1,cases.filter((row:any)=>Number(row.satisfaction_score)>0).length)):0,
  }
  const schema={
    cases:casesResult.available,guardians:guardians.available,beneficiaries:beneficiaries.available,
    requirements:requirements.available,needsAssessments:needsAssessments.available,consultations:consultations.available,
    recommendations:recommendations.available,matching:matchingCycles.available&&matchingCandidates.available,
    onboarding:onboardingPlans.available&&onboardingItems.available,activation:activationGates.available,
    careStarts:careStarts.available,satisfaction:satisfactionChecks.available,complaints:complaints.available,
    retention:retentionRisks.available&&retentionPlans.available,recovery:recoveryPlans.available,
    statusHistory:statusHistory.available,evidence:evidence.available,
  }
  return {
    cases,guardians:guardians.rows,beneficiaries:beneficiaries.rows,requirements:requirements.rows,
    needsAssessments:needsAssessments.rows,consultations:consultations.rows,recommendations:recommendations.rows,
    matchingCycles:matchingCycles.rows,matchingCandidates:matchingCandidates.rows,matchingDecisions:matchingDecisions.rows,
    onboardingPlans:onboardingPlans.rows,onboardingItems:onboardingItems.rows,activationGates:activationGates.rows,
    careStarts:careStarts.rows,satisfactionChecks:satisfactionChecks.rows,complaints:complaints.rows,
    retentionRisks:retentionRisks.rows,retentionPlans:retentionPlans.rows,recoveryPlans:recoveryPlans.rows,
    recoveryCheckpoints:recoveryCheckpoints.rows,emergencyContacts:emergencyContacts.rows,
    familyInstructions:familyInstructions.rows,statusHistory:statusHistory.rows,evidence:evidence.rows,
    tasks:tasks.rows.filter(caseFilter),communications:communications.rows,appointments:appointments.rows,
    proposals:proposals.rows,contracts:contracts.rows,paymentConfirmations:paymentConfirmations.rows,
    operationalHandoffs:operationalHandoffs.rows,summary,schema,syncedAt:nowIso(),
  }
}
