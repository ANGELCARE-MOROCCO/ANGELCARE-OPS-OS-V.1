
"use client"

import { createClient } from "@/lib/supabase/client"
import type { RevenueEntityType } from "./revenue-types"

const supabase = createClient()

async function logEvent(entityType: RevenueEntityType, entityId: string, eventType: string, title: string, body?: string, metadata: Record<string, unknown> = {}) {
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
}

export async function revenueCreateTask(input: {
  entityType?: RevenueEntityType
  entityId: string
  title: string
  description?: string
  owner?: string
  priority?: "low" | "medium" | "high" | "critical"
  dueDate?: string
}) {
  const entityType = input.entityType || "prospect"
  const { data, error } = await supabase.from("revenue_tasks").insert({
    entity_type: entityType,
    entity_id: input.entityId,
    title: input.title,
    description: input.description || null,
    owner: input.owner || "BD Officer",
    priority: input.priority || "medium",
    due_date: input.dueDate || null,
    status: "open",
  }).select().single()
  if (error) throw error
  await logEvent(entityType, input.entityId, "task.created", "Task created", input.title, { taskId: data.id })
  return data
}

export async function revenueCompleteTask(taskId: string, entityType: RevenueEntityType, entityId: string, done: boolean) {
  const { data, error } = await supabase.from("revenue_tasks").update({
    status: done ? "done" : "open",
    completed_at: done ? new Date().toISOString() : null,
  }).eq("id", taskId).select().single()
  if (error) throw error
  await logEvent(entityType, entityId, done ? "task.completed" : "task.reopened", data.title, undefined, { taskId })
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
}) {
  const entityType = input.entityType || "prospect"
  const { data, error } = await supabase.from("revenue_appointments").insert({
    entity_type: entityType,
    entity_id: input.entityId,
    title: input.title,
    appointment_at: input.appointmentAt,
    owner: input.owner || "BD Officer",
    location: input.location || null,
    notes: input.notes || null,
    status: "scheduled",
  }).select().single()
  if (error) throw error
  await logEvent(entityType, input.entityId, "appointment.scheduled", "Appointment scheduled", input.title, { appointmentId: data.id })
  return data
}

export async function revenueAddComment(input: {
  entityType?: RevenueEntityType
  entityId: string
  author?: string
  channel?: string
  note: string
}) {
  const entityType = input.entityType || "prospect"
  const { data, error } = await supabase.from("revenue_comments").insert({
    entity_type: entityType,
    entity_id: input.entityId,
    author: input.author || "AngelCare",
    channel: input.channel || "internal",
    note: input.note,
  }).select().single()
  if (error) throw error
  await logEvent(entityType, input.entityId, "comment.added", "Comment added", input.note, { commentId: data.id })
  return data
}

export async function revenueAddDocument(input: {
  entityType?: RevenueEntityType
  entityId: string
  title: string
  fileUrl?: string
  documentType?: string
}) {
  const entityType = input.entityType || "prospect"
  const { data, error } = await supabase.from("revenue_documents").insert({
    entity_type: entityType,
    entity_id: input.entityId,
    title: input.title,
    file_url: input.fileUrl || null,
    document_type: input.documentType || "profile",
    status: "active",
    created_by: "AngelCare",
  }).select().single()
  if (error) throw error
  await logEvent(entityType, input.entityId, "document.added", "Document added", input.title, { documentId: data.id })
  return data
}

export async function revenueAddContact(input: {
  entityType?: RevenueEntityType
  entityId: string
  fullName: string
  role?: string
  influenceLevel?: string
  phone?: string
  email?: string
  isPrimary?: boolean
}) {
  const entityType = input.entityType || "prospect"
  const { data, error } = await supabase.from("revenue_contacts").insert({
    entity_type: entityType,
    entity_id: input.entityId,
    full_name: input.fullName,
    role: input.role || "Contact",
    influence_level: input.influenceLevel || "medium",
    phone: input.phone || null,
    email: input.email || null,
    is_primary: Boolean(input.isPrimary),
  }).select().single()
  if (error) throw error
  await logEvent(entityType, input.entityId, "contact.added", "Contact added", input.fullName, { contactId: data.id })
  return data
}

export async function revenueMovePipeline(entityId: string, fromStage: string | null, toStage: string) {
  const { data, error } = await supabase.from("revenue_pipeline_history").insert({
    entity_id: entityId,
    from_stage: fromStage,
    to_stage: toStage,
    actor: "AngelCare",
  }).select().single()
  if (error) throw error
  await logEvent("prospect", entityId, "pipeline.updated", "Pipeline updated", `${fromStage || "start"} → ${toStage}`, { historyId: data.id })
  return data
}

export async function revenueLoadEntityControls(entityType: RevenueEntityType, entityId: string) {
  const [tasks, appointments, comments, documents, contacts, events] = await Promise.all([
    supabase.from("revenue_tasks").select("*").eq("entity_type", entityType).eq("entity_id", entityId).order("created_at", { ascending: false }),
    supabase.from("revenue_appointments").select("*").eq("entity_type", entityType).eq("entity_id", entityId).order("appointment_at", { ascending: true }),
    supabase.from("revenue_comments").select("*").eq("entity_type", entityType).eq("entity_id", entityId).order("created_at", { ascending: false }),
    supabase.from("revenue_documents").select("*").eq("entity_type", entityType).eq("entity_id", entityId).order("created_at", { ascending: false }),
    supabase.from("revenue_contacts").select("*").eq("entity_type", entityType).eq("entity_id", entityId).order("created_at", { ascending: false }),
    supabase.from("revenue_events").select("*").eq("entity_type", entityType).eq("entity_id", entityId).order("created_at", { ascending: false }).limit(50),
  ])
  const errors = [tasks.error, appointments.error, comments.error, documents.error, contacts.error, events.error].filter(Boolean)
  if (errors.length) throw errors[0]
  return {
    tasks: tasks.data || [],
    appointments: appointments.data || [],
    comments: comments.data || [],
    documents: documents.data || [],
    contacts: contacts.data || [],
    events: events.data || [],
  }
}
