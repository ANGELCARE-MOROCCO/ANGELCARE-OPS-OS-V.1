import { fail, ok, revenueClient, tolerantInsert } from "@/lib/revenue-command-center/canonical-server"
import { normalizeAppointmentFromDb, normalizeAppointmentPayload } from "@/lib/revenue-command-center/operational-normalizers"
import {
  createLinkedFollowUp,
  createLinkedTask,
  saveRevenueNote,
  updateRevenueRowWithActivity,
} from "@/lib/revenue-command-center/operational-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

function actionOf(body: Record<string, any>) {
  return String(body.action || body.mode || "update").toLowerCase()
}

function hasAny(body: Record<string, any>, keys: string[]) {
  return keys.some((key) => body[key] !== undefined)
}

function appointmentUpdatePatch(body: Record<string, any>) {
  const normalized = normalizeAppointmentPayload(body)
  const patch: Record<string, unknown> = {}
  const aliases: Array<[string, string[]]> = [
    ["title", ["title"]],
    ["entity_type", ["entityType", "entity_type", "prospectId", "prospect_id", "partnershipId", "partnership_id"]],
    ["entity_id", ["entityId", "entity_id", "prospectId", "prospect_id", "partnershipId", "partnership_id"]],
    ["prospect_id", ["prospectId", "prospect_id"]],
    ["partnership_id", ["partnershipId", "partnership_id"]],
    ["appointment_at", ["appointmentAt", "appointment_at", "scheduledAt", "scheduled_at"]],
    ["scheduled_at", ["scheduledAt", "scheduled_at", "appointmentAt", "appointment_at"]],
    ["end_at", ["endAt", "end_at"]],
    ["status", ["status"]],
    ["owner", ["owner", "assignedOwner"]],
    ["attendees", ["attendees"]],
    ["notes", ["notes"]],
    ["briefing_notes", ["briefingNotes", "briefing_notes"]],
    ["live_notes", ["liveNotes", "live_notes"]],
    ["outcome", ["outcome"]],
    ["follow_up_at", ["followUpAt", "follow_up_at"]],
    ["appointment_type", ["appointmentType", "appointment_type", "type"]],
    ["priority", ["priority"]],
    ["location", ["location"]],
    ["meeting_link", ["meetingLink", "meeting_link"]],
    ["agenda", ["agenda"]],
    ["objective", ["objective"]],
    ["expected_outcome", ["expectedOutcome", "expected_outcome"]],
    ["reminders", ["reminders"]],
    ["documents", ["documents"]],
    ["tasks", ["tasks"]],
    ["metadata", ["metadata"]],
  ]
  for (const [field, keys] of aliases) {
    if (hasAny(body, keys)) patch[field] = (normalized as any)[field]
  }
  return patch
}

async function getAppointment(supabase: Awaited<ReturnType<typeof revenueClient>>, id: string) {
  const { data, error } = await supabase.from("revenue_appointments").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const entityId = searchParams.get("entityId") || searchParams.get("entity_id")
  const prospectId = searchParams.get("prospectId") || searchParams.get("prospect_id")
  const partnershipId = searchParams.get("partnershipId") || searchParams.get("partnership_id")
  const includeArchived = searchParams.get("includeArchived") === "true"
  const limit = Math.min(Number(searchParams.get("limit") || 1000), 5000)

  let query = supabase.from("revenue_appointments").select("*").order("appointment_at", { ascending: true }).limit(limit)
  if (!includeArchived) query = query.neq("status", "archived")
  if (status && status !== "all") query = query.eq("status", status)
  if (entityId) query = query.eq("entity_id", entityId)
  if (prospectId) query = query.eq("prospect_id", prospectId)
  if (partnershipId) query = query.eq("partnership_id", partnershipId)

  const { data, error, count } = await query
  if (error) return fail(error)
  const appointments = (data || []).map(normalizeAppointmentFromDb)
  return ok({ data: appointments, items: appointments, appointments, count: count ?? appointments.length, source: "revenue_appointments" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const payload = normalizeAppointmentPayload(body)
    if (!String(payload.title || "").trim()) return fail("Appointment title is required", 400)
    if (!payload.appointment_at) return fail("Appointment date/time is required", 400)

    const data = await tolerantInsert(supabase as any, "revenue_appointments", payload)
    const appointment = normalizeAppointmentFromDb(data)

    await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_appointments",
      id: appointment.id,
      patch: {},
      entityType: "appointment",
      actionType: "appointment_created",
      title: `Appointment scheduled: ${appointment.title}`,
      prospectId: appointment.prospectId || null,
      partnershipId: appointment.partnershipId || null,
    })

    return ok({ data: appointment, item: appointment, appointment, appointments: [appointment], count: 1, source: "revenue_appointments" })
  } catch (error) {
    return fail(error)
  }
}

export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const id = String(body.id || body.appointmentId || body.appointment_id || "")
    if (!id) return fail("Missing appointment id", 400)
    const action = actionOf(body)
    const before = await getAppointment(supabase, id)
    if (!before) return fail("Appointment not found", 404)
    const normalizedBefore = normalizeAppointmentFromDb(before)

    if (["add_note", "note", "add_comment", "comment", "add_briefing", "add_live_notes"].includes(action)) {
      const bodyText = body.body || body.note || body.comment || body.notes || body.briefingNotes || body.briefing_notes || body.liveNotes || body.live_notes
      const note = await saveRevenueNote(supabase as any, {
        ...body,
        body: bodyText,
        entityType: "appointment",
        entityId: id,
        prospectId: normalizedBefore.prospectId,
        partnershipId: normalizedBefore.partnershipId,
      }, { actionType: action.includes("comment") ? "comment" : "note", parentLabel: before?.title })
      return ok({ data: note, item: note, note, comment: note.comment || note, source: "revenue_notes" })
    }

    if (action === "create_task") {
      const task = await createLinkedTask(supabase as any, {
        ...body,
        entityType: normalizedBefore.entityType || "appointment",
        entityId: normalizedBefore.entityId || id,
        prospectId: normalizedBefore.prospectId,
        partnershipId: normalizedBefore.partnershipId,
        metadata: { ...(body.metadata || {}), sourceAppointmentId: id },
      })
      return ok({ data: task, item: task, task, source: "revenue_tasks" })
    }

    if (action === "create_follow_up") {
      const followUp = await createLinkedFollowUp(supabase as any, {
        ...body,
        entityType: normalizedBefore.entityType || "appointment",
        entityId: normalizedBefore.entityId || id,
        prospectId: normalizedBefore.prospectId,
        partnershipId: normalizedBefore.partnershipId,
        metadata: { ...(body.metadata || {}), sourceAppointmentId: id },
      })
      return ok({ data: followUp, item: followUp, followUp, followUps: [followUp], source: "revenue_follow_ups" })
    }

    const now = new Date().toISOString()
    let patch: Record<string, unknown> = {}
    let eventType = "appointment_updated"

    if (action === "archive") {
      patch = { status: "archived", archived_at: now }
      eventType = "appointment_archived"
    } else if (action === "restore") {
      patch = { status: "scheduled", archived_at: null }
      eventType = "appointment_restored"
    } else if (action === "reschedule") {
      patch = {
        appointment_at: body.appointmentAt || body.appointment_at || body.scheduledAt || body.scheduled_at || before.appointment_at,
        scheduled_at: body.scheduledAt || body.scheduled_at || body.appointmentAt || body.appointment_at || before.scheduled_at || before.appointment_at,
        end_at: body.endAt || body.end_at || before.end_at,
      }
      eventType = "appointment_rescheduled"
    } else if (action === "cancel") {
      patch = { status: "cancelled" }
      eventType = "appointment_cancelled"
    } else if (action === "mark_no_show") {
      patch = { status: "no_show" }
      eventType = "appointment_no_show"
    } else if (action === "record_outcome") {
      patch = { outcome: body.outcome || body.result || "", status: body.status || "completed", follow_up_at: body.followUpAt || body.follow_up_at || null }
      eventType = "appointment_outcome_recorded"
    } else if (action === "link_prospect") {
      patch = { entity_type: "prospect", entity_id: body.prospectId || body.prospect_id, prospect_id: body.prospectId || body.prospect_id, partnership_id: null }
      eventType = "appointment_linked_prospect"
    } else if (action === "link_partnership") {
      patch = { entity_type: "partnership", entity_id: body.partnershipId || body.partnership_id, partnership_id: body.partnershipId || body.partnership_id, prospect_id: null }
      eventType = "appointment_linked_partnership"
    } else {
      patch = appointmentUpdatePatch(body)
      if (body.status !== undefined && before.status !== body.status) eventType = `appointment_${String(body.status).toLowerCase()}`
      if (body.outcome !== undefined) eventType = "appointment_outcome_recorded"
      if (body.appointmentAt !== undefined || body.appointment_at !== undefined || body.scheduledAt !== undefined || body.scheduled_at !== undefined) eventType = "appointment_rescheduled"
    }

    const row = await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_appointments",
      id,
      patch,
      entityType: "appointment",
      actionType: eventType,
      title: `Appointment ${eventType.replace("appointment_", "").replaceAll("_", " ")}: ${before.title || id}`,
      before,
      prospectId: normalizedBefore.prospectId || (patch.prospect_id as string) || null,
      partnershipId: normalizedBefore.partnershipId || (patch.partnership_id as string) || null,
    })
    const appointment = normalizeAppointmentFromDb(row)
    return ok({ data: appointment, item: appointment, appointment, appointments: [appointment], count: 1, source: "revenue_appointments" })
  } catch (error) {
    return fail(error)
  }
}

export async function DELETE(request: Request) {
  const supabase = await revenueClient()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return fail("Missing appointment id", 400)
    const before = await getAppointment(supabase, id)
    if (!before) return fail("Appointment not found", 404)
    const normalizedBefore = normalizeAppointmentFromDb(before)
    const row = await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_appointments",
      id,
      patch: { status: "archived", archived_at: new Date().toISOString() },
      entityType: "appointment",
      actionType: "appointment_archived",
      title: `Appointment archived: ${before.title || id}`,
      before,
      prospectId: normalizedBefore.prospectId || null,
      partnershipId: normalizedBefore.partnershipId || null,
    })
    const appointment = normalizeAppointmentFromDb(row)
    return ok({ data: appointment, item: appointment, appointment, source: "revenue_appointments" })
  } catch (error) {
    return fail(error)
  }
}
