import { createClient as createSupabaseAdmin } from '@/lib/supabase/contract-client'
import { cleanNumber, cleanString, logRevenueAction, logRevenueActivity, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess } from "@/lib/revenue-command-center/api-access"

export const APPOINTMENT_STATUSES = [
  "draft","proposed","scheduled","confirmation_pending","confirmed","prepared","live","completed","converted","follow_up","rescheduled","no_show","recovery","cancelled","lost","archived",
] as const
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

const STATUS_ALIASES: Record<string, AppointmentStatus> = {
  requested:"proposed", pending:"confirmation_pending", active:"live", in_progress:"live", done:"completed",
  complete:"completed", closed:"completed", converted_to_opportunity:"converted", canceled:"cancelled", missed:"no_show",
}

export function normalizeAppointmentStatus(value: unknown): AppointmentStatus {
  const raw=cleanString(value,"scheduled").toLowerCase().replaceAll("-","_")
  const normalized=STATUS_ALIASES[raw] || raw
  return APPOINTMENT_STATUSES.includes(normalized as AppointmentStatus) ? normalized as AppointmentStatus : "scheduled"
}

export function nowIso(){ return new Date().toISOString() }

export async function engagementContext(permission: string | string[] = "revenue.appointments.read") {
  const access=await requireRevenueApiAccess(permission)
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const supabase=url && key ? createSupabaseAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}}) : await revenueClient()
  return { access, supabase: supabase as any }
}

export function isMissingRelation(error: unknown) {
  const message=String((error as any)?.message || error || "")
  return /relation .* does not exist|table .* does not exist|schema cache|could not find the table|column .* does not exist/i.test(message)
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

export function normalizeAppointmentPayload(input: unknown) {
  const body=input && typeof input==="object" ? input as Record<string,unknown> : {}
  const metadata=body.metadata && typeof body.metadata==="object" ? body.metadata as Record<string,unknown> : {}
  const appointmentAt=cleanString(body.appointmentAt || body.appointment_at)
  return {
    title:cleanString(body.title,"Rendez-vous commercial"),
    status:normalizeAppointmentStatus(body.status),
    appointment_at:appointmentAt || null,
    end_at:cleanString(body.endAt || body.end_at) || null,
    owner:cleanString(body.owner || body.ownerName,"BD Officer"),
    appointment_type:cleanString(body.appointmentType || body.appointment_type,"commercial_meeting"),
    priority:cleanString(body.priority,"medium"),
    location:cleanString(body.location), meeting_link:cleanString(body.meetingLink || body.meeting_link),
    objective:cleanString(body.objective), expected_outcome:cleanString(body.expectedOutcome || body.expected_outcome),
    agenda:cleanString(body.agenda), notes:cleanString(body.notes),
    entity_type:cleanString(body.entityType || body.entity_type,"prospect"),
    entity_id:cleanString(body.entityId || body.entity_id || body.prospectId || body.prospect_id),
    prospect_id:cleanString(body.prospectId || body.prospect_id || body.entityId || body.entity_id) || null,
    account_id:cleanString(body.accountId || body.account_id) || null,
    opportunity_id:cleanString(body.opportunityId || body.opportunity_id) || null,
    contact_id:cleanString(body.contactId || body.contact_id) || null,
    timezone:cleanString(body.timezone,"Africa/Casablanca"),
    confirmation_status:cleanString(body.confirmationStatus || body.confirmation_status,"pending"),
    preparation_status:cleanString(body.preparationStatus || body.preparation_status,"not_started"),
    no_show_risk:Math.max(0,Math.min(100,cleanNumber(body.noShowRisk || body.no_show_risk,0))),
    commercial_value_mad:Math.max(0,cleanNumber(body.commercialValueMad || body.commercial_value_mad,0)),
    duration_minutes:Math.max(0,cleanNumber(body.durationMinutes || body.duration_minutes,60)),
    metadata,
  }
}

export async function getAppointment(client:any,id:string) {
  const result=await client.from("revenue_appointments").select("*").eq("id",id).maybeSingle()
  if(result.error) throw new Error(result.error.message)
  return result.data || null
}

export function validateAppointmentTransition(current: unknown, target: unknown, input: Record<string,unknown>) {
  const from=normalizeAppointmentStatus(current), to=normalizeAppointmentStatus(target)
  const allowed:Record<AppointmentStatus,AppointmentStatus[]>={
    draft:["proposed","scheduled","cancelled","archived"],
    proposed:["scheduled","confirmation_pending","cancelled"],
    scheduled:["confirmation_pending","confirmed","rescheduled","cancelled","no_show"],
    confirmation_pending:["confirmed","rescheduled","cancelled","no_show"],
    confirmed:["prepared","live","rescheduled","cancelled","no_show"],
    prepared:["live","rescheduled","cancelled","no_show"],
    live:["completed","converted","follow_up","no_show"],
    completed:["converted","follow_up","archived"],
    converted:["follow_up","archived"],
    follow_up:["completed","converted","recovery","archived"],
    rescheduled:["confirmation_pending","confirmed","cancelled","no_show"],
    no_show:["recovery","rescheduled","lost","archived"],
    recovery:["rescheduled","confirmed","lost","archived"],
    cancelled:["proposed","rescheduled","archived"],
    lost:["recovery","archived"], archived:["draft"],
  }
  if(!allowed[from].includes(to)) throw new Error(`Transition non autorisée : ${from} → ${to}.`)
  if(["cancelled","no_show","lost","rescheduled"].includes(to) && !cleanString(input.reason)) throw new Error("Un motif est requis pour cette transition.")
  if(["completed","converted","follow_up"].includes(to) && !cleanString(input.outcome || input.outcomeSummary || input.reason)) throw new Error("Un résultat commercial est requis.")
  return { from,to }
}

export async function recordEngagementEvent(client:any,input:{ appointment:any; eventType:string; title:string; body?:string; severity?:string; metadata?:Record<string,unknown>; actionType?:string; payload?:Record<string,unknown>; result?:Record<string,unknown> }) {
  const appointment=input.appointment || {}
  await logRevenueActivity(client,{ entityType:"appointment", entityId:String(appointment.id||""), prospectId:appointment.prospect_id||null, eventType:input.eventType, title:input.title, body:input.body||null, severity:input.severity||"info", metadata:{appointmentId:appointment.id,...(input.metadata||{})} }).catch(()=>undefined)
  await logRevenueAction(client,{ actionType:input.actionType||input.eventType, entityType:"appointment", entityId:String(appointment.id||""), payload:input.payload||{}, result:input.result||{} }).catch(()=>undefined)
}

export function arrayValue(value: unknown) {
  if(Array.isArray(value)) return value
  if(typeof value==="string") return value.split(",").map(item=>item.trim()).filter(Boolean)
  return []
}

export async function createFollowUpTask(client:any,input:{ appointment:any; title:string; dueAt?:string|null; owner?:string|null; objective?:string|null; metadata?:Record<string,unknown> }) {
  const appointment=input.appointment
  const row={
    entity_type:"appointment", entity_id:String(appointment.id), prospect_id:appointment.prospect_id||null,
    title:input.title, description:input.objective||`Suivi du rendez-vous ${appointment.title||appointment.id}`,
    owner:input.owner||appointment.owner||"BD Officer", priority:appointment.priority||"medium", status:"open",
    due_at:input.dueAt||null, expected_outcome:input.objective||"Faire progresser la relation commerciale.",
    metadata:{appointment_id:appointment.id,account_id:appointment.account_id||null,opportunity_id:appointment.opportunity_id||null,...(input.metadata||{})},
  }
  const result=await client.from("revenue_tasks").insert(row).select("*").single()
  if(result.error) throw new Error(result.error.message)
  return result.data
}
