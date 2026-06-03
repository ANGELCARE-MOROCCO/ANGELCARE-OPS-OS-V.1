import { fail, ok, revenueClient, tolerantInsert } from "@/lib/revenue-command-center/canonical-server"
import { normalizeTaskFromDb, normalizeTaskPayload } from "@/lib/revenue-command-center/operational-normalizers"
import { saveRevenueNote, updateRevenueRowWithActivity } from "@/lib/revenue-command-center/operational-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

function actionOf(body: Record<string, any>) {
  return String(body.action || body.mode || "update").toLowerCase()
}

function hasAny(body: Record<string, any>, keys: string[]) {
  return keys.some((key) => body[key] !== undefined)
}

function taskUpdatePatch(body: Record<string, any>) {
  const normalized = normalizeTaskPayload(body)
  const patch: Record<string, unknown> = {}
  const aliases: Array<[string, string[]]> = [
    ["title", ["title", "name"]],
    ["description", ["description", "body"]],
    ["entity_type", ["entityType", "entity_type", "prospectId", "prospect_id", "partnershipId", "partnership_id"]],
    ["entity_id", ["entityId", "entity_id", "prospectId", "prospect_id", "partnershipId", "partnership_id"]],
    ["prospect_id", ["prospectId", "prospect_id"]],
    ["partnership_id", ["partnershipId", "partnership_id"]],
    ["owner", ["owner", "assignedOwner", "assigned_to"]],
    ["assigned_owner", ["assignedOwner", "owner", "assigned_to"]],
    ["status", ["status"]],
    ["priority", ["priority"]],
    ["due_date", ["dueDate", "due_date", "dueAt", "due_at"]],
    ["completed_at", ["completedAt", "completed_at"]],
    ["blocked_reason", ["blockedReason", "blocked_reason"]],
    ["notes", ["notes"]],
    ["task_type", ["taskType", "task_type", "type"]],
    ["start_at", ["startAt", "start_at"]],
    ["end_at", ["endAt", "end_at"]],
    ["assigned_role", ["assignedRole", "assigned_role"]],
    ["department", ["department"]],
    ["location", ["location"]],
    ["expected_outcome", ["expectedOutcome", "expected_outcome", "outcomeExpected", "outcome_expected"]],
    ["metadata", ["metadata"]],
  ]
  for (const [field, keys] of aliases) {
    if (hasAny(body, keys)) patch[field] = (normalized as any)[field]
  }
  return patch
}

async function getTask(supabase: Awaited<ReturnType<typeof revenueClient>>, id: string) {
  const { data, error } = await supabase.from("revenue_tasks").select("*").eq("id", id).maybeSingle()
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

  let query = supabase.from("revenue_tasks").select("*").order("updated_at", { ascending: false }).limit(limit)
  if (!includeArchived) query = query.neq("status", "archived")
  if (status && status !== "all") query = query.eq("status", status)
  if (entityId) query = query.eq("entity_id", entityId)
  if (prospectId) query = query.eq("prospect_id", prospectId)
  if (partnershipId) query = query.eq("partnership_id", partnershipId)

  const { data, error, count } = await query
  if (error) return fail(error)
  const tasks = (data || []).map(normalizeTaskFromDb)
  return ok({ data: tasks, items: tasks, tasks, count: count ?? tasks.length, source: "revenue_tasks" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const payload = normalizeTaskPayload(body)
    if (!String(payload.title || "").trim()) return fail("Task title is required", 400)

    const data = await tolerantInsert(supabase as any, "revenue_tasks", payload)
    const task = normalizeTaskFromDb(data)

    await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_tasks",
      id: task.id,
      patch: {},
      entityType: "task",
      actionType: "task_created",
      title: `Task created: ${task.title}`,
      prospectId: task.prospectId || null,
      partnershipId: task.partnershipId || null,
    })

    return ok({ data: task, item: task, task, tasks: [task], count: 1, source: "revenue_tasks" })
  } catch (error) {
    return fail(error)
  }
}

export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const id = String(body.id || body.taskId || body.task_id || "")
    if (!id) return fail("Missing task id", 400)
    const action = actionOf(body)
    const before = await getTask(supabase, id)
    if (!before) return fail("Task not found", 404)
    const normalizedBefore = normalizeTaskFromDb(before)

    if (["add_note", "note", "add_comment", "comment"].includes(action)) {
      const note = await saveRevenueNote(supabase as any, {
        ...body,
        entityType: "task",
        entityId: id,
        prospectId: normalizedBefore.prospectId,
        partnershipId: normalizedBefore.partnershipId,
      }, { actionType: action.includes("comment") ? "comment" : "note", parentLabel: before?.title })
      return ok({ data: note, item: note, note, comment: note.comment || note, source: "revenue_notes" })
    }

    const now = new Date().toISOString()
    let patch: Record<string, unknown> = {}
    let eventType = "task_updated"

    if (action === "archive") {
      patch = { status: "archived", archived_at: now }
      eventType = "task_archived"
    } else if (action === "restore") {
      patch = { status: "open", archived_at: null }
      eventType = "task_restored"
    } else if (action === "complete") {
      patch = { status: "done", completed_at: now }
      eventType = "task_completed"
    } else if (action === "reopen") {
      patch = { status: "open", completed_at: null }
      eventType = "task_reopened"
    } else if (action === "block") {
      patch = { status: "blocked", blocked_reason: body.blockedReason || body.blocked_reason || body.reason || "Blocked" }
      eventType = "task_blocked"
    } else if (action === "unblock") {
      patch = { status: "open", blocked_reason: null }
      eventType = "task_unblocked"
    } else if (action === "change_priority") {
      patch = { priority: body.priority || "medium" }
      eventType = "task_priority_changed"
    } else if (action === "reschedule") {
      patch = {
        due_date: body.dueDate || body.due_date || before.due_date,
        start_at: body.startAt || body.start_at || before.start_at,
        end_at: body.endAt || body.end_at || before.end_at,
      }
      eventType = "task_rescheduled"
    } else if (action === "assign") {
      patch = { owner: body.owner || body.assignedOwner || body.assigned_owner }
      eventType = "task_assigned"
    } else {
      patch = taskUpdatePatch(body)
      if (body.status !== undefined && before.status !== body.status) eventType = `task_${String(body.status).toLowerCase()}`
      if (body.priority !== undefined && before.priority !== body.priority) eventType = "task_priority_changed"
      if (body.dueDate !== undefined || body.due_date !== undefined) eventType = "task_rescheduled"
    }

    const row = await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_tasks",
      id,
      patch,
      entityType: "task",
      actionType: eventType,
      title: `Task ${eventType.replace("task_", "").replaceAll("_", " ")}: ${before.title || id}`,
      before,
      prospectId: normalizedBefore.prospectId || null,
      partnershipId: normalizedBefore.partnershipId || null,
    })
    const task = normalizeTaskFromDb(row)
    return ok({ data: task, item: task, task, tasks: [task], count: 1, source: "revenue_tasks" })
  } catch (error) {
    return fail(error)
  }
}

export async function DELETE(request: Request) {
  const supabase = await revenueClient()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return fail("Missing task id", 400)
    const before = await getTask(supabase, id)
    if (!before) return fail("Task not found", 404)
    const normalizedBefore = normalizeTaskFromDb(before)
    const row = await updateRevenueRowWithActivity(supabase as any, {
      table: "revenue_tasks",
      id,
      patch: { status: "archived", archived_at: new Date().toISOString() },
      entityType: "task",
      actionType: "task_archived",
      title: `Task archived: ${before.title || id}`,
      before,
      prospectId: normalizedBefore.prospectId || null,
      partnershipId: normalizedBefore.partnershipId || null,
    })
    const task = normalizeTaskFromDb(row)
    return ok({ data: task, item: task, task, source: "revenue_tasks" })
  } catch (error) {
    return fail(error)
  }
}
