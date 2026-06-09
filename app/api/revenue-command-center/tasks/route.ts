import { revenueClient, ok, fail, cleanString, cleanArray, ensureRevenueProspect, logRevenueActivity, logRevenueAction, revenueErrorMessage } from "@/lib/revenue-command-center/canonical-server"


function missingColumnName(error: unknown) {
  const message = revenueErrorMessage(error)
  return message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:of relation\s+"?[a-zA-Z0-9_]+"?\s+)?does not exist/i)?.[1] || null
}

async function insertTaskResilient(supabase: Awaited<ReturnType<typeof revenueClient>>, row: Record<string, unknown>) {
  let attempt = { ...row }
  const removable = new Set([
    "entity_type",
    "prospect_id",
    "description",
    "task_type",
    "assigned_role",
    "start_at",
    "end_at",
    "expected_outcome",
    "location",
    "metadata",
  ])

  for (let i = 0; i < 12; i += 1) {
    const { data, error } = await supabase.from("revenue_tasks").insert(attempt).select("*").single()
    if (!error) return data

    const missing = missingColumnName(error)
    if (missing && removable.has(missing)) {
      delete attempt[missing]
      continue
    }

    const message = revenueErrorMessage(error)
    if (/invalid input syntax for type uuid/i.test(message)) {
      delete attempt.prospect_id
      continue
    }

    throw new Error(message)
  }

  throw new Error("Unable to create task after compatibility retries")
}

async function updateTaskResilient(supabase: Awaited<ReturnType<typeof revenueClient>>, id: string, patch: Record<string, unknown>) {
  let attempt = { ...patch }
  const removable = new Set(["description", "task_type", "assigned_role", "due_date", "start_at", "end_at", "expected_outcome", "location", "metadata", "archived_at", "completed_at"])

  for (let i = 0; i < 12; i += 1) {
    const { data, error } = await supabase.from("revenue_tasks").update(attempt).eq("id", id).select("*").single()
    if (!error) return data

    const missing = missingColumnName(error)
    if (missing && removable.has(missing)) {
      delete attempt[missing]
      continue
    }

    throw new Error(revenueErrorMessage(error))
  }

  throw new Error("Unable to update task after compatibility retries")
}

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const entityId = searchParams.get("entityId")
  const limit = Math.min(Number(searchParams.get("limit") || 1000), 5000)
  let query = supabase.from("revenue_tasks").select("*").order("updated_at", { ascending: false }).limit(limit)
  if (status && status !== "all") query = query.eq("status", status)
  if (entityId) query = query.eq("entity_id", entityId)
  const { data, error } = await query
  if (error) return fail(error)
  return ok({ tasks: data || [], source: "revenue_tasks" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const entityId = cleanString(body.entityId || body.prospectId)
    if (!body.title) return fail("Missing task title", 400)
    const prospectSnapshot = body.prospectSnapshot || body.prospect || body.entity || body.metadata?.prospect || null
    if (entityId) await ensureRevenueProspect(supabase, entityId, prospectSnapshot)
    const row = {
      entity_type: cleanString(body.entityType, "prospect"),
      entity_id: entityId || null,
      prospect_id: entityId || null,
      title: cleanString(body.title, "Untitled task"),
      description: cleanString(body.description, ""),
      status: cleanString(body.status, "open"),
      priority: cleanString(body.priority, "medium"),
      task_type: cleanString(body.taskType || body.task_type, "follow_up"),
      owner: cleanString(body.owner, "BD Officer"),
      assigned_role: cleanString(body.assignedRole || body.assigned_role, ""),
      due_date: body.dueDate || body.due_date || null,
      start_at: body.startAt || body.start_at || null,
      end_at: body.endAt || body.end_at || null,
      expected_outcome: cleanString(body.expectedOutcome || body.expected_outcome, ""),
      location: cleanString(body.location, ""),
      metadata: { ...(body.metadata || {}), checklist: cleanArray(body.checklist), prospectSnapshot: prospectSnapshot || undefined },
    }
    const data = await insertTaskResilient(supabase, row)
    await logRevenueActivity(supabase, { entityType: entityId ? "prospect" : "task", entityId: entityId || data.id, prospectId: entityId || null, eventType: "task_created", title: `Task created: ${data.title}`, metadata: { taskId: data.id } })
    await logRevenueAction(supabase, { actionType: "create_task", entityType: "task", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ task: data })
  } catch (error) {
    return fail(error)
  }
}

export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const taskId = cleanString(body.id || body.taskId || body.task_id)
    if (!taskId) return fail("Missing task id", 400)
    if (body.mode === "archive" || body.action === "archive") {
      const data = await updateTaskResilient(supabase, taskId, { status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      await logRevenueActivity(supabase, { entityType: "task", entityId: data.id, prospectId: data.prospect_id || null, eventType: "task_archived", title: `task archived: ${data.title || data.id}`, severity: "warning", metadata: { table: "revenue_tasks" } })
      await logRevenueAction(supabase, { actionType: "archive_task", entityType: "task", entityId: data.id, payload: body, result: { id: data.id } })
      return ok({ task: data })
    }
    if (body.mode === "restore" || body.action === "restore") {
      const data = await updateTaskResilient(supabase, taskId, { status: "active", archived_at: null, updated_at: new Date().toISOString() })
      await logRevenueActivity(supabase, { entityType: "task", entityId: data.id, prospectId: data.prospect_id || null, eventType: "task_restored", title: `task restored: ${data.title || data.id}`, metadata: { table: "revenue_tasks" } })
      await logRevenueAction(supabase, { actionType: "restore_task", entityType: "task", entityId: data.id, payload: body, result: { id: data.id } })
      return ok({ task: data })
    }
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [from, to] of Object.entries({ title:"title", description:"description", status:"status", priority:"priority", taskType:"task_type", owner:"owner", assignedRole:"assigned_role", dueDate:"due_date", startAt:"start_at", endAt:"end_at", expectedOutcome:"expected_outcome", location:"location" })) {
      if (body[from] !== undefined) patch[to] = body[from]
    }
    if (body.metadata !== undefined) patch.metadata = body.metadata
    const data = await updateTaskResilient(supabase, taskId, patch)
    await logRevenueActivity(supabase, { entityType: data.entity_type || "prospect", entityId: data.entity_id, prospectId: data.prospect_id, eventType: "task_updated", title: `Task updated: ${data.title}`, metadata: { taskId: data.id, patch } })
    await logRevenueAction(supabase, { actionType: "update_task", entityType: "task", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ task: data })
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
    const { data, error } = await supabase.from("revenue_tasks").update({ status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: "task", entityId: data.id, prospectId: data.prospect_id || null, eventType: "task_archived", title: `task archived: ${data.title || data.id}`, severity: "warning", metadata: { table: "revenue_tasks" } })
    await logRevenueAction(supabase, { actionType: "archive_task", entityType: "task", entityId: data.id, payload: { id }, result: { id: data.id } })
    return ok({ task: data })
  } catch (error) {
    return fail(error)
  }
}
