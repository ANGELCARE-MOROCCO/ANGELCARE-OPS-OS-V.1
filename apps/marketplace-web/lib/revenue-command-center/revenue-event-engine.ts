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
  const { data, error } = await supabase
    .from("revenue_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as RevenueEvent[]
}

export async function listEntityEvents(entityType: string, entityId: string) {
  const { data, error } = await supabase
    .from("revenue_events")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data || []) as RevenueEvent[]
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
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_notifications" }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
