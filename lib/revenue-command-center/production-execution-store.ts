"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export type ProductionProspectOption = {
  id: string
  name: string
  company?: string
  city: string
  stage: string
  priority: string
  value_mad: number
  score: number
  contactName?: string
  owner?: string
  phone?: string
  email?: string
  updated_at?: string | null
}

export type ProductionTask = {
  id: string
  entity_type: string
  entity_id: string
  title: string
  description: string | null
  owner: string
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "done" | "cancelled"
  due_date: string | null
  start_at: string | null
  end_at: string | null
  task_type: string
  department: string
  assigned_role: string | null
  location: string | null
  outcome_expected: string | null
  escalation_rule: string | null
  dependencies: string | null
  tags: string[] | null
  visibility?: string | null
  reminder_minutes?: number | null
  add_to_calendar?: boolean | null
  send_notifications?: boolean | null
  completed_at: string | null
  created_at: string
  updated_at: string
  entity_name?: string
  entity_city?: string
  entity_stage?: string
  entity_priority?: string
}

export type ProductionAppointment = {
  id: string
  entity_type: string
  entity_id: string
  title: string
  appointment_at: string
  owner: string
  status: "scheduled" | "completed" | "cancelled" | "no_show"
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
  entity_name?: string
  entity_city?: string
  entity_stage?: string
  entity_priority?: string
}

function normalizeProspectOption(row: any): ProductionProspectOption {
  const data = row?.data || {}
  return {
    id: String(row.id),
    name: String(row.name || data.name || data.company || "Unnamed prospect"),
    company: data.company || row.company,
    city: String(row.city || data.city || "Unassigned"),
    stage: String(row.stage || data.stage || "new_lead"),
    priority: String(row.priority || data.priority || "medium"),
    value_mad: Number(row.value_mad || data.valueMad || data.value || 0),
    score: Number(row.score || data.score || 0),
    contactName: data.contactName || row.contact_name,
    owner: data.owner || row.owner,
    phone: data.phone || row.phone,
    email: data.email || row.email,
    updated_at: row.updated_at || null,
  }
}

async function logActivity(row: Record<string, unknown>) {
  try {
    await supabase.from("revenue_activities").insert(row)
  } catch {
    return undefined
  }
}

export async function listProductionProspectOptions(query = "") {
  let dbQuery = supabase.from("revenue_prospects").select("*").order("updated_at", { ascending: false }).limit(2000)
  if (query.trim()) {
    const q = query.trim().replaceAll("%", "")
    dbQuery = dbQuery.or(`name.ilike.%${q}%,city.ilike.%${q}%,stage.ilike.%${q}%`)
  }
  const { data, error, count } = await dbQuery
  if (error) throw error

  return {
    prospects: (data || []).map(normalizeProspectOption),
    count: count ?? (data || []).length,
    source: "revenue_prospects",
    syncedAt: new Date().toISOString(),
  }
}

export async function listProductionTasks() {
  const view = await supabase
    .from("revenue_task_command_view")
    .select("*")
    .order("start_at", { ascending: true, nullsFirst: false })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (!view.error) return (view.data || []) as ProductionTask[]

  const table = await supabase.from("revenue_tasks").select("*").order("updated_at", { ascending: false })
  if (table.error) throw table.error
  return (table.data || []) as ProductionTask[]
}

export async function createProductionTask(input: {
  entityType?: string
  entityId: string
  title: string
  description?: string
  owner?: string
  priority?: "low" | "medium" | "high" | "critical"
  dueDate?: string
  startAt?: string
  endAt?: string
  taskType?: string
  department?: string
  assignedRole?: string
  location?: string
  outcomeExpected?: string
  escalationRule?: string
  dependencies?: string
  tags?: string[]
  visibility?: string
  reminderMinutes?: number
  addToCalendar?: boolean
  sendNotifications?: boolean
}) {
  const { data, error } = await supabase.from("revenue_tasks").insert({
    entity_type: input.entityType || "prospect",
    entity_id: input.entityId,
    title: input.title,
    description: input.description || null,
    owner: input.owner || "BD Officer",
    priority: input.priority || "medium",
    due_date: input.dueDate || null,
    start_at: input.startAt || null,
    end_at: input.endAt || null,
    task_type: input.taskType || "follow_up",
    department: input.department || "business_development",
    assigned_role: input.assignedRole || null,
    location: input.location || null,
    outcome_expected: input.outcomeExpected || null,
    escalation_rule: input.escalationRule || null,
    dependencies: input.dependencies || null,
    tags: input.tags || [],
    visibility: input.visibility || "team",
    reminder_minutes: input.reminderMinutes || null,
    add_to_calendar: Boolean(input.addToCalendar),
    send_notifications: Boolean(input.sendNotifications),
    status: "open",
  }).select().single()

  if (error) throw error
  await logActivity({ entity_type: input.entityType || "prospect", entity_id: input.entityId, event_type: "task.created", event_title: "Task created", event_body: input.title, actor: "AngelCare", severity: "info", metadata: { taskId: data.id } })
  return data as ProductionTask
}

export async function updateProductionTaskStatus(taskId: string, status: "open" | "done" | "cancelled") {
  const { data, error } = await supabase.from("revenue_tasks").update({ status, completed_at: status === "done" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", taskId).select().single()
  if (error) throw error
  await logActivity({ entity_type: data.entity_type || "prospect", entity_id: data.entity_id, event_type: `task.${status}`, event_title: "Task status updated", event_body: data.title, actor: "AngelCare", severity: "info", metadata: { taskId, status } })
  return data as ProductionTask
}

export async function listProductionAppointments() {
  const view = await supabase.from("revenue_appointment_command_view").select("*").order("appointment_at", { ascending: true })
  if (!view.error) return (view.data || []) as ProductionAppointment[]

  const table = await supabase.from("revenue_appointments").select("*").order("appointment_at", { ascending: true })
  if (table.error) throw table.error
  return (table.data || []) as ProductionAppointment[]
}

export async function createProductionAppointment(input: { entityType?: string; entityId: string; title: string; appointmentAt: string; owner?: string; location?: string; notes?: string }) {
  const { data, error } = await supabase.from("revenue_appointments").insert({
    entity_type: input.entityType || "prospect",
    entity_id: input.entityId,
    title: input.title,
    appointment_at: input.appointmentAt,
    owner: input.owner || "BD Officer",
    location: input.location || null,
    notes: input.notes || null,
    status: "scheduled",
  }).select().single()

  if (error) throw error
  await logActivity({ entity_type: input.entityType || "prospect", entity_id: input.entityId, event_type: "appointment.scheduled", event_title: "Appointment scheduled", event_body: input.title, actor: "AngelCare", severity: "info", metadata: { appointmentId: data.id } })
  return data as ProductionAppointment
}

export async function updateProductionAppointmentStatus(appointmentId: string, status: "scheduled" | "completed" | "cancelled" | "no_show") {
  const { data, error } = await supabase.from("revenue_appointments").update({ status, updated_at: new Date().toISOString() }).eq("id", appointmentId).select().single()
  if (error) throw error
  await logActivity({ entity_type: data.entity_type || "prospect", entity_id: data.entity_id, event_type: `appointment.${status}`, event_title: "Appointment status updated", event_body: data.title, actor: "AngelCare", severity: "info", metadata: { appointmentId, status } })
  return data as ProductionAppointment
}

export function subscribeProductionExecution(onChange: () => void) {
  const channel = supabase
    .channel("revenue-production-execution-canonical")
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_tasks" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_appointments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_prospects" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_activities" }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}