import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function cleanArray(value: any) {
  return Array.isArray(value) ? value : []
}

async function validateProspect(supabase: any, entityId: string) {
  const { data, error } = await supabase.from("revenue_prospects").select("id,name").eq("id", entityId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Selected prospect does not exist in revenue_prospects")
}

function buildPayload(body: any) {
  return {
    entity_type: "prospect",
    entity_id: body.entityId,
    title: body.title,
    appointment_at: body.appointmentAt,
    end_at: body.endAt || null,
    owner: body.owner || "BD Officer",
    status: body.status || "scheduled",
    appointment_type: body.appointmentType || "meeting",
    priority: body.priority || "medium",
    location: body.location || null,
    meeting_link: body.meetingLink || null,
    notes: body.notes || null,
    agenda: body.agenda || null,
    objective: body.objective || null,
    expected_outcome: body.expectedOutcome || null,
    attendees: cleanArray(body.attendees),
    reminders: cleanArray(body.reminders),
    documents: cleanArray(body.documents),
    tasks: cleanArray(body.tasks),
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  try {
    const body = await request.json()
    if (!body?.entityId || !body?.title || !body?.appointmentAt) {
      return NextResponse.json({ ok: false, error: "Missing prospect, title or appointment time" }, { status: 400 })
    }
    await validateProspect(supabase, body.entityId)
    const { data, error } = await supabase.from("revenue_appointments").insert(buildPayload(body)).select().single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, appointment: data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create appointment" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  try {
    const body = await request.json()
    if (!body?.id) return NextResponse.json({ ok: false, error: "Missing appointment id" }, { status: 400 })
    if (body.entityId) await validateProspect(supabase, body.entityId)
    const { data, error } = await supabase.from("revenue_appointments").update(buildPayload(body)).eq("id", body.id).select().single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, appointment: data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update appointment" }, { status: 500 })
  }
}
