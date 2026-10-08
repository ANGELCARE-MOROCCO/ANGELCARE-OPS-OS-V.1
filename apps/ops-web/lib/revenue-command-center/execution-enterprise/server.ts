import { createClient as createSupabaseAdmin } from '@/lib/supabase/contract-client'
import { cleanNumber, cleanString, logRevenueAction, logRevenueActivity, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess } from "@/lib/revenue-command-center/api-access"

export const EXECUTION_STATUSES = ["open","in_progress","waiting","blocked","review_required","approval_required","done","cancelled","archived"] as const
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number]

const STATUS_ALIASES: Record<string, ExecutionStatus> = {
  active:"in_progress", working:"in_progress", pending:"waiting", on_hold:"waiting", waiting_external:"waiting",
  review:"review_required", approval:"approval_required", completed:"done", complete:"done", closed:"done", canceled:"cancelled",
}

export function normalizeExecutionStatus(value: unknown): ExecutionStatus {
  const raw=cleanString(value,"open").toLowerCase().replaceAll("-","_")
  const normalized=STATUS_ALIASES[raw] || raw
  return EXECUTION_STATUSES.includes(normalized as ExecutionStatus) ? normalized as ExecutionStatus : "open"
}

export function nowIso(){ return new Date().toISOString() }

export async function executionContext(permission: string | string[] = "revenue.tasks.read") {
  const access=await requireRevenueApiAccess(permission)
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const supabase=url && key ? createSupabaseAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}}) : await revenueClient()
  return { access, supabase: supabase as any }
}

export function isMissingRelation(error: unknown) {
  const message=String((error as any)?.message || error || "")
  return /relation .* does not exist|table .* does not exist|schema cache|could not find the table/i.test(message)
}

export async function optionalRows(client:any, table:string, select="*", configure?:(query:any)=>any) {
  let query=client.from(table).select(select)
  if(configure) query=configure(query)
  const result=await query
  if(!result.error) return { rows:result.data || [], available:true }
  if(isMissingRelation(result.error)) return { rows:[], available:false, error:result.error.message }
  throw new Error(result.error.message)
}

export async function optionalOne(client:any, table:string, select:string, configure:(query:any)=>any) {
  const result=await configure(client.from(table).select(select)).maybeSingle()
  if(!result.error) return { row:result.data || null, available:true }
  if(isMissingRelation(result.error)) return { row:null, available:false, error:result.error.message }
  throw new Error(result.error.message)
}

export function normalizeTaskPayload(input: unknown) {
  const body=input && typeof input==="object" ? input as Record<string,unknown> : {}
  const metadata=body.metadata && typeof body.metadata==="object" ? body.metadata as Record<string,unknown> : {}
  return {
    title:cleanString(body.title,"Tâche sans titre"), description:cleanString(body.description),
    status:normalizeExecutionStatus(body.status), priority:cleanString(body.priority,"medium"),
    owner:cleanString(body.owner || body.ownerName,"Non attribué"), assigned_role:cleanString(body.assignedRole || body.assigned_role),
    entity_type:cleanString(body.entityType || body.entity_type,"internal"), entity_id:cleanString(body.entityId || body.entity_id) || null,
    prospect_id:cleanString(body.prospectId || body.prospect_id) || null,
    due_at:cleanString(body.dueAt || body.due_at || body.dueDate || body.due_date) || null,
    start_at:cleanString(body.startAt || body.start_at) || null,
    expected_outcome:cleanString(body.expectedOutcome || body.expected_outcome),
    completion_outcome:cleanString(body.completionOutcome || body.completion_outcome),
    estimated_minutes:Math.max(0,cleanNumber(body.estimatedMinutes || body.estimated_minutes,0)),
    actual_minutes:Math.max(0,cleanNumber(body.actualMinutes || body.actual_minutes,0)),
    evidence_required:Boolean(body.evidenceRequired ?? body.evidence_required ?? false),
    approval_required:Boolean(body.approvalRequired ?? body.approval_required ?? false),
    metadata,
  }
}

export async function getTask(client:any,id:string) {
  const result=await client.from("revenue_tasks").select("*").eq("id",id).maybeSingle()
  if(result.error) throw new Error(result.error.message)
  return result.data || null
}

export async function recordExecutionEvent(client:any, input:{ task:any; eventType:string; title:string; body?:string; severity?:string; metadata?:Record<string,unknown>; actionType?:string; payload?:Record<string,unknown>; result?:Record<string,unknown> }) {
  const task=input.task || {}
  await logRevenueActivity(client,{entityType:"task",entityId:String(task.id||""),prospectId:task.prospect_id||null,eventType:input.eventType,title:input.title,body:input.body||null,severity:input.severity||"info",metadata:input.metadata||{}}).catch(()=>undefined)
  await logRevenueAction(client,{actionType:input.actionType||input.eventType,entityType:"task",entityId:String(task.id||""),payload:input.payload||{},result:input.result||{}}).catch(()=>undefined)
}

export function validateTransition(current: unknown, target: unknown, input: Record<string,unknown>) {
  const from=normalizeExecutionStatus(current), to=normalizeExecutionStatus(target)
  const allowed:Record<ExecutionStatus,ExecutionStatus[]>={
    open:["in_progress","waiting","blocked","cancelled","archived"],
    in_progress:["waiting","blocked","review_required","approval_required","done","cancelled"],
    waiting:["in_progress","blocked","cancelled"],
    blocked:["in_progress","waiting","cancelled"],
    review_required:["in_progress","approval_required","done"],
    approval_required:["in_progress","done","cancelled"],
    done:["in_progress","archived"], cancelled:["open","archived"], archived:["open"],
  }
  if(!allowed[from].includes(to)) throw new Error(`Transition non autorisée : ${from} → ${to}.`)
  if(["blocked","cancelled"].includes(to) && !cleanString(input.reason)) throw new Error("Un motif est requis pour cette transition.")
  if(to==="done" && !cleanString(input.completionOutcome || input.completion_outcome)) throw new Error("Un résultat de clôture est requis.")
  return { from,to }
}

export async function tableCount(client:any,table:string,taskId?:string) {
  let query=client.from(table).select("id",{count:"exact",head:true})
  if(taskId) query=query.eq("task_id",taskId)
  const result=await query
  if(result.error){ if(isMissingRelation(result.error)) return 0; throw new Error(result.error.message) }
  return result.count || 0
}
