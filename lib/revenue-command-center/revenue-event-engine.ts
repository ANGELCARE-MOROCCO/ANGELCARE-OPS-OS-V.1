"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export type RevenueEvent = {
  id: string
  entity_type: string
  entity_id: string
  event_type: string
  event_title: string
  event_body: string | null
  actor: string
  severity: string
  metadata: Record<string, unknown>
  created_at: string
}

function normalizeEvent(row: Record<string, any>): RevenueEvent {
  return {
    id: String(row.id || ""),
    entity_type: String(row.entity_type || "general"),
    entity_id: String(row.entity_id || row.prospect_id || row.partnership_id || ""),
    event_type: String(row.event_type || row.action_type || row.action || "activity"),
    event_title: String(row.event_title || row.title || row.action || "Activity logged"),
    event_body: row.event_body || row.body || row.note || null,
    actor: String(row.actor || "AngelCare"),
    severity: String(row.severity || "info"),
    metadata: (row.metadata && typeof row.metadata === "object") ? row.metadata : {},
    created_at: String(row.created_at || new Date().toISOString()),
  }
}

export type RevenueNotification = {
  id: string
  entity_type: string | null
  entity_id: string | null
  title: string
  body: string | null
  severity: string
  status: string
  assigned_to: string | null
  created_at: string
  read_at: string | null
}

export async function logRevenueEvent(input: {
  entityType: string
  entityId: string
  eventType: string
  title: string
  body?: string
  actor?: string
  severity?: string
  metadata?: Record<string, unknown>
}) {
  const { data, error } = await supabase.rpc("revenue_log_event", {
    p_entity_type: input.entityType,
    p_entity_id: input.entityId,
    p_event_type: input.eventType,
    p_event_title: input.title,
    p_event_body: input.body || null,
    p_actor: input.actor || "AngelCare",
    p_severity: input.severity || "info",
    p_metadata: input.metadata || {},
  })
  if (error) throw error
  return data as string
}

export async function listRevenueEvents(limit = 100) {
  const events = await supabase
    .from("revenue_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  const activities = await supabase
    .from("revenue_activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (events.error && activities.error) throw events.error
  return [...(events.data || []), ...(activities.data || [])]
    .map(normalizeEvent)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}

export async function listEntityEvents(entityType: string, entityId: string) {
  const events = await supabase
    .from("revenue_events")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })

  const activities = await supabase
    .from("revenue_activities")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })

  if (events.error && activities.error) throw events.error
  return [...(events.data || []), ...(activities.data || [])]
    .map(normalizeEvent)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function listRevenueNotifications() {
  const { data, error } = await supabase
    .from("revenue_notifications")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data || []) as RevenueNotification[]
}

export async function markNotificationRead(id: string) {
  const { data, error } = await supabase
    .from("revenue_notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function runRevenueEscalationSweep() {
  const { data, error } = await supabase.rpc("revenue_escalation_sweep")
  if (error) throw error
  return data
}

export function subscribeRevenueEvents(onChange: () => void) {
  const channel = supabase
    .channel("revenue-events-notifications")
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_events" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_activities" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_notes" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_comments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_notifications" }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
