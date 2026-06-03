import type { SupabaseClient } from "@supabase/supabase-js"
import {
  logRevenueActivity,
  logRevenueAction,
  logRevenuePipelineEvent,
  tolerantInsert,
  tolerantUpdate,
} from "@/lib/revenue-command-center/canonical-server"
import {
  buildLinkedEntityPayload,
  compactRecord,
  normalizeActivityEventFromDb,
  normalizeAppointmentFromDb,
  normalizeAppointmentPayload,
  normalizeFollowUpFromDb,
  normalizeFollowUpPayload,
  normalizeNotePayload,
  normalizeTaskFromDb,
  normalizeTaskPayload,
} from "@/lib/revenue-command-center/operational-normalizers"

type Row = Record<string, any>

function actorLabel(row: Row) {
  return String(row.owner || row.author || row.assignedOwner || "Revenue Command Center")
}

export async function saveRevenueNote(
  supabase: SupabaseClient,
  input: Row,
  options: { actionType?: "note" | "comment"; parentLabel?: string } = {},
) {
  const payload = normalizeNotePayload({
    ...input,
    noteType: options.actionType || input.noteType || input.note_type || "note",
  })

  if (!String(payload.body || "").trim()) {
    throw new Error(`${options.actionType === "comment" ? "Comment" : "Note"} body is required`)
  }

  let note: Row | null = null
  let noteError: unknown = null

  try {
    note = await tolerantInsert(supabase as any, "revenue_notes", payload)
  } catch (error) {
    noteError = error
  }

  let comment: Row | null = null
  try {
    comment = await tolerantInsert(supabase as any, "revenue_comments", {
      workspace_slug: "angelcare-main",
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      prospect_id: payload.prospect_id,
      partnership_id: payload.partnership_id,
      author: payload.author,
      channel: payload.note_type,
      note: payload.body,
      body: payload.body,
      metadata: payload.metadata,
    })
  } catch (error) {
    if (!note) throw noteError instanceof Error ? noteError : error
  }

  const entityType = String(payload.entity_type || "general")
  const entityId = String(payload.entity_id || payload.prospect_id || payload.partnership_id || "")
  const eventType = options.actionType === "comment" ? "comment_added" : "note_added"
  await logRevenueActivity(supabase as any, {
    entityType,
    entityId,
    prospectId: payload.prospect_id || null,
    partnershipId: payload.partnership_id || null,
    eventType,
    title: options.actionType === "comment" ? "Comment added" : "Note added",
    body: payload.body,
    metadata: { noteId: note?.id || null, commentId: comment?.id || null, parentLabel: options.parentLabel || null },
  })
  await logRevenueAction(supabase as any, {
    actionType: eventType,
    entityType,
    entityId,
    payload: input,
    result: { noteId: note?.id || null, commentId: comment?.id || null },
  })

  return {
    ...payload,
    id: String(note?.id || comment?.id || payload.id || ""),
    note,
    comment,
    created_at: note?.created_at || comment?.created_at || new Date().toISOString(),
  }
}

export async function createLinkedTask(supabase: SupabaseClient, input: Row) {
  const payload = normalizeTaskPayload(input)
  if (!String(payload.title || "").trim()) throw new Error("Task title is required")

  const task = await tolerantInsert(supabase as any, "revenue_tasks", {
    ...payload,
    status: payload.status || "open",
  })
  const normalized = normalizeTaskFromDb(task)
  await logRevenueActivity(supabase as any, {
    entityType: normalized.entityType || "task",
    entityId: normalized.entityId || normalized.id,
    prospectId: normalized.prospectId || null,
    partnershipId: normalized.partnershipId || null,
    eventType: "task_created",
    title: `Task created: ${normalized.title}`,
    metadata: { taskId: normalized.id },
  })
  await logRevenueAction(supabase as any, {
    actionType: "create_task",
    entityType: "task",
    entityId: normalized.id,
    payload: input,
    result: { id: normalized.id },
  })
  return normalized
}

export async function createLinkedAppointment(supabase: SupabaseClient, input: Row) {
  const payload = normalizeAppointmentPayload(input)
  if (!String(payload.title || "").trim()) throw new Error("Appointment title is required")
  if (!payload.appointment_at) throw new Error("Appointment date/time is required")

  const appointment = await tolerantInsert(supabase as any, "revenue_appointments", {
    ...payload,
    status: payload.status || "scheduled",
  })
  const normalized = normalizeAppointmentFromDb(appointment)
  await logRevenueActivity(supabase as any, {
    entityType: normalized.entityType || "appointment",
    entityId: normalized.entityId || normalized.id,
    prospectId: normalized.prospectId || null,
    partnershipId: normalized.partnershipId || null,
    eventType: "appointment_scheduled",
    title: `Appointment scheduled: ${normalized.title}`,
    metadata: { appointmentId: normalized.id, appointmentAt: normalized.appointmentAt },
  })
  await logRevenueAction(supabase as any, {
    actionType: "create_appointment",
    entityType: "appointment",
    entityId: normalized.id,
    payload: input,
    result: { id: normalized.id },
  })
  return normalized
}

export async function createLinkedFollowUp(supabase: SupabaseClient, input: Row) {
  const payload = normalizeFollowUpPayload(input)
  if (!String(payload.title || "").trim()) throw new Error("Follow-up title is required")

  const followUp = await tolerantInsert(supabase as any, "revenue_follow_ups", {
    ...payload,
    status: payload.status || "pending",
  })
  const normalized = normalizeFollowUpFromDb(followUp)
  await logRevenueActivity(supabase as any, {
    entityType: normalized.entityType || "follow_up",
    entityId: normalized.entityId || normalized.id,
    prospectId: normalized.prospectId || null,
    partnershipId: normalized.partnershipId || null,
    eventType: "follow_up_created",
    title: `Follow-up created: ${normalized.title}`,
    metadata: { followUpId: normalized.id, scheduledAt: normalized.scheduledAt },
  })
  await logRevenueAction(supabase as any, {
    actionType: "create_follow_up",
    entityType: "follow_up",
    entityId: normalized.id,
    payload: input,
    result: { id: normalized.id },
  })
  return normalized
}

export async function updateRevenueRowWithActivity(
  supabase: SupabaseClient,
  input: {
    table: string
    id: string
    patch: Row
    entityType: "prospect" | "partnership" | "task" | "appointment" | "follow_up"
    actionType: string
    title: string
    before?: Row | null
    prospectId?: string | null
    partnershipId?: string | null
  },
) {
  const patch = compactRecord({ ...input.patch, updated_at: new Date().toISOString() })
  const row = await tolerantUpdate(supabase as any, input.table, input.id, patch)
  const linked = buildLinkedEntityPayload({ ...row, entityType: input.entityType, entityId: row?.id })
  const oldStage = input.before?.stage
  const newStage = row?.stage

  if ((input.entityType === "prospect" || input.entityType === "partnership") && newStage && oldStage && oldStage !== newStage) {
    await logRevenuePipelineEvent(supabase as any, {
      entityType: input.entityType,
      entityId: String(row.id),
      fromStage: String(oldStage),
      toStage: String(newStage),
      actor: actorLabel(row),
      metadata: { table: input.table, actionType: input.actionType },
    })
  }

  await logRevenueActivity(supabase as any, {
    entityType: input.entityType,
    entityId: String(row?.id || input.id),
    prospectId: input.prospectId || linked.prospect_id || null,
    partnershipId: input.partnershipId || linked.partnership_id || null,
    eventType: input.actionType,
    title: input.title,
    metadata: { table: input.table, patch },
  })
  await logRevenueAction(supabase as any, {
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: String(row?.id || input.id),
    payload: patch,
    result: { id: row?.id || input.id },
  })

  return row
}

export function normalizeActivities(rows: Row[]) {
  return rows.map(normalizeActivityEventFromDb)
}
