import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export type RevenueEntityType = "prospect" | "appointment" | "task" | "partnership" | "b2c" | "document" | "account" | "opportunity"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function revenueClient() {
  return createClient()
}

export function ok(payload: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...payload })
}

export function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error || "Unknown revenue command error")
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function getActor(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getUser()
  return {
    actorId: data?.user?.id || null,
    actor: data?.user?.email || "Revenue Command Center",
  }
}

export async function logRevenueActivity(
  supabase: SupabaseClient,
  input: {
    entityType?: string
    entityId?: string | null
    prospectId?: string | null
    eventType: string
    title: string
    body?: string | null
    severity?: string
    metadata?: Record<string, unknown>
  },
) {
  const actor = await getActor(supabase)
  await supabase.from("revenue_activities").insert({
    entity_type: input.entityType || "prospect",
    entity_id: input.entityId || input.prospectId || null,
    prospect_id: input.prospectId || (input.entityType === "prospect" ? input.entityId : null) || null,
    event_type: input.eventType,
    title: input.title,
    body: input.body || null,
    actor_id: actor.actorId,
    actor: actor.actor,
    severity: input.severity || "info",
    metadata: input.metadata || {},
  })
}

export async function logRevenueAction(
  supabase: SupabaseClient,
  input: {
    actionType: string
    entityType: string
    entityId?: string | null
    payload?: Record<string, unknown>
    result?: Record<string, unknown>
  },
) {
  const actor = await getActor(supabase)
  await supabase.from("revenue_command_action_logs").insert({
    action_type: input.actionType,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    actor_id: actor.actorId,
    actor: actor.actor,
    payload: input.payload || {},
    result: input.result || {},
  })
}

export function cleanString(value: unknown, fallback = "") {
  const text = typeof value === "string" ? value.trim() : ""
  return text || fallback
}

export function cleanNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function cleanArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

export function uuidOrNull(value: unknown) {
  const text = cleanString(value)
  return text.length ? text : null
}

export async function requireProspect(supabase: SupabaseClient, prospectId: string) {
  const { data, error } = await supabase.from("revenue_prospects").select("id,name,city,stage").eq("id", prospectId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Selected prospect does not exist in revenue_prospects")
  return data
}
