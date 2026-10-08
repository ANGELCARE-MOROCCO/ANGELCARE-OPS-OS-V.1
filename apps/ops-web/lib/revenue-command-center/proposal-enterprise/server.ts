import { createClient as createSupabaseAdmin } from '@/lib/supabase/contract-client'
import { cleanNumber, cleanString, logRevenueAction, logRevenueActivity, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess } from "@/lib/revenue-command-center/api-access"

export const PROPOSAL_STATUSES = [
  "draft","internal_preparation","pricing_review","approval_required","approved","ready_to_send","sent","customer_review","revision_requested","negotiation","accepted","rejected","expired","withdrawn","superseded","contract_ready","archived",
] as const
export type ProposalStatus=(typeof PROPOSAL_STATUSES)[number]

const STATUS_ALIASES:Record<string,ProposalStatus>={
  new:"draft",pending:"internal_preparation",review:"pricing_review",approval:"approval_required",ready:"ready_to_send",delivered:"sent",viewed:"customer_review",won:"accepted",lost:"rejected",closed:"archived",
}

export function nowIso(){return new Date().toISOString()}
export function normalizeProposalStatus(value:unknown):ProposalStatus{
  const raw=cleanString(value,"draft").toLowerCase().replaceAll("-","_")
  const normalized=STATUS_ALIASES[raw]||raw
  return PROPOSAL_STATUSES.includes(normalized as ProposalStatus)?normalized as ProposalStatus:"draft"
}

export async function proposalContext(permission:string|string[]="revenue.proposals.read"){
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

export function uuidOrNull(value:unknown){const text=cleanString(value);return text||null}
export function normalizeContextType(value:unknown){const raw=cleanString(value,"prospect").toLowerCase();return ["prospect","partnership","b2c"].includes(raw)?raw:"prospect"}

export function normalizeProposalPayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  const contextType=normalizeContextType(body.contextType||body.context_type||body.proposalType)
  const contextId=cleanString(body.contextId||body.context_id||body.entityId||body.entity_id)
  const gross=Math.max(0,cleanNumber(body.grossValue||body.gross_value,0))
  const discount=Math.max(0,cleanNumber(body.discountValue||body.discount_value,0))
  const cost=Math.max(0,cleanNumber(body.estimatedCost||body.estimated_cost,0))
  const net=Math.max(0,gross-discount)
  const margin=net-cost
  const marginPercent=net>0?(margin/net)*100:0
  return {
    title:cleanString(body.title,"Proposition commerciale ANGELCARE"),
    status:normalizeProposalStatus(body.status),
    proposal_type:cleanString(body.proposalType||body.proposal_type,contextType==="b2c"?"b2c_quote":contextType),
    context_type:contextType,
    prospect_id:contextType==="prospect"?contextId||cleanString(body.prospectId||body.prospect_id)||null:cleanString(body.prospectId||body.prospect_id)||null,
    partnership_id:contextType==="partnership"?contextId||cleanString(body.partnershipId||body.partnership_id)||null:cleanString(body.partnershipId||body.partnership_id)||null,
    b2c_case_id:contextType==="b2c"?contextId||cleanString(body.b2cCaseId||body.b2c_case_id)||null:cleanString(body.b2cCaseId||body.b2c_case_id)||null,
    account_id:uuidOrNull(body.accountId||body.account_id),
    contact_id:uuidOrNull(body.contactId||body.contact_id),
    opportunity_id:uuidOrNull(body.opportunityId||body.opportunity_id),
    meeting_outcome_id:uuidOrNull(body.meetingOutcomeId||body.meeting_outcome_id),
    owner:cleanString(body.owner,"BD Officer"),
    currency:cleanString(body.currency,"MAD"),
    gross_value:gross,discount_value:discount,discount_percent:gross>0?(discount/gross)*100:0,net_value:net,estimated_cost:cost,gross_margin:margin,margin_percent:marginPercent,
    minimum_margin_percent:Math.max(0,cleanNumber(body.minimumMarginPercent||body.minimum_margin_percent,25)),
    validity_until:cleanString(body.validityUntil||body.validity_until)||null,
    next_action:cleanString(body.nextAction||body.next_action,"Compléter la proposition"),
    commercial_objective:cleanString(body.commercialObjective||body.commercial_objective),
    client_need:cleanString(body.clientNeed||body.client_need),
    metadata:body.metadata&&typeof body.metadata==="object"?body.metadata:{},
  }
}

export function normalizeLinePayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  const quantity=Math.max(0,cleanNumber(body.quantity,1))
  const unitPrice=Math.max(0,cleanNumber(body.unitPrice||body.unit_price,0))
  const gross=quantity*unitPrice
  const discount=Math.max(0,Math.min(gross,cleanNumber(body.discountValue||body.discount_value,0)))
  const net=gross-discount
  const cost=Math.max(0,cleanNumber(body.estimatedCost||body.estimated_cost,0))
  return {
    proposal_id:cleanString(body.proposalId||body.proposal_id),
    proposal_version_id:uuidOrNull(body.proposalVersionId||body.proposal_version_id),
    label:cleanString(body.label||body.serviceName||body.service_name,"Ligne de service"),
    description:cleanString(body.description),quantity,unit_price:unitPrice,gross_value:gross,discount_value:discount,net_value:net,estimated_cost:cost,gross_margin:net-cost,
    optional:String(body.optional||"false")==="true",internal_only:String(body.internalOnly||body.internal_only||"false")==="true",
    sort_order:Math.max(0,cleanNumber(body.sortOrder||body.sort_order,0)),metadata:body.metadata&&typeof body.metadata==="object"?body.metadata:{},
  }
}

export function calculateFinancials(input:{grossValue:unknown;discountValue:unknown;estimatedCost:unknown}){
  const gross=Math.max(0,cleanNumber(input.grossValue,0))
  const discount=Math.max(0,Math.min(gross,cleanNumber(input.discountValue,0)))
  const cost=Math.max(0,cleanNumber(input.estimatedCost,0))
  const net=gross-discount,margin=net-cost,marginPercent=net>0?(margin/net)*100:0
  return {gross_value:gross,discount_value:discount,discount_percent:gross>0?(discount/gross)*100:0,net_value:net,estimated_cost:cost,gross_margin:margin,margin_percent:marginPercent}
}

export async function getProposal(client:any,id:string){
  let result=await client.from("revenue_proposal_command_view").select("*").eq("id",id).maybeSingle()
  if(result.error&&isMissingRelation(result.error))result=await client.from("revenue_proposals").select("*").eq("id",id).maybeSingle()
  if(result.error)throw new Error(result.error.message)
  return result.data||null
}

export function validateProposalTransition(current:unknown,target:unknown,input:Record<string,unknown>={}){
  const from=normalizeProposalStatus(current),to=normalizeProposalStatus(target)
  const allowed:Record<ProposalStatus,ProposalStatus[]>={
    draft:["internal_preparation","pricing_review","withdrawn","archived"],internal_preparation:["pricing_review","draft","withdrawn"],pricing_review:["approval_required","approved","internal_preparation","withdrawn"],approval_required:["approved","pricing_review","withdrawn"],approved:["ready_to_send","pricing_review","withdrawn"],ready_to_send:["sent","approved","withdrawn"],sent:["customer_review","revision_requested","negotiation","accepted","rejected","expired"],customer_review:["revision_requested","negotiation","accepted","rejected","expired"],revision_requested:["internal_preparation","pricing_review","superseded"],negotiation:["accepted","rejected","revision_requested","expired"],accepted:["contract_ready","superseded"],rejected:["revision_requested","archived"],expired:["revision_requested","archived"],withdrawn:["draft","archived"],superseded:["archived"],contract_ready:["archived"],archived:["draft"],
  }
  if(!allowed[from].includes(to))throw new Error(`Transition non autorisée : ${from} → ${to}.`)
  if(["rejected","withdrawn","expired","superseded"].includes(to)&&!cleanString(input.reason))throw new Error("Un motif est requis pour cette transition.")
  return {from,to}
}

export async function recordProposalEvent(client:any,input:{proposal:any;eventType:string;title:string;body?:string;metadata?:Record<string,unknown>;payload?:Record<string,unknown>;result?:Record<string,unknown>;severity?:string}){
  const proposal=input.proposal||{}
  const prospectId=proposal.prospect_id||null
  await logRevenueActivity(client,{entityType:"proposal",entityId:String(proposal.id||""),prospectId,eventType:input.eventType,title:input.title,body:input.body||null,severity:input.severity||"info",metadata:{proposalId:proposal.id,accountId:proposal.account_id||null,opportunityId:proposal.opportunity_id||null,...(input.metadata||{})}}).catch(()=>undefined)
  await logRevenueAction(client,{actionType:input.eventType,entityType:"proposal",entityId:String(proposal.id||""),payload:input.payload||{},result:input.result||{}}).catch(()=>undefined)
}

export async function createProposalTask(client:any,input:{proposal:any;title:string;status?:string;priority?:string;dueAt?:string|null;objective?:string;metadata?:Record<string,unknown>}){
  const proposal=input.proposal
  const row={entity_type:"proposal",entity_id:String(proposal.id),prospect_id:proposal.prospect_id||null,title:input.title,description:input.objective||`Action liée à ${proposal.title}`,owner:proposal.owner||"BD Officer",priority:input.priority||"high",status:input.status||"open",due_at:input.dueAt||null,expected_outcome:input.objective||"Faire progresser la décision commerciale.",metadata:{proposal_id:proposal.id,account_id:proposal.account_id||null,opportunity_id:proposal.opportunity_id||null,...(input.metadata||{})}}
  const result=await client.from("revenue_tasks").insert(row).select("*").single()
  if(result.error)throw new Error(result.error.message)
  return result.data
}
