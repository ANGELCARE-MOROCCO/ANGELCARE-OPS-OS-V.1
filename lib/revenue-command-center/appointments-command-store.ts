"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export type AppointmentProspect = {
  id: string
  entityType: "prospect" | "partnership"
  name: string
  city: string
  stage: string
  priority: string
  value_mad: number
  score: number
  contactName: string
  owner: string
  email?: string
  phone?: string
}

export type AppointmentRecord = {
  id: string
  entity_type: string
  entity_id: string
  title: string
  appointment_at: string
  end_at: string | null
  owner: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "pending" | "no_show"
  appointment_type: string
  priority: string
  location: string | null
  meeting_link: string | null
  notes: string | null
  agenda: string | null
  objective: string | null
  expected_outcome: string | null
  attendees: any[]
  reminders: any[]
  documents: any[]
  tasks: any[]
  created_at: string
  updated_at: string
  entity_name?: string
  entity_city?: string
  entity_priority?: string
  entity_stage?: string
  entity_contact?: string
  entity_phone?: string
  entity_email?: string
  entity_score?: number
  entity_value_mad?: number
  linked_task_count?: number
}

export type AppointmentMetrics = {
  today_count: number
  week_count: number
  month_count: number
  confirmed_rate: number
  conversion_rate: number
  avg_duration_minutes: number
  total_count: number
}

export type AppointmentCommandPayload = {
  ok: boolean
  source: string
  syncedAt: string
  appointments: AppointmentRecord[]
  prospects: AppointmentProspect[]
  metrics: AppointmentMetrics
  types: Array<{ appointment_type: string; total: number; pct: number }>
}

export async function loadAppointmentsCommand(): Promise<AppointmentCommandPayload> {
  const response = await fetch("/api/revenue-command-center/appointments/command", { cache: "no-store" })
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    throw new Error("Appointments API returned HTML. Replace app/api/revenue-command-center/appointments/command/route.ts from Pack 1.")
  }
  const payload = await response.json()
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load appointments")
  return payload
}

export async function saveAppointment(input: Record<string, any>) {
  const method = input.id ? "PATCH" : "POST"
  const entityType = String(input.entityType || input.entity_type || "prospect")
  const response = await fetch("/api/revenue-command-center/appointments", {
    method,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      ...input,
      entityType,
      entityId: input.entityId || input.entity_id,
      prospectId: entityType === "prospect" ? input.entityId || input.entity_id || input.prospectId || input.prospect_id : input.prospectId || input.prospect_id,
      partnershipId: entityType === "partnership" ? input.entityId || input.entity_id || input.partnershipId || input.partnership_id : input.partnershipId || input.partnership_id,
    }),
  })
  const payload = await response.json()
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to save appointment")
  return payload.appointment as AppointmentRecord
}

export async function runAppointmentAction(appointmentId: string, action: "confirm" | "complete" | "cancel" | "delete") {
  const endpoint = `/api/revenue-command-center/appointments${action === "delete" ? `?id=${encodeURIComponent(appointmentId)}` : ""}`
  const response = await fetch(endpoint, action === "delete"
    ? { method: "DELETE", cache: "no-store" }
    : {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        id: appointmentId,
        action: action === "complete" ? "record_outcome" : action === "cancel" ? "cancel" : "update",
        status: action === "complete" ? "completed" : action === "cancel" ? "cancelled" : "confirmed",
      }),
    })
  const payload = await response.json()
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to run appointment action")
  return payload
}

export function subscribeAppointmentsCommand(onChange: () => void) {
  const channel = supabase
    .channel("appointments-command-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_appointments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_tasks" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_prospects" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_partnerships" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_follow_ups" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_notes" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_activities" }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
