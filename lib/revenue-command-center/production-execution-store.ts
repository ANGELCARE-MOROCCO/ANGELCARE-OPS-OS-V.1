"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export type ProductionProspectOption = {
  id: string
  entityType: "prospect" | "partnership"
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
    entityType: "prospect",
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

function normalizePartnershipOption(row: any): ProductionProspectOption {
  const metadata = row?.metadata || {}
  const value = Number(row.value_mad || row.potential_value_mad || row.pipeline_value_mad || row.valueMad || row.potentialValueMad || 0)
  return {
    id: String(row.id),
    entityType: "partnership",
    name: String(row.name || row.organization || row.company || "Unnamed partner"),
    company: row.organization || row.company || row.name,
    city: String(row.city || row.location || metadata.city || "Unassigned"),
    stage: String(row.stage || row.status || "prospecting"),
    priority: String(row.priority || (value >= 100000 ? "high" : "medium")),
    value_mad: value,
    score: Number(row.score || row.probability || row.health_score || 0),
    contactName: row.contactName || row.contact_name,
    owner: row.owner || row.assignedOwner,
    phone: row.phone,
    email: row.email,
    updated_at: row.updated_at || null,
  }
}

function normalizeProductionTask(row: any): ProductionTask {
  return {
    id: String(row.id),
    entity_type: String(row.entity_type || row.entityType || "prospect"),
    entity_id: String(row.entity_id || row.entityId || row.prospect_id || row.prospectId || row.partnership_id || row.partnershipId || ""),
    title: String(row.title || "Untitled task"),
    description: row.description || null,
    owner: String(row.owner || row.assignedOwner || "BD Officer"),
    priority: (row.priority || "medium") as ProductionTask["priority"],
    status: (row.status || "open") as ProductionTask["status"],
    due_date: row.due_date || row.dueDate || null,
    start_at: row.start_at || row.startAt || null,
    end_at: row.end_at || row.endAt || null,
    task_type: String(row.task_type || row.taskType || "follow_up"),
    department: String(row.department || "Revenue Command"),
    assigned_role: row.assigned_role || row.assignedRole || null,
    location: row.location || null,
    outcome_expected: row.outcome_expected || row.outcomeExpected || row.expected_outcome || row.expectedOutcome || null,
    escalation_rule: row.escalation_rule || row.escalationRule || null,
    dependencies: row.dependencies || null,
    tags: Array.isArray(row.tags) ? row.tags : null,
    visibility: row.visibility || null,
    reminder_minutes: row.reminder_minutes || row.reminderMinutes || null,
    add_to_calendar: row.add_to_calendar ?? row.addToCalendar ?? null,
    send_notifications: row.send_notifications ?? row.sendNotifications ?? null,
    completed_at: row.completed_at || row.completedAt || null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    entity_name: row.entity_name || row.entityName || row.prospect_name || row.partnership_name,
    entity_city: row.entity_city || row.entityCity,
    entity_stage: row.entity_stage || row.entityStage,
    entity_priority: row.entity_priority || row.entityPriority,
  }
}

function normalizeProductionAppointment(row: any): ProductionAppointment {
  return {
    id: String(row.id),
    entity_type: String(row.entity_type || row.entityType || "prospect"),
    entity_id: String(row.entity_id || row.entityId || row.prospect_id || row.prospectId || row.partnership_id || row.partnershipId || ""),
    title: String(row.title || "Untitled appointment"),
    appointment_at: String(row.appointment_at || row.appointmentAt || row.scheduled_at || row.scheduledAt || ""),
    owner: String(row.owner || "BD Officer"),
    status: (row.status || "scheduled") as ProductionAppointment["status"],
    location: row.location || null,
    notes: row.notes || null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    entity_name: row.entity_name || row.entityName || row.prospect_name || row.partnership_name,
    entity_city: row.entity_city || row.entityCity,
    entity_stage: row.entity_stage || row.entityStage,
    entity_priority: row.entity_priority || row.entityPriority,
  }
}

async function fetchOperational(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok || payload?.ok === false) {
    throw new Error(String(payload?.error || `Revenue API request failed: ${res.status}`))
  }
  return payload
}

export async function listProductionProspectOptions(query = "") {
  const [prospectResult, partnershipResult] = await Promise.allSettled([
    fetchOperational("/api/revenue-command-center/prospects?limit=2000"),
    fetchOperational("/api/revenue-command-center/partnerships?limit=2000"),
  ])

  if (prospectResult.status === "rejected" && partnershipResult.status === "rejected") {
    throw new Error(`${prospectResult.reason?.message || prospectResult.reason}; ${partnershipResult.reason?.message || partnershipResult.reason}`)
  }

  const prospects = prospectResult.status === "fulfilled"
    ? (prospectResult.value.prospects || prospectResult.value.data || []).map(normalizeProspectOption)
    : []
  const partnerships = partnershipResult.status === "fulfilled"
    ? (partnershipResult.value.partnerships || partnershipResult.value.data || []).map(normalizePartnershipOption)
    : []
  const q = query.trim().toLowerCase()
  const rows = [...prospects, ...partnerships].filter((item) => {
    if (!q) return true
    return `${item.name} ${item.company || ""} ${item.city} ${item.stage} ${item.priority} ${item.contactName || ""} ${item.phone || ""} ${item.email || ""} ${item.entityType}`.toLowerCase().includes(q)
  })

  return {
    prospects: rows,
    count: rows.length,
    source: "revenue_prospects + revenue_partnerships",
    syncedAt: new Date().toISOString(),
  }
}

export async function listProductionTasks() {
  const payload = await fetchOperational("/api/revenue-command-center/tasks?limit=5000")
  const rows = payload.tasks || payload.data || payload.items || []
  if (Array.isArray(rows)) return rows.map(normalizeProductionTask)

  const view = await supabase
    .from("revenue_task_command_view")
    .select("*")
    .order("start_at", { ascending: true, nullsFirst: false })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (!view.error) return (view.data || []).map(normalizeProductionTask)

  const table = await supabase.from("revenue_tasks").select("*").order("updated_at", { ascending: false })
  if (table.error) throw table.error
  return (table.data || []).map(normalizeProductionTask)
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
  const entityType = input.entityType || "prospect"
  const payload = await fetchOperational("/api/revenue-command-center/tasks", {
    method: "POST",
    body: JSON.stringify({
      entityType,
      entityId: input.entityId,
      prospectId: entityType === "prospect" ? input.entityId : undefined,
      partnershipId: entityType === "partnership" ? input.entityId : undefined,
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
      reminderMinutes: input.reminderMinutes || null,
      addToCalendar: Boolean(input.addToCalendar),
      sendNotifications: Boolean(input.sendNotifications),
    status: "open",
    }),
  })
  return normalizeProductionTask(payload.task || payload.data || payload.item)
}

export async function updateProductionTaskStatus(taskId: string, status: "open" | "done" | "cancelled") {
  const action = status === "done" ? "complete" : status === "open" ? "reopen" : "update"
  const payload = await fetchOperational("/api/revenue-command-center/tasks", {
    method: "PATCH",
    body: JSON.stringify({ id: taskId, action, status }),
  })
  return normalizeProductionTask(payload.task || payload.data || payload.item)
}

export async function listProductionAppointments() {
  const payload = await fetchOperational("/api/revenue-command-center/appointments?limit=5000")
  const rows = payload.appointments || payload.data || payload.items || []
  if (Array.isArray(rows)) return rows.map(normalizeProductionAppointment)

  const view = await supabase.from("revenue_appointment_command_view").select("*").order("appointment_at", { ascending: true })
  if (!view.error) return (view.data || []).map(normalizeProductionAppointment)

  const table = await supabase.from("revenue_appointments").select("*").order("appointment_at", { ascending: true })
  if (table.error) throw table.error
  return (table.data || []).map(normalizeProductionAppointment)
}

export async function createProductionAppointment(input: { entityType?: string; entityId: string; title: string; appointmentAt: string; owner?: string; location?: string; notes?: string }) {
  const entityType = input.entityType || "prospect"
  const payload = await fetchOperational("/api/revenue-command-center/appointments", {
    method: "POST",
    body: JSON.stringify({
      entityType,
      entityId: input.entityId,
      prospectId: entityType === "prospect" ? input.entityId : undefined,
      partnershipId: entityType === "partnership" ? input.entityId : undefined,
    title: input.title,
      appointmentAt: input.appointmentAt,
    owner: input.owner || "BD Officer",
    location: input.location || null,
    notes: input.notes || null,
    status: "scheduled",
    }),
  })
  return normalizeProductionAppointment(payload.appointment || payload.data || payload.item)
}

export async function updateProductionAppointmentStatus(appointmentId: string, status: "scheduled" | "completed" | "cancelled" | "no_show") {
  const action = status === "completed" ? "record_outcome" : status === "cancelled" ? "cancel" : status === "no_show" ? "mark_no_show" : "update"
  const payload = await fetchOperational("/api/revenue-command-center/appointments", {
    method: "PATCH",
    body: JSON.stringify({ id: appointmentId, action, status }),
  })
  return normalizeProductionAppointment(payload.appointment || payload.data || payload.item)
}

export function subscribeProductionExecution(onChange: () => void) {
  const channel = supabase
    .channel("revenue-production-execution-canonical")
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_tasks" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_appointments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_prospects" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_partnerships" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_follow_ups" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_notes" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_activities" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_events" }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
