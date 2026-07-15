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

export function revenueErrorMessage(error: unknown, fallback = "Unknown revenue command error") {
  if (error instanceof Error) return error.message || fallback
  if (typeof error === "string") return error || fallback
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    const message = typeof record.message === "string" ? record.message : ""
    const details = typeof record.details === "string" ? record.details : ""
    const hint = typeof record.hint === "string" ? record.hint : ""
    const code = typeof record.code === "string" ? record.code : ""
    const parts = [message, details, hint, code ? `code ${code}` : ""].filter(Boolean)
    if (parts.length) return parts.join(" · ")
    try {
      const json = JSON.stringify(error)
      if (json && json !== "{}") return json
    } catch {}
  }
  return String(error || fallback)
}

export function fail(error: unknown, status = 500) {
  const message = revenueErrorMessage(error)
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
  const entityType = input.entityType || "prospect"
  const entityId = input.entityId || input.prospectId || null
  const canonical = await supabase.from("revenue_activities").insert({
    entity_type: entityType,
    entity_id: entityId,
    prospect_id: input.prospectId || (entityType === "prospect" ? entityId : null) || null,
    event_type: input.eventType,
    title: input.title,
    body: input.body || null,
    actor_id: actor.actorId,
    actor: actor.actor,
    severity: input.severity || "info",
    metadata: input.metadata || {},
  })
  if (!canonical.error) return

  await supabase.from("revenue_activities").insert({
    entity_type: entityType,
    entity_id: entityId,
    event_type: input.eventType,
    event_title: input.title,
    event_body: input.body || null,
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

function getPayloadValue(payload: Record<string, unknown>, keys: string[], fallback: unknown = "") {
  for (const key of keys) {
    const value = payload[key]
    if (value !== undefined && value !== null && value !== "") return value
  }
  return fallback
}

export function normalizeRevenueProspectPayload(input: unknown, idFallback?: string) {
  const payload = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  const nestedData = payload.data && typeof payload.data === "object" ? (payload.data as Record<string, unknown>) : {}
  const merged = { ...nestedData, ...payload }
  const id = cleanString(getPayloadValue(merged, ["id", "prospectId", "entityId"], idFallback || ""), idFallback || "")
  const name = cleanString(getPayloadValue(merged, ["name", "company", "title"], "Recovered prospect"), "Recovered prospect")
  const company = cleanString(getPayloadValue(merged, ["company", "name"], name), name)
  const contactName = cleanString(getPayloadValue(merged, ["contactName", "contact_name", "decisionMaker", "decision_maker"], ""), "")
  const valueMad = cleanNumber(getPayloadValue(merged, ["valueMad", "value_mad", "value"], 0), 0)
  const probability = cleanNumber(getPayloadValue(merged, ["probability"], 0), 0)
  const score = cleanNumber(getPayloadValue(merged, ["score"], 0), 0)
  const now = new Date().toISOString()

  return {
    id,
    name,
    company,
    city: cleanString(getPayloadValue(merged, ["city"], "Unassigned"), "Unassigned"),
    source: cleanString(getPayloadValue(merged, ["source"], "profile_auto_recovery"), "profile_auto_recovery"),
    segment: cleanString(getPayloadValue(merged, ["segment", "type"], "b2b"), "b2b"),
    stage: cleanString(getPayloadValue(merged, ["stage"], "new_lead"), "new_lead"),
    priority: cleanString(getPayloadValue(merged, ["priority"], "medium"), "medium"),
    score,
    value_mad: valueMad,
    probability,
    owner: cleanString(getPayloadValue(merged, ["owner"], "BD Officer"), "BD Officer"),
    contact_name: contactName,
    email: cleanString(getPayloadValue(merged, ["email"], ""), ""),
    phone: cleanString(getPayloadValue(merged, ["phone"], ""), ""),
    status: cleanString(getPayloadValue(merged, ["status"], "active"), "active"),
    data: {
      ...merged,
      id,
      name,
      company,
      contactName,
      city: cleanString(getPayloadValue(merged, ["city"], "Unassigned"), "Unassigned"),
      stage: cleanString(getPayloadValue(merged, ["stage"], "new_lead"), "new_lead"),
      priority: cleanString(getPayloadValue(merged, ["priority"], "medium"), "medium"),
      valueMad,
      score,
      probability,
      updatedAt: cleanString(getPayloadValue(merged, ["updatedAt", "updated_at"], now), now),
      createdAt: cleanString(getPayloadValue(merged, ["createdAt", "created_at"], now), now),
    },
    metadata: {
      ...(merged.metadata && typeof merged.metadata === "object" ? (merged.metadata as Record<string, unknown>) : {}),
      source_of_truth: "revenue_prospects",
      auto_recovered: Boolean(idFallback && cleanString(getPayloadValue(merged, ["id"], "")) !== idFallback),
    },
    updated_at: now,
  }
}

export async function findRevenueProspect(supabase: SupabaseClient, prospectId: string) {
  const id = cleanString(prospectId)
  if (!id) return null
  const { data, error } = await supabase.from("revenue_prospects").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  return data || null
}

async function upsertRevenueProspectResilient(supabase: SupabaseClient, row: ReturnType<typeof normalizeRevenueProspectPayload>) {
  const fullRow = { ...row }
  const { data, error } = await supabase.from("revenue_prospects").upsert(fullRow, { onConflict: "id" }).select("*").single()
  if (!error) return data

  // Older installs have the minimal revenue_prospects schema only. Keep a safe fallback so
  // profile actions never fail only because optional enterprise columns are missing.
  const minimalRow = {
    id: fullRow.id,
    name: fullRow.name,
    city: fullRow.city,
    stage: fullRow.stage,
    priority: fullRow.priority,
    value_mad: fullRow.value_mad,
    score: fullRow.score,
    data: fullRow.data,
    updated_at: fullRow.updated_at,
  }
  const fallback = await supabase.from("revenue_prospects").upsert(minimalRow, { onConflict: "id" }).select("*").single()
  if (fallback.error) throw new Error(`${error.message}; fallback: ${fallback.error.message}`)
  return fallback.data
}

export async function ensureRevenueProspect(
  supabase: SupabaseClient,
  prospectId: string,
  snapshot?: Record<string, unknown> | null,
) {
  const id = cleanString(prospectId)
  if (!id) throw new Error("Missing prospect id")

  const existing = await findRevenueProspect(supabase, id)
  if (existing) return existing

  const row = normalizeRevenueProspectPayload({ ...(snapshot || {}), id }, id)
  const created = await upsertRevenueProspectResilient(supabase, row)
  await logRevenueActivity(supabase, {
    entityType: "prospect",
    entityId: created.id,
    prospectId: created.id,
    eventType: "prospect_auto_recovered",
    title: `Prospect restored to source of truth: ${created.name || row.name}`,
    severity: "warning",
    metadata: { source: "ensureRevenueProspect", originalId: id },
  }).catch(() => undefined)
  await logRevenueAction(supabase, {
    actionType: "ensure_prospect_source_of_truth",
    entityType: "prospect",
    entityId: created.id,
    payload: { id, snapshot: snapshot || null },
    result: { id: created.id },
  }).catch(() => undefined)
  return created
}

export async function requireProspect(supabase: SupabaseClient, prospectId: string) {
  const data = await findRevenueProspect(supabase, prospectId)
  if (!data) throw new Error("Selected prospect does not exist in revenue_prospects")
  return data
}
