import { fail, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { normalizeFollowUpFromDb, normalizeFollowUpPayload } from "@/lib/revenue-command-center/operational-normalizers"
import { createLinkedFollowUp, saveRevenueNote, updateRevenueRowWithActivity } from "@/lib/revenue-command-center/operational-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

function actionOf(body: Record<string, any>) {
  return String(body.action || body.mode || "update").toLowerCase()
}

function hasAny(body: Record<string, any>, keys: string[]) {
  return keys.some((key) => body[key] !== undefined)
}

function followUpUpdatePatch(body: Record<string, any>) {
  const normalized = normalizeFollowUpPayload(body)
  const patch: Record<string, unknown> = {}
  const aliases: Array<[string, string[]]> = [
    ["title", ["title", "nextStep", "next_step"]],
    ["entity_type", ["entityType", "entity_type", "prospectId", "prospect_id", "partnershipId", "partnership_id"]],
    ["entity_id", ["entityId", "entity_id", "prospectId", "prospect_id", "partnershipId", "partnership_id"]],
    ["prospect_id", ["prospectId", "prospect_id"]],
    ["partnership_id", ["partnershipId", "partnership_id"]],
    ["scheduled_at", ["scheduledAt", "scheduled_at", "followUpAt", "follow_up_at"]],
    ["channel", ["channel"]],
    ["status", ["status"]],
    ["owner", ["owner", "assignedOwner"]],
    ["result", ["result"]],
    ["next_step", ["nextStep", "next_step"]],
    ["notes", ["notes"]],
    ["priority", ["priority"]],
    ["metadata", ["metadata"]],
  ]
  for (const [field, keys] of aliases) {
    if (hasAny(body, keys)) patch[field] = (normalized as any)[field]
  }
  return patch
}

async function getFollowUp(supabase: Awaited<ReturnType<typeof revenueClient>>, id: string) {
  const { data, error } = await supabase.from("revenue_follow_ups").select("*").eq("id", id).maybeSingle()
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

  let query = supabase.from("revenue_follow_ups").select("*").order("scheduled_at", { ascending: true }).limit(limit)
  if (!includeArchived) query = query.neq("status", "archived")
  if (status && status !== "all") query = query.eq("status", status)
  if (entityId) query = query.eq("entity_id", entityId)
  if (prospectId) query = query.eq("prospect_id", prospectId)
  if (partnershipId) query = query.eq("partnership_id", partnershipId)

  const { data, error, count } = await query
  if (error) return fail(error)
  const followUps = (data || []).map(normalizeFollowUpFromDb)
  return ok({ data: followUps, items: followUps, followUps, follow_ups: followUps, count: count ?? followUps.length, source: "revenue_follow_ups" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const followUp = await createLinkedFollowUp(supabase as any, body)
    return ok({ data: followUp, item: followUp, followUp, followUps: [followUp], follow_up: followUp, count: 1, source: "revenue_follow_ups" })
  } catch (error) {
    return fail(error)
  }
}

export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const id = String(body.id || body.followUpId || body.follow_up_id || "")
    if (!id) return fail("Missing follow-up id", 400)
    const action = actionOf(body)
    const before = await getFollowUp(supabase, id)
    if (!before) return fail("Follow-up not found", 404)
    const normalizedBefore = normalizeFollowUpFromDb(before)

    if (["add_note", "note", "add_comment", "comment"].includes(action)) {
      const note = await saveRevenueNote(supabase as any, {
        ...body,
        entityType: "follow_up",
        entityId: id,
        prospectId: normalizedBefore.prospectId,
        partnershipId: normalizedBefore.partnershipId,
      }, { actionType: action.includes("comment") ? "comment" : "note", parentLabel: before?.title })
      return ok({ data: note, item: note, note, comment: note.comment || note, source: "revenue_notes" })
    }

    if (action === "create_next") {
      const next = await createLinkedFollowUp(supabase as any, {
        ...body,
        title: body.title || before.next_step || `Next follow-up: ${before.title}`,
        entityType: normalizedBefore.entityType,
        entityId: normalizedBefore.entityId,
        prospectId: normalizedBefore.prospectId,
        partnershipId: normalizedBefore.partnershipId,
        metadata: { ...(body.metadata || {}), previousFollowUpId: id },
      })
      return ok({ data: next, item: next, followUp: next, followUps: [next], source: "revenue_follow_ups" })
    }

    const now = new Date().toISOString()
    let patch: Record<string, unknown> = {}
    let eventType = "follow_up_updated"

    if (action === "archive") {
      patch = { status: "archived", archived_at: now }
      eventType = "follow_up_archived"
    } else if (action === "restore") {
      patch = { status: "pending", archived_at: null }
      eventType = "follow_up_restored"
    } else if (action === "complete") {
      patch = { status: "completed", completed_at: now, result: body.result || before.result || "" }
      eventType = "follow_up_completed"
    } else if (action === "missed") {
      patch = { status: "missed", result: body.result || "Missed" }
      eventType = "follow_up_missed"
    } else if (action === "reschedule") {
      patch = { scheduled_at: body.scheduledAt || body.scheduled_at || body.followUpAt || body.follow_up_at || before.scheduled_at }
      eventType = "follow_up_rescheduled"
    } else {
      patch = followUpUpdatePatch(body)
      if (body.status !== undefined && before.status !== body.status) eventType = `follow_up_${String(body.status).toLowerCase()}`
      if (body.scheduledAt !== undefined || body.scheduled_at !== undefined) eventType = "follow_up_rescheduled"
    }

    const row = await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_follow_ups",
      id,
      patch,
      entityType: "follow_up",
      actionType: eventType,
      title: `Follow-up ${eventType.replace("follow_up_", "").replaceAll("_", " ")}: ${before.title || id}`,
      before,
      prospectId: normalizedBefore.prospectId || null,
      partnershipId: normalizedBefore.partnershipId || null,
    })
    const followUp = normalizeFollowUpFromDb(row)
    return ok({ data: followUp, item: followUp, followUp, followUps: [followUp], follow_up: followUp, count: 1, source: "revenue_follow_ups" })
  } catch (error) {
    return fail(error)
  }
}

export async function DELETE(request: Request) {
  const supabase = await revenueClient()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return fail("Missing follow-up id", 400)
    const before = await getFollowUp(supabase, id)
    if (!before) return fail("Follow-up not found", 404)
    const normalizedBefore = normalizeFollowUpFromDb(before)
    const row = await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_follow_ups",
      id,
      patch: { status: "archived", archived_at: new Date().toISOString() },
      entityType: "follow_up",
      actionType: "follow_up_archived",
      title: `Follow-up archived: ${before.title || id}`,
      before,
      prospectId: normalizedBefore.prospectId || null,
      partnershipId: normalizedBefore.partnershipId || null,
    })
    const followUp = normalizeFollowUpFromDb(row)
    return ok({ data: followUp, item: followUp, followUp, source: "revenue_follow_ups" })
  } catch (error) {
    return fail(error)
  }
}
