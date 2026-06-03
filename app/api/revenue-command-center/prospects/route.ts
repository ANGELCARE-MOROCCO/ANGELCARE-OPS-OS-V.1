import { fail, ok, revenueClient, tolerantInsert } from "@/lib/revenue-command-center/canonical-server"
import {
  createRevenueId,
  normalizeProspectFromDb,
  normalizeProspectPayload,
} from "@/lib/revenue-command-center/operational-normalizers"
import {
  createLinkedAppointment,
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

function prospectUpdatePatch(body: Record<string, any>) {
  const normalized = normalizeProspectPayload(body)
  const patch: Record<string, unknown> = {}
  const aliases: Array<[string, string[]]> = [
    ["name", ["name"]],
    ["company", ["company"]],
    ["organization", ["organization"]],
    ["contact_name", ["contactName", "contact_name", "contact", "decisionMaker"]],
    ["email", ["email"]],
    ["phone", ["phone", "whatsapp"]],
    ["city", ["city", "location"]],
    ["location", ["location", "city"]],
    ["source", ["source"]],
    ["segment", ["segment", "type"]],
    ["status", ["status"]],
    ["stage", ["stage"]],
    ["probability", ["probability"]],
    ["score", ["score"]],
    ["value_mad", ["valueMad", "value_mad", "value", "pipeline_value"]],
    ["priority", ["priority"]],
    ["owner", ["owner", "assignedOwner", "assignee"]],
    ["next_action", ["nextAction", "next_action"]],
    ["next_action_at", ["nextActionAt", "next_action_at"]],
    ["notes", ["notes", "description"]],
    ["tags", ["tags"]],
    ["metadata", ["metadata"]],
    ["data", ["data"]],
  ]
  for (const [field, keys] of aliases) {
    if (hasAny(body, keys)) patch[field] = (normalized as any)[field]
  }
  return patch
}

async function getProspect(supabase: Awaited<ReturnType<typeof revenueClient>>, id: string) {
  const { data, error } = await supabase.from("revenue_prospects").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get("stage")
  const city = searchParams.get("city")
  const status = searchParams.get("status")
  const owner = searchParams.get("owner")
  const includeArchived = searchParams.get("includeArchived") === "true"
  const limit = Math.min(Number(searchParams.get("limit") || 500), 5000)

  let query = supabase.from("revenue_prospects").select("*").order("updated_at", { ascending: false }).limit(limit)
  if (!includeArchived) query = query.neq("status", "archived")
  if (stage && stage !== "all") query = query.eq("stage", stage)
  if (city && city !== "all") query = query.eq("city", city)
  if (status && status !== "all") query = query.eq("status", status)
  if (owner && owner !== "all") query = query.eq("owner", owner)

  const { data, error, count } = await query
  if (error) return fail(error)
  const prospects = (data || []).map(normalizeProspectFromDb)
  return ok({ data: prospects, items: prospects, prospects, count: count ?? prospects.length, source: "revenue_prospects" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const action = actionOf(body)

    if (body.id && ["add_note", "note", "add_comment", "comment", "create_task", "schedule_appointment", "create_follow_up"].includes(action)) {
      return PATCH(new Request(request.url, { method: "PATCH", body: JSON.stringify(body), headers: request.headers }))
    }

    const payload = { ...normalizeProspectPayload(body), id: createRevenueId(body) }
    if (!String(payload.name || "").trim()) return fail("Prospect name is required", 400)

    const data = await tolerantInsert(supabase as any, "revenue_prospects", payload)
    const prospect = normalizeProspectFromDb(data)

    await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_prospects",
      id: prospect.id,
      patch: {},
      entityType: "prospect",
      actionType: "prospect_created",
      title: `Prospect created: ${prospect.name}`,
      prospectId: prospect.id,
    })

    return ok({ data: prospect, item: prospect, prospect, prospects: [prospect], count: 1, source: "revenue_prospects" })
  } catch (error) {
    return fail(error)
  }
}

export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const id = String(body.id || body.prospectId || body.prospect_id || "")
    if (!id) return fail("Missing prospect id", 400)
    const action = actionOf(body)
    const before = await getProspect(supabase, id)
    if (!before && !["create_task", "schedule_appointment", "create_follow_up", "add_note", "note", "add_comment", "comment"].includes(action)) {
      return fail("Prospect not found", 404)
    }

    if (["add_note", "note", "add_comment", "comment"].includes(action)) {
      const note = await saveRevenueNote(supabase as any, { ...body, entityType: "prospect", entityId: id, prospectId: id }, { actionType: action.includes("comment") ? "comment" : "note", parentLabel: before?.name })
      return ok({ data: note, item: note, note, comment: note.comment || note, source: "revenue_notes" })
    }

    if (action === "create_task") {
      const task = await createLinkedTask(supabase as any, { ...body, entityType: "prospect", entityId: id, prospectId: id })
      return ok({ data: task, item: task, task, source: "revenue_tasks" })
    }

    if (action === "schedule_appointment") {
      const appointment = await createLinkedAppointment(supabase as any, { ...body, entityType: "prospect", entityId: id, prospectId: id })
      return ok({ data: appointment, item: appointment, appointment, source: "revenue_appointments" })
    }

    if (action === "create_follow_up") {
      const followUp = await createLinkedFollowUp(supabase as any, { ...body, entityType: "prospect", entityId: id, prospectId: id })
      return ok({ data: followUp, item: followUp, followUp, followUps: [followUp], source: "revenue_follow_ups" })
    }

    const now = new Date().toISOString()
    let patch: Record<string, unknown> = {}
    let eventType = "prospect_updated"

    if (action === "archive") {
      patch = { status: "archived", archived_at: now }
      eventType = "prospect_archived"
    } else if (action === "restore") {
      patch = { status: "active", archived_at: null }
      eventType = "prospect_restored"
    } else if (action === "stage_change") {
      patch = { stage: body.stage || body.toStage || body.to_stage }
      eventType = "prospect_stage_changed"
    } else if (action === "assign") {
      patch = { owner: body.owner || body.assignedOwner || body.assigned_owner }
      eventType = "prospect_owner_changed"
    } else {
      patch = prospectUpdatePatch(body)
      if (body.stage !== undefined && before?.stage && before.stage !== body.stage) eventType = "prospect_stage_changed"
      if ((body.owner !== undefined || body.assignedOwner !== undefined) && before?.owner !== (body.owner || body.assignedOwner)) eventType = "prospect_owner_changed"
    }

    const row = await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_prospects",
      id,
      patch,
      entityType: "prospect",
      actionType: eventType,
      title: `Prospect ${eventType.replace("prospect_", "").replaceAll("_", " ")}: ${before?.name || id}`,
      before,
      prospectId: id,
    })
    const prospect = normalizeProspectFromDb(row)
    return ok({ data: prospect, item: prospect, prospect, prospects: [prospect], count: 1, source: "revenue_prospects" })
  } catch (error) {
    return fail(error)
  }
}

export async function DELETE(request: Request) {
  const supabase = await revenueClient()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return fail("Missing prospect id", 400)
    const before = await getProspect(supabase, id)
    const row = await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_prospects",
      id,
      patch: { status: "archived", archived_at: new Date().toISOString() },
      entityType: "prospect",
      actionType: "prospect_archived",
      title: `Prospect archived: ${before?.name || id}`,
      before,
      prospectId: id,
    })
    const prospect = normalizeProspectFromDb(row)
    return ok({ data: prospect, item: prospect, prospect, source: "revenue_prospects" })
  } catch (error) {
    return fail(error)
  }
}
