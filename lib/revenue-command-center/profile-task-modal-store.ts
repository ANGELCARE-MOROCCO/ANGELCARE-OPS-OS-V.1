"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

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
}

export async function createProfileLinkedTask(input: ProfileTaskPayload) {
  const response = await fetch("/api/revenue-command-center/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(input),
  })

  const payload = await response.json()
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to create task")
  return payload.task
}

export async function loadProspectProfileTasks(prospectId: string) {
  const response = await fetch(`/api/revenue-command-center/tasks?prospectId=${encodeURIComponent(prospectId)}&includeArchived=false&limit=1000`, {
    cache: "no-store",
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "Unable to load prospect tasks")
  return payload.tasks || payload.data || payload.items || []
}

export function subscribeProspectProfileTasks(prospectId: string, onChange: () => void) {
  const channel = supabase
    .channel(`profile-tasks-${prospectId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "revenue_tasks" },
      onChange,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
