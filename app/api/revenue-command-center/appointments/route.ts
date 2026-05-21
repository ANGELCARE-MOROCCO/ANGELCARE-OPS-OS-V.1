import { revenueClient, ok, fail, cleanString, cleanArray, requireProspect, logRevenueActivity, logRevenueAction } from "@/lib/revenue-command-center/canonical-server"

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const entityId = searchParams.get("entityId")
  const limit = Math.min(Number(searchParams.get("limit") || 1000), 5000)
  let query = supabase.from("revenue_appointments").select("*").order("appointment_at", { ascending: true }).limit(limit)
  if (status && status !== "all") query = query.eq("status", status)
  if (entityId) query = query.eq("entity_id", entityId)
  const { data, error } = await query
  if (error) return fail(error)
  return ok({ appointments: data || [], source: "revenue_appointments" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const entityId = cleanString(body.entityId || body.prospectId)
    if (!entityId || !body.title || !body.appointmentAt) return fail("Missing prospect, title or appointment time", 400)
    await requireProspect(supabase, entityId)
    const row = {
      entity_type: cleanString(body.entityType, "prospect"),
      entity_id: entityId,
      prospect_id: entityId,
      title: cleanString(body.title, "Untitled appointment"),
      appointment_at: body.appointmentAt,
      end_at: body.endAt || null,
      owner: cleanString(body.owner, "BD Officer"),
      status: cleanString(body.status, "scheduled"),
      appointment_type: cleanString(body.appointmentType || body.appointment_type, "meeting"),
      priority: cleanString(body.priority, "medium"),
      location: cleanString(body.location, ""),
      meeting_link: cleanString(body.meetingLink || body.meeting_link, ""),
      notes: cleanString(body.notes, ""),
      agenda: cleanString(body.agenda, ""),
      objective: cleanString(body.objective, ""),
      expected_outcome: cleanString(body.expectedOutcome || body.expected_outcome, ""),
      attendees: cleanArray(body.attendees),
      reminders: cleanArray(body.reminders),
      documents: cleanArray(body.documents),
      tasks: cleanArray(body.tasks),
      metadata: body.metadata || {},
    }
    const { data, error } = await supabase.from("revenue_appointments").insert(row).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: "prospect", entityId, prospectId: entityId, eventType: "appointment_scheduled", title: `Appointment scheduled: ${data.title}`, metadata: { appointmentId: data.id, appointmentAt: data.appointment_at } })
    await logRevenueAction(supabase, { actionType: "create_appointment", entityType: "appointment", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ appointment: data })
  } catch (error) {
    return fail(error)
  }
}

export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    if (!body.id) return fail("Missing appointment id", 400)
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [from, to] of Object.entries({ title:"title", appointmentAt:"appointment_at", endAt:"end_at", owner:"owner", status:"status", appointmentType:"appointment_type", priority:"priority", location:"location", meetingLink:"meeting_link", notes:"notes", agenda:"agenda", objective:"objective", expectedOutcome:"expected_outcome", attendees:"attendees", reminders:"reminders", documents:"documents", tasks:"tasks" })) {
      if (body[from] !== undefined) patch[to] = body[from]
    }
    const { data, error } = await supabase.from("revenue_appointments").update(patch).eq("id", body.id).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: data.entity_type || "prospect", entityId: data.entity_id, prospectId: data.prospect_id, eventType: "appointment_updated", title: `Appointment updated: ${data.title}`, metadata: { appointmentId: data.id, patch } })
    await logRevenueAction(supabase, { actionType: "update_appointment", entityType: "appointment", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ appointment: data })
  } catch (error) {
    return fail(error)
  }
}
