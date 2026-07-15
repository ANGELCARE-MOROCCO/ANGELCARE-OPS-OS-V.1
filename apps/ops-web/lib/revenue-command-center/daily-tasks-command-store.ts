"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export type DailyTask = {
  id: string
  entity_type: string
  entity_id: string
  title: string
  description: string | null
  owner: string
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "done" | "cancelled"
  status_label?: string | null
  due_date: string | null
  start_at: string | null
  end_at: string | null
  task_type: string
  department: string
  assigned_role: string | null
  location: string | null
  outcome_expected: string | null
  escalation_rule: string | null
  dependencies: string | null
  tags: string[] | null
  visibility?: string | null
  reminder_minutes?: number | null
  add_to_calendar?: boolean | null
  send_notifications?: boolean | null
  completed_at: string | null
  created_at: string
  updated_at: string
  entity_name?: string
  entity_city?: string
  entity_stage?: string
  entity_priority?: string
  entity_contact?: string
  entity_phone?: string
  entity_email?: string
  entity_score?: number
  entity_value_mad?: number
}

export type DailyProspectOption = {
  id: string
  name: string
  city: string
  stage: string
  priority: string
  value_mad: number
  score: number
  contactName: string
  owner: string
}

export type DailyCommandPayload = {
  ok: boolean
  source: string
  syncedAt: string
  tasks: DailyTask[]
  metrics: {
    total_tasks: number
    completed_tasks: number
    in_progress_tasks: number
    pending_tasks: number
    overdue_tasks: number
    next_7_days: number
    completion_rate: number
  }
  workload: Array<{ owner: string; total_tasks: number; open_tasks: number; completed_tasks: number; priority_tasks: number }>
  categories: Array<{ task_type: string; total_tasks: number; pct: number }>
  prospects: DailyProspectOption[]
}

export async function loadDailyTasksCommand(): Promise<DailyCommandPayload> {
  const response = await fetch("/api/revenue-command-center/tasks/command", { cache: "no-store" })
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    throw new Error("Daily Tasks API route returned HTML. Replace app/api/revenue-command-center/tasks/command/route.ts from the restore pack.")
  }
  const payload = await response.json()
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load daily tasks command")
  return payload
}

export async function createDailyTask(input: {
  entityId: string
  title: string
  description?: string
  owner?: string
  priority?: "low" | "medium" | "high" | "critical"
  dueDate?: string
  startAt?: string
  endAt?: string
  taskType?: string
  department?: string
  assignedRole?: string
  location?: string
  outcomeExpected?: string
  escalationRule?: string
  dependencies?: string
  tags?: string[]
  visibility?: string
  reminderMinutes?: number
  addToCalendar?: boolean
  sendNotifications?: boolean
}) {
  const now = new Date().toISOString()

  let prospect: any = null

  if (input.entityId) {
    const prospectResult = await supabase
      .from("revenue_prospects")
      .select("*")
      .eq("id", input.entityId)
      .maybeSingle()

    prospect = prospectResult.data || null
  }

  const row = {
    entity_type: "prospect",
    entity_id: input.entityId || "",
    title: input.title || "Untitled task",
    description: input.description || null,
    owner: input.owner || "Revenue Manager",
    priority: input.priority || "medium",
    status: "open",
    status_label: "Pending",
    due_date: input.dueDate || null,
    start_at: input.startAt || null,
    end_at: input.endAt || null,
    task_type: input.taskType || "follow_up",
    department: input.department || "Revenue Command",
    assigned_role: input.assignedRole || null,
    location: input.location || prospect?.city || null,
    outcome_expected: input.outcomeExpected || null,
    escalation_rule: input.escalationRule || null,
    dependencies: input.dependencies || null,
    tags: input.tags || [],
    visibility: input.visibility || "team",
    reminder_minutes: input.reminderMinutes || null,
    add_to_calendar: Boolean(input.addToCalendar),
    send_notifications: Boolean(input.sendNotifications),
    completed_at: null,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from("revenue_tasks")
    .insert(row)
    .select("*")
    .single()

  if (error) {
    console.error("Unable to create revenue task:", error)
    throw new Error(error.message || "Unable to create task")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rcc-task-created", {
        detail: {
          taskId: data.id,
          entityId: data.entity_id,
          at: Date.now(),
        },
      })
    )
  }

  return {
    ...data,
    entity_name: prospect?.name || prospect?.company || prospect?.title || data.entity_name,
    entity_city: prospect?.city || data.entity_city,
    entity_stage: prospect?.stage || data.entity_stage,
    entity_priority: prospect?.priority || data.entity_priority,
    entity_contact: prospect?.contact_name || prospect?.contactName || data.entity_contact,
    entity_phone: prospect?.phone || data.entity_phone,
    entity_email: prospect?.email || data.entity_email,
    entity_score: prospect?.score || data.entity_score,
    entity_value_mad: prospect?.value_mad || prospect?.valueMad || data.entity_value_mad,
  } as DailyTask
}

export async function runTaskQuickAction(taskId: string, action: "complete" | "reopen" | "delete") {
  const response = await fetch("/api/revenue-command-center/tasks/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ mode: "quick_action", taskId, action }),
  })
  const payload = await response.json()
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to run task action")
  return payload
}

export function subscribeDailyTasksCommand(onChange: () => void) {
  const channel = supabase
    .channel("daily-tasks-command-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_tasks" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_prospects" }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
