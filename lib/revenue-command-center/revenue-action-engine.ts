"use client"

import { createClient } from "@/lib/supabase/client"
import type { RevenueEntityType } from "./revenue-types"

const supabase = createClient()

type Json = Record<string, unknown>

async function safeInsert(table: string, row: Json) {
  const { data, error } = await supabase.from(table).insert(row).select().single()
  if (error) throw error
  return data
}

function linkedPayload(entityType: RevenueEntityType, entityId: string) {
  return {
    entityType,
    entityId,
    prospectId: entityType === "prospect" ? entityId : undefined,
    partnershipId: entityType === "partnership" ? entityId : undefined,
  }
}

async function apiJson(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) throw new Error(String(payload?.error || `Revenue API request failed: ${response.status}`))
  return payload
}

async function safeLogEvent(entityType: RevenueEntityType, entityId: string, eventType: string, title: string, body?: string, metadata: Json = {}) {
  const activityRow = {
    entity_type: entityType,
    entity_id: entityId,
    prospect_id: entityType === "prospect" ? entityId : null,
    partnership_id: entityType === "partnership" ? entityId : null,
    event_type: eventType,
    title,
    event_title: title,
    body: body || null,
    event_body: body || null,
    actor: "AngelCare",
    severity: "info",
    metadata,
  }

  const activity = await supabase.from("revenue_activities").insert(activityRow).select().single()
  if (!activity.error) return activity.data

  // Backward-compatible fallback for current installs that still have revenue_events first.
  const event = await supabase.from("revenue_events").insert(activityRow).select().single()
  if (!event.error) return event.data

  // Last fallback for installs where only the RPC exists. Never block the business action if logging fails.
  try {
    await supabase.rpc("revenue_log_event", {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_event_type: eventType,
      p_event_title: title,
      p_event_body: body || null,
      p_actor: "AngelCare",
      p_severity: "info",
      p_metadata: metadata,
    })
  } catch {
    return undefined
  }
}

export async function revenueCreateTask(input: {
  entityType?: RevenueEntityType
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
  expectedOutcome?: string
}) {
  const entityType = input.entityType || "prospect"
  const payload = await apiJson("/api/revenue-command-center/tasks", {
    method: "POST",
    body: JSON.stringify({
    ...linkedPayload(entityType, input.entityId),
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
    outcome_expected: input.expectedOutcome || null,
    status: "open",
    }),
  })
  return payload.task || payload.data || payload.item
}

export async function revenueCompleteTask(taskId: string, entityType: RevenueEntityType, entityId: string, done: boolean) {
  const payload = await apiJson("/api/revenue-command-center/tasks", {
    method: "PATCH",
    body: JSON.stringify({ id: taskId, action: done ? "complete" : "reopen", ...linkedPayload(entityType, entityId) }),
  })
  return payload.task || payload.data || payload.item
}

export async function revenueDeleteTask(taskId: string, entityType: RevenueEntityType, entityId: string) {
  const response = await fetch(`/api/revenue-command-center/tasks?id=${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    cache: "no-store",
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) throw new Error(String(payload?.error || "Unable to archive task"))
  await safeLogEvent(entityType, entityId, "task.archived", "Task archived", taskId, { taskId })
  return payload.task || payload.data || payload.item
}

export async function revenueScheduleAppointment(input: {
  entityType?: RevenueEntityType
  entityId: string
  title: string
  appointmentAt: string
  owner?: string
  location?: string
  notes?: string
  appointmentType?: string
  priority?: string
}) {
  const entityType = input.entityType || "prospect"
  const payload = await apiJson("/api/revenue-command-center/appointments", {
    method: "POST",
    body: JSON.stringify({
    ...linkedPayload(entityType, input.entityId),
    title: input.title,
    appointmentAt: input.appointmentAt,
    owner: input.owner || "BD Officer",
    location: input.location || null,
    notes: input.notes || null,
    appointment_type: input.appointmentType || "meeting",
    priority: input.priority || "medium",
    status: "scheduled",
    }),
  })
  return payload.appointment || payload.data || payload.item
}

export async function revenueUpdateAppointmentStatus(appointmentId: string, entityType: RevenueEntityType, entityId: string, status: "scheduled" | "completed" | "cancelled" | "no_show") {
  const action = status === "completed" ? "record_outcome" : status === "cancelled" ? "cancel" : status === "no_show" ? "mark_no_show" : "update"
  const payload = await apiJson("/api/revenue-command-center/appointments", {
    method: "PATCH",
    body: JSON.stringify({ id: appointmentId, action, status, ...linkedPayload(entityType, entityId) }),
  })
  return payload.appointment || payload.data || payload.item
}

export async function revenueAddComment(input: { entityType?: RevenueEntityType; entityId: string; author?: string; channel?: string; note: string }) {
  const entityType = input.entityType || "prospect"
  const payload = await apiJson("/api/revenue-command-center/notes", {
    method: "POST",
    body: JSON.stringify({
    ...linkedPayload(entityType, input.entityId),
    author: input.author || "AngelCare",
    noteType: "comment",
    visibility: input.channel || "internal",
    body: input.note,
    }),
  })
  return payload.note || payload.comment || payload.data || payload.item
}

export async function revenueAddDocument(input: { entityType?: RevenueEntityType; entityId: string; title: string; fileUrl?: string; documentType?: string }) {
  const entityType = input.entityType || "prospect"
  const data = await safeInsert("revenue_documents", {
    entity_type: entityType,
    entity_id: input.entityId,
    title: input.title,
    file_url: input.fileUrl || null,
    document_type: input.documentType || "profile",
    status: "active",
    created_by: "AngelCare",
  })
  await safeLogEvent(entityType, input.entityId, "document.added", "Document added", input.title, { documentId: data.id })
  return data
}

export async function revenueAddContact(input: { entityType?: RevenueEntityType; entityId: string; fullName: string; role?: string; influenceLevel?: string; phone?: string; email?: string; isPrimary?: boolean }) {
  const entityType = input.entityType || "prospect"
  const data = await safeInsert("revenue_contacts", {
    entity_type: entityType,
    entity_id: input.entityId,
    full_name: input.fullName,
    role: input.role || "Contact",
    influence_level: input.influenceLevel || "medium",
    phone: input.phone || null,
    email: input.email || null,
    is_primary: Boolean(input.isPrimary),
  })
  await safeLogEvent(entityType, input.entityId, "contact.added", "Contact added", input.fullName, { contactId: data.id })
  return data
}

export async function revenueMovePipeline(entityId: string, fromStage: string | null, toStage: string) {
  const payload = await apiJson("/api/revenue-command-center/prospects", {
    method: "PATCH",
    body: JSON.stringify({ id: entityId, action: "stage_change", stage: toStage, fromStage }),
  })
  return payload.prospect || payload.data || payload.item
}

async function selectOptional(table: string, entityType: RevenueEntityType, entityId: string, orderColumn = "created_at", ascending = false, limit?: number) {
  let query = supabase.from(table).select("*").order(orderColumn, { ascending })
  if (entityType === "prospect") {
    query = query.or(`entity_id.eq.${entityId},prospect_id.eq.${entityId}`)
  } else if (entityType === "partnership") {
    query = query.or(`entity_id.eq.${entityId},partnership_id.eq.${entityId}`)
  } else {
    query = query.eq("entity_type", entityType).eq("entity_id", entityId)
  }
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) return []
  return data || []
}

export async function revenueLoadEntityControls(entityType: RevenueEntityType, entityId: string) {
  const [tasks, appointments, comments, notes, documents, contacts, activities, events] = await Promise.all([
    selectOptional("revenue_tasks", entityType, entityId, "created_at"),
    selectOptional("revenue_appointments", entityType, entityId, "appointment_at", true),
    selectOptional("revenue_comments", entityType, entityId, "created_at"),
    selectOptional("revenue_notes", entityType, entityId, "created_at"),
    selectOptional("revenue_documents", entityType, entityId, "created_at"),
    selectOptional("revenue_contacts", entityType, entityId, "created_at"),
    selectOptional("revenue_activities", entityType, entityId, "created_at", false, 50),
    selectOptional("revenue_events", entityType, entityId, "created_at", false, 50),
  ])

  return { tasks, appointments, comments: [...notes, ...comments], notes, documents, contacts, events: [...activities, ...events], activities: [...activities, ...events] }
}
