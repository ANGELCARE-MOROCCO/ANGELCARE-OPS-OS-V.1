import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Row = Record<string, any>
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function ok(body: Row, status = 200) { return NextResponse.json(body, { status }) }
function text(value: unknown, fallback = "") { const s = typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); return s || fallback }
function num(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback }
function arr(value: unknown): any[] { if (Array.isArray(value)) return value; if (typeof value === "string" && value.trim()) { try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed } catch {} return value.split(/[;,|\n]/).map(v => v.trim()).filter(Boolean) } return [] }
function obj(value: unknown, fallback: Row = {}) { if (value && typeof value === "object" && !Array.isArray(value)) return value as Row; if (typeof value === "string" && value.trim()) { try { const parsed = JSON.parse(value); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Row } catch {} } return fallback }
function now() { return new Date().toISOString() }
function isUuid(value: unknown) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text(value)) }
function cleanSourceKey(value: unknown) { return text(value).replace(/^prospect-/, "") }
function jsonError(error: unknown) { return error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error) }

const typeByKind: Record<string, { type: string; category: string; icon: string }> = {
  preschool: { type: "Preschool & Kindergarten", category: "Education Partner", icon: "school" },
  kindergarten: { type: "Preschool & Kindergarten", category: "Education Partner", icon: "school" },
  school: { type: "Preschool & Kindergarten", category: "Education Partner", icon: "school" },
  maternity: { type: "Maternity Clinic", category: "Healthcare Partner", icon: "heart" },
  clinic: { type: "Maternity Clinic", category: "Healthcare Partner", icon: "heart" },
  orthophoniste: { type: "Orthophoniste", category: "Healthcare Partner", icon: "activity" },
  hotel: { type: "Hotel", category: "Hospitality Partner", icon: "hotel" },
  corporate: { type: "Corporate", category: "Corporate Partner", icon: "building" },
  association: { type: "Association", category: "Association Partner", icon: "network" },
  finance: { type: "Finance / Sponsor", category: "Strategic Partner", icon: "landmark" },
  strategic: { type: "Strategic Alliance", category: "Strategic Partner", icon: "handshake" },
}

function deriveKind(input: Row) {
  const rawValue = text(input.kind || input.partner_kind || input.type_key || input.type || input.category, "preschool").toLowerCase()
  if (rawValue.includes("matern") || rawValue.includes("clinic")) return "maternity"
  if (rawValue.includes("ortho")) return "orthophoniste"
  if (rawValue.includes("hotel")) return "hotel"
  if (rawValue.includes("corporate") || rawValue.includes("company")) return "corporate"
  if (rawValue.includes("association") || rawValue.includes("ngo")) return "association"
  if (rawValue.includes("finance") || rawValue.includes("sponsor")) return "finance"
  if (rawValue.includes("strategic") || rawValue.includes("alliance")) return "strategic"
  if (rawValue.includes("school") || rawValue.includes("kindergarten") || rawValue.includes("preschool") || rawValue.includes("education")) return "preschool"
  return rawValue || "preschool"
}

function deriveMeta(input: Row) {
  const kind = deriveKind(input)
  const defaults = typeByKind[kind] || typeByKind.preschool
  const type = text(input.type || input.partner_type, defaults.type)
  const category = text(input.category || input.partner_category, defaults.category)
  const icon = text(input.type_icon || input.icon_key || input.icon || input.partner_icon, defaults.icon)
  return { kind, type, category, icon }
}

function programRowsFrom(merged: Row) {
  const linked = arr(merged.linked_programs)
  const details = arr(merged.program_details)
  const direct = arr(merged.programs || merged.assigned_programs || merged.program_names).map((name) => ({ id: name, name, status: "active", price_mad: 0 }))
  const seen = new Set<string>()
  return [...linked, ...details, ...direct].map((row, index) => typeof row === "string" ? { id: row, name: row, status: "active", price_mad: 0 } : { ...row, id: text(row?.id || row?.program_id || row?.name || `program-${index}`), name: text(row?.name || row?.title || row?.program_name || row?.id, `Program ${index + 1}`) }).filter((row) => {
    const key = text(row.id || row.name).toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function partnerFromRow(row: Row, source: "partner" | "prospect" = "partner") {
  const raw = obj(row.raw, {})
  const merged = { ...raw, ...row }
  const meta = deriveMeta(merged)
  const tags = arr(merged.tags)
  const tagIcon = tags.map(String).find(tag => tag.startsWith("icon:"))?.replace("icon:", "")
  const id = text(merged.id, source === "prospect" ? `prospect-${text(merged.source_prospect_key || merged.source_prospect_id || row.id, `${Date.now()}`)}` : `partner-${Date.now()}`)
  const programs = programRowsFrom(merged)
  const value = num(merged.value_mad ?? merged.contract_value_mad ?? merged.pipeline_value ?? merged.value ?? merged.revenueImpact, 0)
  return {
    ...merged,
    raw: merged,
    id,
    source: text(merged.source, source),
    source_id: text(merged.source_id || merged.source_prospect_key || merged.source_prospect_id || merged.prospect_id || (source === "prospect" ? row.id : id), id),
    source_prospect_key: text(merged.source_prospect_key || (source === "prospect" ? row.id : "")),
    source_prospect_id: isUuid(merged.source_prospect_id || merged.prospect_id) ? text(merged.source_prospect_id || merged.prospect_id) : null,
    name: text(merged.name || merged.partnerName || merged.company || merged.organization || merged.title, "Unnamed partner"),
    organization: text(merged.organization || merged.company || merged.name, "B2B Partner"),
    contact_name: text(merged.contact_name || merged.contactName || merged.decision_maker || merged.contact, ""),
    email: text(merged.email, ""),
    phone: text(merged.phone || merged.whatsapp, ""),
    website: text(merged.website || merged.url, ""),
    city: text(merged.city || merged.location, "Rabat"),
    district: text(merged.district || merged.area || merged.neighborhood, ""),
    kind: meta.kind,
    type: meta.type,
    category: meta.category,
    type_icon: tagIcon || meta.icon,
    icon_key: tagIcon || meta.icon,
    status: text(merged.status || merged.stage, source === "prospect" ? "target" : "active").toLowerCase(),
    owner: text(merged.owner || merged.assignee || merged.account_manager, "BD Officer"),
    programs: programs.map((program) => text(program.name || program.id, "Program")),
    program_details: arr(merged.program_details),
    offer_parameters: arr(merged.offer_parameters),
    pricing_parameters: obj(merged.pricing_parameters, {}),
    management_controls: obj(merged.management_controls, {}),
    value_mad: value,
    revenueImpact: value,
    probability: num(merged.probability, 50),
    health_score: num(merged.health_score ?? merged.engagement ?? merged.score, 64),
    engagement: num(merged.engagement ?? merged.health_score ?? merged.score, 64),
    referral_potential: num(merged.referral_potential, 50),
    partner_contacts: arr(merged.partner_contacts),
    linked_programs: arr(merged.linked_programs),
    linked_contracts: arr(merged.linked_contracts),
    linked_offers: arr(merged.linked_offers),
    transactions: arr(merged.transactions),
    invoices: arr(merged.invoices),
    communications: arr(merged.communications),
    team_members: arr(merged.team_members),
    activity_log: arr(merged.activity_log),
    contract_checklist: arr(merged.contract_checklist),
    contract_checklist_done: arr(merged.contract_checklist_done),
    documents: arr(merged.documents),
    tags,
    joinedOn: merged.joinedOn || merged.joined_on || merged.created_at,
    created_at: merged.created_at,
    updated_at: merged.updated_at,
    summary: text(merged.summary || merged.context || merged.notes || merged.description, "Synced live from Revenue Command Center source of truth."),
    context: text(merged.context || merged.summary || merged.notes || merged.description, ""),
    notes: text(merged.notes || merged.summary || merged.context, ""),
    next_action: text(merged.next_action || merged.nextAction, "Review next partnership step."),
  }
}

function rowFromPayload(input: Row, partnerId?: string) {
  const meta = deriveMeta(input)
  const incomingId = text(partnerId || input.partnerId || input.id, "")
  const sourceKey = cleanSourceKey(input.source_prospect_key || input.source_id || input.source_prospect_id || input.prospect_id || (incomingId.startsWith("prospect-") ? incomingId : ""))
  const id = incomingId && !incomingId.startsWith("prospect-") ? incomingId : `partner-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const icon = text(input.type_icon || input.icon_key, meta.icon)
  const tags = [`icon:${icon}`, ...arr(input.tags).map(String).filter(tag => !tag.startsWith("icon:"))]
  const createdAt = input.created_at || input.createdAt || now()
  const sourceProspectId = isUuid(input.source_prospect_id || input.prospect_id || sourceKey) ? text(input.source_prospect_id || input.prospect_id || sourceKey) : null
  const raw = { ...input, id, source_prospect_key: sourceKey, source_prospect_id: sourceProspectId, kind: meta.kind, type: meta.type, category: meta.category, type_icon: icon, icon_key: icon, tags }
  return {
    id,
    name: text(input.name || input.partnerName || input.organization, "New AngelCare partnership"),
    organization: text(input.organization || input.company || input.name, "B2B Partner"),
    city: text(input.city || input.location, "Rabat"),
    district: text(input.district || input.area, ""),
    kind: meta.kind,
    type: meta.type,
    category: meta.category,
    type_icon: icon,
    icon_key: icon,
    status: text(input.status || input.stage, "active").toLowerCase(),
    owner: text(input.owner || input.assignee, "BD Officer"),
    contact_name: text(input.contact_name || input.contactName || input.decision_maker, ""),
    phone: text(input.phone || input.whatsapp, ""),
    email: text(input.email, ""),
    website: text(input.website || input.url, ""),
    value_mad: num(input.value_mad ?? input.valueMad ?? input.value ?? input.contract_value_mad, 0),
    probability: num(input.probability, 50),
    health_score: num(input.health_score ?? input.engagement ?? input.score, 64),
    engagement: num(input.engagement ?? input.health_score ?? input.score, 64),
    referral_potential: num(input.referral_potential ?? input.referralPotential, 50),
    context: text(input.context || input.summary || input.notes, ""),
    summary: text(input.summary || input.context || input.notes, ""),
    notes: text(input.notes || input.summary || input.context, ""),
    next_action: text(input.next_action || input.nextAction, "Review next partnership step."),
    contract_status: input.contract_status || input.agreementStatus || null,
    contract_value_mad: num(input.contract_value_mad ?? input.value_mad ?? input.valueMad, 0),
    payment_terms: input.payment_terms || null,
    source: "partner",
    source_id: id,
    source_prospect_key: sourceKey,
    source_prospect_id: sourceProspectId,
    programs: arr(input.programs),
    program_details: arr(input.program_details),
    offer_parameters: arr(input.offer_parameters),
    pricing_parameters: obj(input.pricing_parameters, {}),
    management_controls: obj(input.management_controls, {}),
    documents: arr(input.documents),
    tags,
    partner_contacts: arr(input.partner_contacts),
    linked_programs: arr(input.linked_programs),
    linked_contracts: arr(input.linked_contracts),
    linked_offers: arr(input.linked_offers),
    transactions: arr(input.transactions),
    invoices: arr(input.invoices),
    communications: arr(input.communications),
    team_members: arr(input.team_members),
    activity_log: arr(input.activity_log),
    contract_checklist: arr(input.contract_checklist),
    contract_checklist_done: arr(input.contract_checklist_done),
    raw,
    created_at: createdAt,
    updated_at: now(),
  }
}

async function tolerantUpsert(supabase: SupabaseClient, table: string, row: Row) {
  let attempt = { ...row }
  for (let i = 0; i < 40; i += 1) {
    const { data, error } = await supabase.from(table).upsert(attempt, { onConflict: "id" }).select("*").single()
    if (!error) return data
    const missing = (error.message || "").match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:of relation\s+"?[a-zA-Z0-9_]+"?\s+)?does not exist/i)?.[1]
    if (missing && Object.prototype.hasOwnProperty.call(attempt, missing)) {
      const { [missing]: _omit, ...rest } = attempt
      attempt = rest
      continue
    }
    throw error
  }
  throw new Error(`Could not save ${table}`)
}

async function tolerantInsert(supabase: SupabaseClient, table: string, row: Row) {
  let attempt = { ...row }
  for (let i = 0; i < 30; i += 1) {
    const { error } = await supabase.from(table).insert(attempt)
    if (!error) return
    const missing = (error.message || "").match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:of relation\s+"?[a-zA-Z0-9_]+"?\s+)?does not exist/i)?.[1]
    if (missing && Object.prototype.hasOwnProperty.call(attempt, missing)) {
      const { [missing]: _omit, ...rest } = attempt
      attempt = rest
      continue
    }
    return
  }
}

async function readPartners(supabase: SupabaseClient) {
  const partnerships = await supabase.from("revenue_partnerships").select("*").order("updated_at", { ascending: false }).limit(500)
  if (partnerships.error) throw partnerships.error
  const partnerRows = (partnerships.data || []).map(row => partnerFromRow(row, "partner"))

  let prospectRows: Row[] = []
  const prospects = await supabase.from("revenue_prospects").select("*").order("updated_at", { ascending: false }).limit(500)
  if (!prospects.error) {
    const coveredProspects = new Set(partnerRows.flatMap(row => [text(row.source_prospect_key || row.raw?.source_prospect_key), text(row.source_prospect_id || row.raw?.source_prospect_id), text(row.source_id)]).filter(Boolean).map(cleanSourceKey))
    prospectRows = (prospects.data || [])
      .filter(row => !coveredProspects.has(cleanSourceKey(row.id)))
      .map(row => partnerFromRow({ ...row, id: `prospect-${text(row.id)}`, source: "prospect", source_id: text(row.id), source_prospect_key: text(row.id), source_prospect_id: isUuid(row.id) ? text(row.id) : null, status: row.status || "target" }, "prospect"))
  }

  return [...partnerRows, ...prospectRows]
}

async function readActivities(supabase: SupabaseClient) {
  const { data } = await supabase.from("revenue_partnership_activities").select("*").order("created_at", { ascending: false }).limit(100)
  return (data || []).map((row: Row) => ({
    id: text(row.id, `${row.partner_id || "activity"}-${row.created_at || Date.now()}`),
    partner_id: row.partner_id || null,
    title: text(row.title || row.action, "Partnership activity"),
    note: text(row.note, "Saved live activity."),
    action: text(row.action, "activity"),
    created_at: text(row.created_at, now()),
  }))
}

function metrics(partners: Row[]) {
  const active = partners.filter(p => ["active", "growth"].includes(text(p.status).toLowerCase())).length
  const pipelineMad = partners.reduce((sum, p) => sum + num(p.value_mad), 0)
  const forecastMad = partners.reduce((sum, p) => sum + num(p.value_mad) * (num(p.probability, 50) / 100), 0)
  return {
    total: partners.length,
    active,
    pipeline_mad: pipelineMad,
    forecast_mad: forecastMad,
    high_value: partners.filter(p => num(p.value_mad) >= 300000).length,
    risk: partners.filter(p => ["risk", "recovery", "lost", "inactive"].includes(text(p.status).toLowerCase()) || num(p.health_score, 64) < 45).length,
    referral_potential: Math.round(partners.reduce((sum, p) => sum + num(p.referral_potential), 0) / Math.max(1, partners.length)),
    synced_prospects: partners.filter(p => p.source === "prospect").length,
  }
}

async function payload(supabase: SupabaseClient) {
  const partners = await readPartners(supabase)
  const activities = await readActivities(supabase)
  return { ok: true, partners, activities, metrics: metrics(partners), sync: { live: true, source: "revenue_partnerships" } }
}

async function logActivity(supabase: SupabaseClient, partnerId: string, action: string, note: string, body: Row = {}) {
  await tolerantInsert(supabase, "revenue_partnership_activities", {
    partner_id: partnerId && !partnerId.startsWith("prospect-") ? partnerId : null,
    title: action.replaceAll("_", " "),
    action,
    note,
    payload: body,
    created_at: now(),
  })
  await tolerantInsert(supabase, "revenue_command_action_logs", {
    action_type: `partnership_enterprise_${action}`,
    entity_type: "partnership",
    entity_id: partnerId && !partnerId.startsWith("prospect-") ? partnerId : null,
    payload: body,
    result: { partnerId },
    created_at: now(),
  })
}

export async function GET() {
  try {
    const supabase = await createClient()
    return ok(await payload(supabase))
  } catch (error) {
    return ok({ ok: false, partners: [], activities: [], metrics: metrics([]), sync: { live: false, source: "revenue_partnerships", warning: jsonError(error) }, error: jsonError(error) }, 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => ({})) as Row
    const action = text(body.action, "save").toLowerCase()
    const incoming = obj(body.payload, {})
    const partnerId = text(body.partnerId || incoming.partnerId || incoming.id, "")

    if (["delete", "remove"].includes(action)) {
      if (partnerId && !partnerId.startsWith("prospect-")) await supabase.from("revenue_partnerships").delete().eq("id", partnerId)
      await logActivity(supabase, partnerId, "delete", `Partner deleted: ${text(incoming.name, partnerId)}`, incoming)
      return ok(await payload(supabase))
    }

    const patch = { ...body, ...incoming }
    if (["qualify"].includes(action)) patch.status = "qualified"
    if (["meeting", "schedule"].includes(action)) patch.status = "meeting"
    if (["proposal"].includes(action)) patch.status = "proposal"
    if (["agreement", "contract"].includes(action)) patch.status = "agreement"
    if (["activate"].includes(action)) patch.status = "active"
    if (["referral"].includes(action)) patch.status = patch.status || "active"
    if (["risk"].includes(action)) patch.status = "risk"
    if (["note"].includes(action)) patch.notes = text(patch.note || patch.notes || patch.title, "Partner note saved.")

    const row = rowFromPayload(patch, partnerId && !partnerId.startsWith("prospect-") ? partnerId : undefined)
    const saved = await tolerantUpsert(supabase, "revenue_partnerships", row)
    await logActivity(supabase, text(saved?.id || row.id), action, `Partner saved: ${text(row.name)}`, patch)
    const fresh = await payload(supabase)
    return ok({ ...fresh, partner: partnerFromRow(saved || row, "partner") })
  } catch (error) {
    return ok({ ok: false, error: jsonError(error), partners: [], activities: [], metrics: metrics([]), sync: { live: false, source: "revenue_partnerships", warning: jsonError(error) } }, 500)
  }
}
