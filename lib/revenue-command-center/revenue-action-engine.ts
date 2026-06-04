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

async function safeLogEvent(entityType: RevenueEntityType, entityId: string, eventType: string, title: string, body?: string, metadata: Json = {}) {
  const activityRow = {
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    event_title: title,
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
  const data = await safeInsert("revenue_tasks", {
    entity_type: entityType,
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
    outcome_expected: input.expectedOutcome || null,
    status: "open",
  })
  await safeLogEvent(entityType, input.entityId, "task.created", "Task created", input.title, { taskId: data.id })
  return data
}

export async function revenueCompleteTask(taskId: string, entityType: RevenueEntityType, entityId: string, done: boolean) {
  const { data, error } = await supabase.from("revenue_tasks").update({
    status: done ? "done" : "open",
    completed_at: done ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", taskId).select().single()
  if (error) throw error
  await safeLogEvent(entityType, entityId, done ? "task.completed" : "task.reopened", data.title, undefined, { taskId })
  return data
}

export async function revenueDeleteTask(taskId: string, entityType: RevenueEntityType, entityId: string) {
  const { data, error } = await supabase.from("revenue_tasks").delete().eq("id", taskId).select().single()
  if (error) throw error
  await safeLogEvent(entityType, entityId, "task.deleted", "Task deleted", data?.title || taskId, { taskId })
  return data
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
  const data = await safeInsert("revenue_appointments", {
    entity_type: entityType,
    entity_id: input.entityId,
    title: input.title,
    appointment_at: input.appointmentAt,
    owner: input.owner || "BD Officer",
    location: input.location || null,
    notes: input.notes || null,
    appointment_type: input.appointmentType || "meeting",
    priority: input.priority || "medium",
    status: "scheduled",
  })
  await safeLogEvent(entityType, input.entityId, "appointment.scheduled", "Appointment scheduled", input.title, { appointmentId: data.id })
  return data
}

export async function revenueUpdateAppointmentStatus(appointmentId: string, entityType: RevenueEntityType, entityId: string, status: "scheduled" | "completed" | "cancelled" | "no_show") {
  const { data, error } = await supabase.from("revenue_appointments").update({ status, updated_at: new Date().toISOString() }).eq("id", appointmentId).select().single()
  if (error) throw error
  await safeLogEvent(entityType, entityId, `appointment.${status}`, "Appointment updated", data.title, { appointmentId, status })
  return data
}

export async function revenueAddComment(input: { entityType?: RevenueEntityType; entityId: string; author?: string; channel?: string; note: string }) {
  const entityType = input.entityType || "prospect"
  const data = await safeInsert("revenue_comments", {
    entity_type: entityType,
    entity_id: input.entityId,
    author: input.author || "AngelCare",
    channel: input.channel || "internal",
    note: input.note,
  })
  await safeLogEvent(entityType, input.entityId, "comment.added", "Comment added", input.note, { commentId: data.id, channel: input.channel || "internal" })
  return data
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
  const { data, error } = await supabase.from("revenue_prospects").update({ stage: toStage, updated_at: new Date().toISOString() }).eq("id", entityId).select().single()
  if (error) throw error
  await safeLogEvent("prospect", entityId, "pipeline.updated", "Pipeline updated", `${fromStage || "start"} → ${toStage}`, { fromStage, toStage })
  return data
}

async function selectOptional(table: string, entityType: RevenueEntityType, entityId: string, orderColumn = "created_at", ascending = false, limit?: number) {
  let query = supabase.from(table).select("*").eq("entity_type", entityType).eq("entity_id", entityId).order(orderColumn, { ascending })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) return []
  return data || []
}

export async function revenueLoadEntityControls(entityType: RevenueEntityType, entityId: string) {
  const [tasks, appointments, comments, documents, contacts, activities] = await Promise.all([
    selectOptional("revenue_tasks", entityType, entityId, "created_at"),
    selectOptional("revenue_appointments", entityType, entityId, "appointment_at", true),
    selectOptional("revenue_comments", entityType, entityId, "created_at"),
    selectOptional("revenue_documents", entityType, entityId, "created_at"),
    selectOptional("revenue_contacts", entityType, entityId, "created_at"),
    selectOptional("revenue_activities", entityType, entityId, "created_at", false, 50),
  ])

  return { tasks, appointments, comments, documents, contacts, events: activities, activities }
}
