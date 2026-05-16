"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

async function logActivity(prospectId: string, action: string, note?: string, metadata: Record<string, unknown> = {}) {
  await supabase.rpc("prospect_create_activity", {
    p_prospect_id: prospectId,
    p_action: action,
    p_note: note || null,
    p_actor: "AngelCare",
    p_metadata: metadata,
  })
}

export async function createProspectTask(input: {
  prospectId: string
  title: string
  description?: string
  priority?: string
  owner?: string
  dueDate?: string
}) {
  const { data, error } = await supabase.from("prospect_tasks").insert({
    prospect_id: input.prospectId,
    title: input.title,
    description: input.description || null,
    priority: input.priority || "medium",
    owner: input.owner || "BD Officer",
    due_date: input.dueDate || null,
    status: "open",
  }).select().single()
  if (error) throw error
  await logActivity(input.prospectId, "Task created", input.title, { taskId: data.id })
  return data
}

export async function completeProspectTask(taskId: string, prospectId: string, done: boolean) {
  const { data, error } = await supabase.from("prospect_tasks").update({
    status: done ? "done" : "open",
    completed_at: done ? new Date().toISOString() : null,
  }).eq("id", taskId).select().single()
  if (error) throw error
  await logActivity(prospectId, done ? "Task completed" : "Task reopened", data.title, { taskId })
  return data
}

export async function scheduleProspectAppointment(input: {
  prospectId: string
  title: string
  appointmentAt: string
  owner?: string
  location?: string
  notes?: string
}) {
  const { data, error } = await supabase.from("prospect_appointments").insert({
    prospect_id: input.prospectId,
    title: input.title,
    appointment_at: input.appointmentAt,
    owner: input.owner || "BD Officer",
    location: input.location || null,
    notes: input.notes || null,
    status: "scheduled",
  }).select().single()
  if (error) throw error
  await logActivity(input.prospectId, "Appointment scheduled", input.title, { appointmentId: data.id })
  return data
}

export async function addProspectComment(input: {
  prospectId: string
  author?: string
  channel?: string
  note: string
}) {
  const { data, error } = await supabase.from("prospect_comments").insert({
    prospect_id: input.prospectId,
    author: input.author || "AngelCare",
    channel: input.channel || "internal",
    note: input.note,
  }).select().single()
  if (error) throw error
  await logActivity(input.prospectId, "Comment added", input.note, { commentId: data.id })
  return data
}

export async function addProspectDocument(input: {
  prospectId: string
  title: string
  fileUrl?: string
  documentType?: string
  createdBy?: string
}) {
  const { data, error } = await supabase.from("prospect_documents").insert({
    prospect_id: input.prospectId,
    title: input.title,
    file_url: input.fileUrl || null,
    document_type: input.documentType || "profile",
    created_by: input.createdBy || "AngelCare",
    status: "active",
  }).select().single()
  if (error) throw error
  await logActivity(input.prospectId, "Document added", input.title, { documentId: data.id })
  return data
}

export async function addProspectContact(input: {
  prospectId: string
  fullName: string
  role?: string
  influenceLevel?: string
  phone?: string
  email?: string
  isPrimary?: boolean
}) {
  const { data, error } = await supabase.from("prospect_contacts").insert({
    prospect_id: input.prospectId,
    full_name: input.fullName,
    role: input.role || "Contact",
    influence_level: input.influenceLevel || "medium",
    phone: input.phone || null,
    email: input.email || null,
    is_primary: Boolean(input.isPrimary),
  }).select().single()
  if (error) throw error
  await logActivity(input.prospectId, "Contact added", input.fullName, { contactId: data.id })
  return data
}

export async function addPipelineHistory(prospectId: string, fromStage: string | null, toStage: string) {
  const { data, error } = await supabase.from("prospect_pipeline_history").insert({
    prospect_id: prospectId,
    from_stage: fromStage,
    to_stage: toStage,
    actor: "AngelCare",
  }).select().single()
  if (error) throw error
  await logActivity(prospectId, "Pipeline updated", `${fromStage || "start"} → ${toStage}`, { historyId: data.id })
  return data
}

export async function createProspectNotification(prospectId: string, title: string, body: string, severity = "info") {
  const { data, error } = await supabase.from("prospect_notifications").insert({
    prospect_id: prospectId,
    title,
    body,
    severity,
    status: "unread",
  }).select().single()
  if (error) throw error
  return data
}

export async function loadProspectControlData(prospectId: string) {
  const [tasks, appointments, comments, documents, contacts, activities, history, notifications] = await Promise.all([
    supabase.from("prospect_tasks").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false }),
    supabase.from("prospect_appointments").select("*").eq("prospect_id", prospectId).order("appointment_at", { ascending: true }),
    supabase.from("prospect_comments").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false }),
    supabase.from("prospect_documents").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false }),
    supabase.from("prospect_contacts").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false }),
    supabase.from("prospect_activities").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false }).limit(50),
    supabase.from("prospect_pipeline_history").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false }),
    supabase.from("prospect_notifications").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false }),
  ])
  const errors = [tasks.error, appointments.error, comments.error, documents.error, contacts.error, activities.error, history.error, notifications.error].filter(Boolean)
  if (errors.length) throw errors[0]
  return {
    tasks: tasks.data || [],
    appointments: appointments.data || [],
    comments: comments.data || [],
    documents: documents.data || [],
    contacts: contacts.data || [],
    activities: activities.data || [],
    history: history.data || [],
    notifications: notifications.data || [],
  }
}

export function subscribeProspectControls(prospectId: string, onChange: () => void) {
  const channel = supabase
    .channel(`prospect-controls-${prospectId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "prospect_tasks", filter: `prospect_id=eq.${prospectId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "prospect_appointments", filter: `prospect_id=eq.${prospectId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "prospect_comments", filter: `prospect_id=eq.${prospectId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "prospect_documents", filter: `prospect_id=eq.${prospectId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "prospect_contacts", filter: `prospect_id=eq.${prospectId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "prospect_activities", filter: `prospect_id=eq.${prospectId}` }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
