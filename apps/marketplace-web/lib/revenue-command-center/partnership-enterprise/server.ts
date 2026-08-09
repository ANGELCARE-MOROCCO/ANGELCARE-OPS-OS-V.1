import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

import { requireRevenueApiAccess } from "@/lib/revenue-command-center/api-access"
import {
  cleanNumber, cleanString, logRevenueAction, logRevenueActivity, revenueClient,
} from "@/lib/revenue-command-center/canonical-server"

export const PARTNERSHIP_STATUSES = [
  "identified","qualification","qualified","opportunity","engagement","proposal","negotiation",
  "agreement_pending","signature_pending","activation_pending","active","performing","under_review",
  "at_risk","recovery","renewal_pending","renewed","expansion","suspended","terminated","closed",
] as const
export type PartnershipStatus = (typeof PARTNERSHIP_STATUSES)[number]

const STATUS_ALIASES: Record<string, PartnershipStatus> = {
  targeted:"identified",target:"identified",meeting:"engagement",agreement:"agreement_pending",
  growth:"expansion",risk:"at_risk",paused:"suspended",inactive:"closed",
}

export function nowIso(){return new Date().toISOString()}
export function normalizePartnershipStatus(value:unknown):PartnershipStatus{
  const raw=cleanString(value,"identified").toLowerCase().replaceAll("-","_")
  const normalized=STATUS_ALIASES[raw]||raw
  return PARTNERSHIP_STATUSES.includes(normalized as PartnershipStatus)?normalized as PartnershipStatus:"identified"
}
export function uuidOrNull(value:unknown){const v=cleanString(value);return v||null}
export function textIdOrNull(value:unknown){const v=cleanString(value);return v||null}
export function bool(value:unknown,fallback=false){if(typeof value==="boolean")return value;const raw=cleanString(value).toLowerCase();if(["true","1","yes","oui"].includes(raw))return true;if(["false","0","no","non"].includes(raw))return false;return fallback}
export function json(value:unknown,fallback:Record<string,unknown>={}){return value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:fallback}

export async function partnershipContext(permission:string|string[]="revenue.partnerships.read"){
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
export async function getPartnership(client:any,id:string){
  let result=await client.from("revenue_partnership_command_view").select("*").eq("id",id).maybeSingle()
  if(result.error&&isMissingRelation(result.error))result=await client.from("revenue_partnerships").select("*").eq("id",id).maybeSingle()
  if(result.error)throw new Error(result.error.message)
  return result.data||null
}

export function normalizePartnershipPayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  return {
    partner_name:cleanString(body.partnerName||body.partner_name||body.name,"Partenaire ANGELCARE"),
    partner_type:cleanString(body.partnerType||body.partner_type,"institutional"),
    sector:cleanString(body.sector)||null,
    city:cleanString(body.city,"Unassigned"),
    territory:cleanString(body.territory)||null,
    stage:normalizePartnershipStatus(body.stage||body.status),
    status:cleanString(body.recordStatus||body.record_status,"active"),
    priority:cleanString(body.priority,"high"),
    strategic_tier:cleanString(body.strategicTier||body.strategic_tier,"tier_2"),
    qualification_status:cleanString(body.qualificationStatus||body.qualification_status,"not_started"),
    activation_status:cleanString(body.activationStatus||body.activation_status,"not_ready"),
    health_status:cleanString(body.healthStatus||body.health_status,"unknown"),
    health_score:Math.max(0,Math.min(100,cleanNumber(body.healthScore||body.health_score,0))),
    estimated_value_mad:Math.max(0,cleanNumber(body.estimatedValueMad||body.estimated_value_mad,0)),
    owner:cleanString(body.owner,"Partnership Manager"),
    owner_id:uuidOrNull(body.ownerId||body.owner_id),
    account_id:uuidOrNull(body.accountId||body.account_id),
    prospect_text_id:textIdOrNull(body.prospectId||body.prospect_text_id||body.prospect_id),
    contract_id:uuidOrNull(body.contractId||body.contract_id),
    renewal_date:cleanString(body.renewalDate||body.renewal_date)||null,
    next_action:cleanString(body.nextAction||body.next_action,"Qualifier et définir le modèle partenarial"),
    metadata:{...json(body.metadata),commercial_model:cleanString(body.commercialModel||body.commercial_model)||undefined},
  }
}

export function normalizeQualificationPayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  const dimensions={
    strategic_fit:Math.max(0,Math.min(100,cleanNumber(body.strategicFit||body.strategic_fit,0))),
    audience_access:Math.max(0,Math.min(100,cleanNumber(body.audienceAccess||body.audience_access,0))),
    commercial_potential:Math.max(0,Math.min(100,cleanNumber(body.commercialPotential||body.commercial_potential,0))),
    operational_feasibility:Math.max(0,Math.min(100,cleanNumber(body.operationalFeasibility||body.operational_feasibility,0))),
    reputation_risk:Math.max(0,Math.min(100,cleanNumber(body.reputationRisk||body.reputation_risk,0))),
    decision_access:Math.max(0,Math.min(100,cleanNumber(body.decisionAccess||body.decision_access,0))),
  }
  const overall=Math.round((dimensions.strategic_fit+dimensions.audience_access+dimensions.commercial_potential+dimensions.operational_feasibility+dimensions.decision_access+(100-dimensions.reputation_risk))/6)
  return {
    partnership_id:cleanString(body.partnershipId||body.partnerId||body.partnership_id),
    status:cleanString(body.status,overall>=65?"qualified":"under_review"),
    ...dimensions,overall_score:overall,
    evidence_summary:cleanString(body.evidenceSummary||body.evidence_summary),
    disqualification_reason:cleanString(body.disqualificationReason||body.disqualification_reason)||null,
    metadata:json(body.metadata),
  }
}

export function normalizeReferralPayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  const email=cleanString(body.email).toLowerCase()
  const phone=cleanString(body.phone).replace(/[^\d+]/g,"")
  return {
    partnership_id:cleanString(body.partnershipId||body.partnerId||body.partnership_id),
    program_id:uuidOrNull(body.programId||body.program_id),
    source_contact_id:uuidOrNull(body.sourceContactId||body.source_contact_id),
    referred_name:cleanString(body.referredName||body.referred_name||body.beneficiaryName,"Referral sans nom"),
    referred_type:cleanString(body.referredType||body.referred_type,"prospect"),
    email:email||null,normalized_email:email||null,phone:phone||null,normalized_phone:phone||null,
    service_interest:cleanString(body.serviceInterest||body.service_interest),
    consent_status:cleanString(body.consentStatus||body.consent_status,"pending"),
    owner:cleanString(body.owner,"Revenue Command"),
    territory:cleanString(body.territory)||null,
    estimated_value_mad:Math.max(0,cleanNumber(body.estimatedValueMad||body.estimated_value_mad,0)),
    status:cleanString(body.status,"received"),
    received_at:cleanString(body.receivedAt||body.received_at)||nowIso(),
    linked_prospect_id:textIdOrNull(body.prospectId||body.prospect_id),
    linked_opportunity_id:uuidOrNull(body.opportunityId||body.opportunity_id),
    source_evidence:cleanString(body.evidenceReference||body.source_evidence)||null,
    metadata:json(body.metadata),
  }
}

export function normalizeProgramPayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  return {
    partnership_id:cleanString(body.partnershipId||body.partnerId||body.partnership_id),
    name:cleanString(body.name,"Programme partenaire"),
    objective:cleanString(body.objective),
    audience:cleanString(body.audience),
    commercial_model:cleanString(body.commercialModel||body.commercial_model),
    referral_model:cleanString(body.referralModel||body.referral_model),
    success_criteria:cleanString(body.successCriteria||body.success_criteria),
    start_date:cleanString(body.startDate||body.start_date)||null,
    end_date:cleanString(body.endDate||body.end_date)||null,
    review_frequency:cleanString(body.reviewFrequency||body.review_frequency,"quarterly"),
    status:cleanString(body.status,"planning"),
    metadata:json(body.metadata),
  }
}

export function normalizeRiskPayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  return {
    partnership_id:cleanString(body.partnershipId||body.partnerId||body.partnership_id),
    title:cleanString(body.title||body.category,"Risque partenarial"),
    category:cleanString(body.category,"relationship"),
    description:cleanString(body.description),
    severity:cleanString(body.severity,"medium"),
    probability:Math.max(0,Math.min(100,cleanNumber(body.probability,50))),
    value_affected_mad:Math.max(0,cleanNumber(body.valueAffectedMad||body.value_affected_mad||body.revenueAtRiskMad,0)),
    owner:cleanString(body.owner,"Partnership Manager"),
    mitigation:cleanString(body.mitigation),
    due_date:cleanString(body.dueDate||body.due_date)||null,
    status:cleanString(body.status,"open"),
    evidence_reference:cleanString(body.evidenceReference||body.evidence_reference)||null,
    metadata:json(body.metadata),
  }
}

export async function recordPartnershipEvent(client:any,input:{
  partnership?:Record<string,any>|null
  partnershipId?:string|null
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
  const partnershipId=input.partnershipId||input.partnership?.id||null
  if(partnershipId){
    const history=await client.from("revenue_partnership_status_history").insert({
      partnership_id:partnershipId,event_type:input.eventType,previous_state:input.previousState??null,new_state:input.newState??null,
      reason:input.reason||null,actor_id:input.actorId||null,metadata:{payload:input.payload||{},result:input.result||{}},
    })
    if(history.error&&!isMissingRelation(history.error))throw new Error(history.error.message)
  }
  await logRevenueActivity(client,{
    entityType:"partnership",entityId:partnershipId,eventType:input.eventType,title:input.title,
    body:input.reason||null,severity:input.severity||"info",metadata:{payload:input.payload||{},result:input.result||{}},
  }).catch(()=>undefined)
  await logRevenueAction(client,{
    actionType:input.eventType,entityType:"partnership",entityId:partnershipId,
    title:input.title,payload:input.payload||{},result:input.result||{},status:"completed",
  } as any).catch(()=>undefined)
}

export async function insertRow(client:any,table:string,payload:Record<string,unknown>){
  const {data,error}=await client.from(table).insert(payload).select("*").single()
  if(error)throw new Error(error.message)
  return data
}
export async function updateRow(client:any,table:string,id:string,payload:Record<string,unknown>){
  const {data,error}=await client.from(table).update(payload).eq("id",id).select("*").single()
  if(error)throw new Error(error.message)
  return data
}
