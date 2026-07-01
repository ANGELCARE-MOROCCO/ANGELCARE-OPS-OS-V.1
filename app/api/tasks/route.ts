import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction } from "@/lib/ac360/action-wiring"

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  if (!body?.taskId) {
    return NextResponse.json({ ok: false, error: "Missing taskId" }, { status: 400 })
  }

  const guarded = await runAc360WiredAction('revenue.tasks.update', async () => {
    const updatePayload: Record<string, any> = {
      title: body.title,
      description: body.description || null,
      priority: body.priority || "medium",
      owner: body.owner || "BD Officer",
      due_date: body.dueDate || null,
      start_at: body.startAt || null,
      end_at: body.endAt || null,
      task_type: body.taskType || "prospect_follow_up",
      department: body.department || "Revenue",
      assigned_role: body.assignedRole || null,
      location: body.location || null,
      outcome_expected: body.outcomeExpected || null,
      escalation_rule: body.escalationRule || null,
      dependencies: body.dependencies || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      visibility: body.visibility || "team",
      reminder_minutes: Number(body.reminderMinutes ?? 15),
      add_to_calendar: Boolean(body.addToCalendar ?? true),
      send_notifications: Boolean(body.sendNotifications ?? true),
      status: body.status || "open",
      status_label: body.statusLabel || null,
      completed_at: body.status === "done" ? new Date().toISOString() : null,
    }

    if (body.entityId) {
      updatePayload.entity_id = body.entityId
      updatePayload.entity_type = "prospect"
    }

    const { data, error } = await supabase
      .from("revenue_tasks")
      .update(updatePayload)
      .eq("id", body.taskId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    await supabase.rpc("revenue_log_event", {
      p_entity_type: "task",
      p_entity_id: body.taskId,
      p_event_type: "task.profile_view_edit_saved",
      p_event_title: "Task edited from prospect profile",
      p_event_body: body.title || "Task updated",
      p_actor: body.owner || "AngelCare",
      p_severity: "info",
      p_metadata: { ...(data || {}), ac360_guarded: true },
    })

    return data
  }, {
    orgId: body.orgId || body.org_id,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('revenue.tasks.update', body.taskId),
    metadata: { taskId: body.taskId, status: body.status || null, source: 'api.tasks.PATCH' },
  })

  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return NextResponse.json({ ok: true, task: guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } })
}
