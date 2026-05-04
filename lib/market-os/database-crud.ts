import { createClient } from "@/lib/supabase/server"

export type MarketOsDomain = "ambassador-program" | "partners-network"

export type MarketOsResource =
  | "ambassadors"
  | "ambassador_programs"
  | "ambassador_missions"
  | "ambassador_leads"
  | "ambassador_payouts"
  | "ambassador_territories"
  | "ambassador_documents"
  | "ambassador_approvals"
  | "partners"
  | "partner_programs"
  | "partner_leads"
  | "partner_deals"
  | "partner_payouts"
  | "partner_territories"
  | "partner_documents"
  | "partner_approvals"

export const RESOURCE_TABLE: Record<MarketOsResource, string> = {
  ambassadors: "market_os_ambassadors",
  ambassador_programs: "market_os_ambassador_programs",
  ambassador_missions: "market_os_ambassador_missions",
  ambassador_leads: "market_os_ambassador_leads",
  ambassador_payouts: "market_os_ambassador_payouts",
  ambassador_territories: "market_os_ambassador_territories",
  ambassador_documents: "market_os_ambassador_documents",
  ambassador_approvals: "market_os_ambassador_approvals",
  partners: "market_os_partners",
  partner_programs: "market_os_partner_programs",
  partner_leads: "market_os_partner_leads",
  partner_deals: "market_os_partner_deals",
  partner_payouts: "market_os_partner_payouts",
  partner_territories: "market_os_partner_territories",
  partner_documents: "market_os_partner_documents",
  partner_approvals: "market_os_partner_approvals",
}

export const AMBASSADOR_RESOURCES: MarketOsResource[] = [
  "ambassadors",
  "ambassador_programs",
  "ambassador_missions",
  "ambassador_leads",
  "ambassador_payouts",
  "ambassador_territories",
  "ambassador_documents",
  "ambassador_approvals",
]

export const PARTNER_RESOURCES: MarketOsResource[] = [
  "partners",
  "partner_programs",
  "partner_leads",
  "partner_deals",
  "partner_payouts",
  "partner_territories",
  "partner_documents",
  "partner_approvals",
]

export function normalizeResource(input: string | null, domain: MarketOsDomain): MarketOsResource {
  const value = (input || "").trim() as MarketOsResource
  const allowed = domain === "ambassador-program" ? AMBASSADOR_RESOURCES : PARTNER_RESOURCES
  if (allowed.includes(value)) return value
  return domain === "ambassador-program" ? "ambassadors" : "partners"
}

export function tableFor(resource: MarketOsResource) {
  return RESOURCE_TABLE[resource]
}

export async function listMarketOsRecords(resource: MarketOsResource, search?: string | null) {
  const supabase = await createClient()
  const table = tableFor(resource)
  let query = supabase.from(table).select("*").order("updated_at", { ascending: false }).limit(100)

  if (search?.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,title.ilike.%${search.trim()}%,status.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getMarketOsRecord(resource: MarketOsResource, id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from(tableFor(resource)).select("*").eq("id", id).maybeSingle()
  if (error) throw error
  return data
}

export async function createMarketOsRecord(resource: MarketOsResource, payload: Record<string, unknown>) {
  const supabase = await createClient()
  const clean = sanitizePayload(payload)
  const { data, error } = await supabase.from(tableFor(resource)).insert(clean).select("*").single()
  if (error) throw error
  await logMarketOsEvent(resource, data?.id, "created", clean)
  return data
}

export async function updateMarketOsRecord(resource: MarketOsResource, id: string, payload: Record<string, unknown>) {
  const supabase = await createClient()
  const clean = { ...sanitizePayload(payload), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from(tableFor(resource)).update(clean).eq("id", id).select("*").single()
  if (error) throw error
  await logMarketOsEvent(resource, id, "updated", clean)
  return data
}

export async function deleteMarketOsRecord(resource: MarketOsResource, id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from(tableFor(resource)).delete().eq("id", id)
  if (error) throw error
  await logMarketOsEvent(resource, id, "deleted", {})
  return { id }
}

export async function runMarketOsAction(resource: MarketOsResource, ids: string[], action: string, note?: string) {
  const supabase = await createClient()
  const statusMap: Record<string, string> = {
    approve: "approved",
    activate: "active",
    pause: "paused",
    archive: "archived",
    reject: "rejected",
    complete: "completed",
    flag: "flagged",
  }
  const nextStatus = statusMap[action]
  if (nextStatus && ids.length) {
    const { error } = await supabase
      .from(tableFor(resource))
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .in("id", ids)
    if (error) throw error
  }

  for (const id of ids) {
    await logMarketOsEvent(resource, id, action, { note })
  }

  return { action, ids, status: nextStatus || null }
}

export async function logMarketOsEvent(resource: MarketOsResource, recordId: string | null | undefined, action: string, payload: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from("market_os_execution_events").insert({
    module_key: resource.startsWith("partner") || resource === "partners" ? "partners-network" : "ambassador-program",
    resource_key: resource,
    record_id: recordId || null,
    action,
    payload,
  })
}

export function sanitizePayload(payload: Record<string, unknown>) {
  const blocked = new Set(["id", "created_at", "updated_at"])
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => !blocked.has(key) && value !== undefined))
}
