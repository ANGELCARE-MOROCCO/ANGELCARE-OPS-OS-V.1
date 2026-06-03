import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export type RevenueEntityType =
  | "prospect"
  | "partnership"
  | "appointment"
  | "task"
  | "follow_up"
  | "note"
  | "comment"
  | "document"
  | "campaign"
  | "general"
  | "b2c"
  | "account"
  | "opportunity"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function revenueClient() {
  return createClient()
}

export function ok(payload: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...payload }, { headers: NO_STORE_HEADERS })
}

export function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error || "Unknown revenue command error")
  return NextResponse.json({ ok: false, error: message }, { status, headers: NO_STORE_HEADERS })
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
    partnershipId?: string | null
    eventType: string
    title: string
    body?: string | null
    severity?: string
    metadata?: Record<string, unknown>
  },
) {
  const actor = await getActor(supabase)
  const entityType = input.entityType || "general"
  const entityId = input.entityId || input.prospectId || input.partnershipId || null
  const prospectId = input.prospectId || (entityType === "prospect" ? entityId : null) || null
  const partnershipId = input.partnershipId || (entityType === "partnership" ? entityId : null) || null
  const activityRow = {
    entity_type: entityType,
    entity_id: entityId,
    prospect_id: prospectId,
    partnership_id: partnershipId,
    event_type: input.eventType,
    title: input.title,
    event_title: input.title,
    body: input.body || null,
    event_body: input.body || null,
    actor_id: actor.actorId,
    actor: actor.actor,
    severity: input.severity || "info",
    metadata: input.metadata || {},
  }

  await tolerantInsert(supabase, "revenue_activities", activityRow)

  // The legacy timeline still reads revenue_events. Mirror when the table exists.
  await tolerantInsert(supabase, "revenue_events", {
    workspace_slug: "angelcare-main",
    entity_type: entityType,
    entity_id: entityId,
    event_type: input.eventType,
    event_title: input.title,
    title: input.title,
    event_body: input.body || null,
    body: input.body || null,
    actor: actor.actor,
    severity: input.severity || "info",
    metadata: input.metadata || {},
  }).catch(() => undefined)
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
  await tolerantInsert(supabase, "revenue_command_action_logs", {
    action_type: input.actionType,
    action_key: input.actionType,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    actor_id: actor.actorId,
    actor: actor.actor,
    payload: input.payload || {},
    result: input.result || {},
  })
}

export function cleanString(value: unknown, fallback = "") {
  const text = typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim()
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

export function cleanObject(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function cleanBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    if (["true", "1", "yes", "on"].includes(value.toLowerCase())) return true
    if (["false", "0", "no", "off"].includes(value.toLowerCase())) return false
  }
  return fallback
}

export async function tolerantInsert(
  supabase: SupabaseClient,
  table: string,
  row: Record<string, unknown>,
) {
  let attempt = { ...row }
  let lastError: unknown = null

  for (let index = 0; index < 16; index += 1) {
    const { data, error } = await (supabase as any).from(table).insert(attempt).select("*").maybeSingle()
    if (!error) return data
    lastError = error
    const message = error.message || ""

    if (message.includes("Could not find the table") || message.includes("does not exist") && message.includes(`'${table}'`)) {
      throw error
    }

    const missing = message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:of relation\s+"?[a-zA-Z0-9_]+"?\s+)?does not exist/i)?.[1]
      || message.match(/Could not find the '([^']+)' column/i)?.[1]
    if (missing && Object.prototype.hasOwnProperty.call(attempt, missing)) {
      const { [missing]: _removed, ...rest } = attempt
      attempt = rest
      continue
    }
    throw error
  }

  throw lastError instanceof Error ? lastError : new Error("Revenue insert failed")
}

export async function tolerantUpdate(
  supabase: SupabaseClient,
  table: string,
  id: string,
  patch: Record<string, unknown>,
) {
  let attempt = { ...patch }
  let lastError: unknown = null

  for (let index = 0; index < 16; index += 1) {
    const { data, error } = await (supabase as any).from(table).update(attempt).eq("id", id).select("*").single()
    if (!error) return data
    lastError = error
    const message = error.message || ""
    const missing = message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:of relation\s+"?[a-zA-Z0-9_]+"?\s+)?does not exist/i)?.[1]
      || message.match(/Could not find the '([^']+)' column/i)?.[1]
    if (missing && Object.prototype.hasOwnProperty.call(attempt, missing)) {
      const { [missing]: _removed, ...rest } = attempt
      attempt = rest
      continue
    }
    throw error
  }

  throw lastError instanceof Error ? lastError : new Error("Revenue update failed")
}

export async function logRevenuePipelineEvent(
  supabase: SupabaseClient,
  input: {
    entityType: "prospect" | "partnership"
    entityId: string
    fromStage?: string | null
    toStage: string
    actor?: string
    metadata?: Record<string, unknown>
  },
) {
  await tolerantInsert(supabase, "revenue_pipeline_history", {
    workspace_slug: "angelcare-main",
    entity_type: input.entityType,
    entity_id: input.entityId,
    prospect_id: input.entityType === "prospect" ? input.entityId : null,
    partnership_id: input.entityType === "partnership" ? input.entityId : null,
    from_stage: input.fromStage || null,
    to_stage: input.toStage,
    actor: input.actor || "Revenue Command Center",
    metadata: input.metadata || {},
  }).catch(() => undefined)
}

export async function requireProspect(supabase: SupabaseClient, prospectId: string) {
  const { data, error } = await supabase.from("revenue_prospects").select("id,name,city,stage").eq("id", prospectId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Selected prospect does not exist in revenue_prospects")
  return data
}

export async function requirePartnership(supabase: SupabaseClient, partnershipId: string) {
  const { data, error } = await supabase.from("revenue_partnerships").select("id,name,organization,stage,status").eq("id", partnershipId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Selected partnership does not exist in revenue_partnerships")
  return data
}
