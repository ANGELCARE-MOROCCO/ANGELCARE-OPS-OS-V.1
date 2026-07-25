import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { cleanNumber, cleanString, logRevenueAction, logRevenueActivity, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess } from "@/lib/revenue-command-center/api-access"

export const CONTRACT_STATUSES=["draft","internal_review","approval_required","approved","signature_preparation","signature_pending","partially_signed","fully_signed","conditions_pending","effective","activation_pending","active","suspended","completed","expired","terminated","superseded","archived"] as const
export type ContractStatus=(typeof CONTRACT_STATUSES)[number]
const STATUS_ALIASES:Record<string,ContractStatus>={new:"draft",review:"internal_review",approval:"approval_required",signed:"fully_signed",enabled:"active",cancelled:"terminated",closed:"completed"}

export function nowIso(){return new Date().toISOString()}
export function normalizeContractStatus(value:unknown):ContractStatus{const raw=cleanString(value,"draft").toLowerCase().replaceAll("-","_");const normalized=STATUS_ALIASES[raw]||raw;return CONTRACT_STATUSES.includes(normalized as ContractStatus)?normalized as ContractStatus:"draft"}
export function normalizeContextType(value:unknown){const raw=cleanString(value,"partnership").toLowerCase();return ["prospect","partnership","system"].includes(raw)?raw:"partnership"}
export function uuidOrNull(value:unknown){const text=cleanString(value);return text||null}

export async function contractContext(permission:string|string[]="revenue.contracts.read"){
  const access=await requireRevenueApiAccess(permission)
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_KEY
  const supabase=url&&key?createSupabaseAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):await revenueClient()
  return {access,supabase:supabase as any}
}
export function isMissingRelation(error:unknown){const message=String((error as any)?.message||error||"");return /relation .* does not exist|table .* does not exist|schema cache|could not find the table|column .* does not exist|function .* does not exist/i.test(message)}
export async function optionalRows(client:any,table:string,select="*",configure?:(query:any)=>any){let query=client.from(table).select(select);if(configure)query=configure(query);const result=await query;if(!result.error)return {rows:result.data||[],available:true};if(isMissingRelation(result.error))return {rows:[],available:false,error:result.error.message};throw new Error(result.error.message)}
export async function optionalOne(client:any,table:string,select:string,configure:(query:any)=>any){const result=await configure(client.from(table).select(select)).maybeSingle();if(!result.error)return {row:result.data||null,available:true};if(isMissingRelation(result.error))return {row:null,available:false,error:result.error.message};throw new Error(result.error.message)}

export function normalizeContractPayload(input:unknown){
  const body=input&&typeof input==="object"?input as Record<string,unknown>:{}
  const contextType=normalizeContextType(body.contextType||body.context_type)
  const contextId=cleanString(body.contextId||body.context_id||body.entityId||body.entity_id)
  const value=Math.max(0,cleanNumber(body.contractValue||body.contract_value||body.finalValue,0))
  return {
    title:cleanString(body.title,"Contrat commercial ANGELCARE"),status:normalizeContractStatus(body.status),contract_type:cleanString(body.contractType||body.contract_type,contextType==="partnership"?"partnership_agreement":"commercial_contract"),context_type:contextType,
    prospect_id:contextType==="prospect"?contextId||cleanString(body.prospectId||body.prospect_id)||null:cleanString(body.prospectId||body.prospect_id)||null,
    partnership_id:contextType==="partnership"?contextId||cleanString(body.partnershipId||body.partnership_id)||null:cleanString(body.partnershipId||body.partnership_id)||null,
    account_id:uuidOrNull(body.accountId||body.account_id),contact_id:uuidOrNull(body.contactId||body.contact_id),opportunity_id:uuidOrNull(body.opportunityId||body.opportunity_id),proposal_id:uuidOrNull(body.proposalId||body.proposal_id),proposal_version_id:uuidOrNull(body.proposalVersionId||body.proposal_version_id),commercial_outcome_id:uuidOrNull(body.commercialOutcomeId||body.commercial_outcome_id),contract_handoff_id:uuidOrNull(body.contractHandoffId||body.contract_handoff_id),
    owner:cleanString(body.owner,"Revenue Manager"),currency:cleanString(body.currency,"MAD"),contract_value:value,signed_value:Math.max(0,cleanNumber(body.signedValue||body.signed_value,value)),review_status:cleanString(body.reviewStatus||body.review_status,"not_requested"),approval_status:cleanString(body.approvalStatus||body.approval_status,"not_requested"),signature_status:cleanString(body.signatureStatus||body.signature_status,"not_prepared"),effectiveness_status:cleanString(body.effectivenessStatus||body.effectiveness_status,"not_ready"),payment_gate_status:cleanString(body.paymentGateStatus||body.payment_gate_status,"not_required"),activation_status:cleanString(body.activationStatus||body.activation_status,"not_ready"),realization_status:cleanString(body.realizationStatus||body.realization_status,"not_eligible"),effective_date:cleanString(body.effectiveDate||body.effective_date)||null,expiry_date:cleanString(body.expiryDate||body.expiry_date)||null,renewal_notice_date:cleanString(body.renewalNoticeDate||body.renewal_notice_date)||null,next_action:cleanString(body.nextAction||body.next_action,"Compléter le dossier contractuel"),metadata:body.metadata&&typeof body.metadata==="object"?body.metadata:{},
  }
}

export async function getContract(client:any,id:string){let result=await client.from("revenue_contract_command_view").select("*").eq("id",id).maybeSingle();if(result.error&&isMissingRelation(result.error))result=await client.from("revenue_contracts").select("*").eq("id",id).maybeSingle();if(result.error)throw new Error(result.error.message);return result.data||null}

export function validateContractTransition(current:unknown,target:unknown,input:Record<string,unknown>={}){
  const from=normalizeContractStatus(current),to=normalizeContractStatus(target)
  const allowed:Record<ContractStatus,ContractStatus[]>={
    draft:["internal_review","approval_required","terminated","archived"],internal_review:["approval_required","draft","terminated"],approval_required:["approved","internal_review","terminated"],approved:["signature_preparation","internal_review","terminated"],signature_preparation:["signature_pending","approved","terminated"],signature_pending:["partially_signed","fully_signed","signature_preparation","terminated"],partially_signed:["fully_signed","signature_pending","terminated"],fully_signed:["conditions_pending","effective","terminated"],conditions_pending:["effective","suspended","terminated"],effective:["activation_pending","active","suspended","terminated"],activation_pending:["active","suspended","terminated"],active:["suspended","completed","expired","terminated","superseded"],suspended:["active","terminated","expired"],completed:["archived"],expired:["archived","superseded"],terminated:["archived"],superseded:["archived"],archived:["draft"],
  }
  if(!allowed[from].includes(to))throw new Error(`Transition contractuelle non autorisée : ${from} → ${to}.`)
  if(["terminated","suspended","superseded","expired"].includes(to)&&!cleanString(input.reason))throw new Error("Un motif documenté est requis pour cette transition.")
  return {from,to}
}

export async function recordContractEvent(client:any,input:{contract:any;eventType:string;title:string;body?:string;metadata?:Record<string,unknown>;payload?:Record<string,unknown>;result?:Record<string,unknown>;severity?:string}){
  const contract=input.contract||{}
  await logRevenueActivity(client,{entityType:"contract",entityId:String(contract.id||""),prospectId:contract.prospect_id||null,eventType:input.eventType,title:input.title,body:input.body||null,severity:input.severity||"info",metadata:{contractId:contract.id,accountId:contract.account_id||null,opportunityId:contract.opportunity_id||null,proposalId:contract.proposal_id||null,...(input.metadata||{})}}).catch(()=>undefined)
  await logRevenueAction(client,{actionType:input.eventType,entityType:"contract",entityId:String(contract.id||""),payload:input.payload||{},result:input.result||{}}).catch(()=>undefined)
}
export async function createContractTask(client:any,input:{contract:any;title:string;priority?:string;dueAt?:string|null;objective?:string;metadata?:Record<string,unknown>}){
  const c=input.contract
  const row={entity_type:"contract",entity_id:String(c.id),prospect_id:c.prospect_id||null,title:input.title,description:input.objective||`Action liée à ${c.title}`,owner:c.owner||"Revenue Manager",priority:input.priority||"high",status:"open",due_at:input.dueAt||null,expected_outcome:input.objective||"Sécuriser le prochain gate contractuel.",metadata:{contract_id:c.id,account_id:c.account_id||null,opportunity_id:c.opportunity_id||null,proposal_id:c.proposal_id||null,...(input.metadata||{})}}
  const result=await client.from("revenue_tasks").insert(row).select("*").single();if(result.error)throw new Error(result.error.message);return result.data
}
