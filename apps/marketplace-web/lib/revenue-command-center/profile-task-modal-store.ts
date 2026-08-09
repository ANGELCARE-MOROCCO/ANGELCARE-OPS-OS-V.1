"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

function readableError(error: unknown, fallback = "Unable to create task") {
  if (error instanceof Error) return error.message || fallback
  if (typeof error === "string") return error || fallback
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    const message = typeof record.message === "string" ? record.message : ""
    const details = typeof record.details === "string" ? record.details : ""
    const hint = typeof record.hint === "string" ? record.hint : ""
    const parts = [message, details, hint].filter(Boolean)
    if (parts.length) return parts.join(" · ")
    try {
      const json = JSON.stringify(error)
      if (json && json !== "{}") return json
    } catch {}
  }
  return fallback
}

export type ProfileTaskProspect = {
  id: string
  name: string
  company?: string
  city?: string
  stage?: string
  priority?: string
  score?: number
  owner?: string
  contactName?: string
}

export type ProfileTaskPayload = {
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
  prospectSnapshot?: ProfileTaskProspect | Record<string, unknown>
}

export async function createProfileLinkedTask(input: ProfileTaskPayload) {
  const response = await fetch("/api/revenue-command-center/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ ...input, prospectSnapshot: input.prospectSnapshot }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.ok) throw new Error(readableError(payload.error || payload, "Unable to create task"))
  return payload.task
}

export async function loadProspectProfileTasks(prospectId: string) {
  const { data, error } = await supabase
    .from("revenue_task_command_view")
    .select("*")
    .eq("entity_id", prospectId)
    .order("created_at", { ascending: false })

  if (!error) return data || []

  const fallback = await supabase
    .from("revenue_tasks")
    .select("*")
    .eq("entity_id", prospectId)
    .order("created_at", { ascending: false })

  if (fallback.error) throw new Error(readableError(fallback.error, "Unable to load prospect tasks"))
  return fallback.data || []
}

export function subscribeProspectProfileTasks(prospectId: string, onChange: () => void) {
  const channel = supabase
    .channel(`profile-tasks-${prospectId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "revenue_tasks", filter: `entity_id=eq.${prospectId}` },
      onChange,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
