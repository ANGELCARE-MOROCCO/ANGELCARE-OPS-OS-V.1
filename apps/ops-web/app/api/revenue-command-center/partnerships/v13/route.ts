import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  applyPartnershipActionV13,
  defaultPartnershipStoreV13,
  seedAutomationsV13,
  type AgreementStatus,
  type PartnerHealth,
  type PartnerPriority,
  type PartnerRecordV13,
  type PartnerStage,
  type PartnerType,
  type PartnershipActionKey,
  type PartnershipStoreV13,
} from "@/lib/revenue-command-center/partnerships-v13"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Row = Record<string, any>

type SupabaseClientLike = Awaited<ReturnType<typeof createClient>>

function json(body: unknown, status = 200) { return NextResponse.json(body, { status }) }
function message(error: unknown) { return error instanceof Error ? error.message : String(error || "Unknown V13 partnership error") }
function s(value: unknown, fallback = "") { const text = typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); return text || fallback }
function n(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function arr(value: unknown): string[] { return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [] }
function nowIso() { return new Date().toISOString() }

function stageToStatus(stage: PartnerStage | string | undefined) {
  const v = s(stage, "identified")
  if (["identified", "qualified", "decision_map"].includes(v)) return "target"
  if (["meeting_scheduled"].includes(v)) return "meeting"
  if (["proposal_sent"].includes(v)) return "proposal"
  if (["negotiation", "pilot"].includes(v)) return "agreement"
  if (["active", "growth"].includes(v)) return v
  if (["at_risk"].includes(v)) return "risk"
  if (["paused"].includes(v)) return "inactive"
  if (["lost"].includes(v)) return "lost"
  return v
}

function statusToStage(status: unknown): PartnerStage {
  const v = s(status, "target").toLowerCase()
  if (["active"].includes(v)) return "active"
  if (["growth"].includes(v)) return "growth"
  if (["proposal", "proposal_sent"].includes(v)) return "proposal_sent"
  if (["agreement", "contract", "contracting", "negotiation"].includes(v)) return "negotiation"
  if (["meeting", "meeting_scheduled", "appointment"].includes(v)) return "meeting_scheduled"
  if (["qualified", "qualification"].includes(v)) return "qualified"
  if (["risk", "at_risk", "recovery"].includes(v)) return "at_risk"
  if (["paused", "inactive"].includes(v)) return "paused"
  if (["lost", "closed_lost"].includes(v)) return "lost"
  return "identified"
}

function healthToScore(health: PartnerHealth | string | undefined) {
  const v = s(health, "good")
  if (v === "excellent") return 92
  if (v === "good") return 76
  if (v === "watch") return 55
  if (v === "risk") return 30
  return 15
}

function scoreToHealth(score: unknown): PartnerHealth {
  const value = n(score, 70)
  if (value >= 85) return "excellent"
  if (value >= 65) return "good"
  if (value >= 45) return "watch"
  if (value >= 20) return "risk"
  return "inactive"
}

function kindToType(kind: unknown): PartnerType {
  const value = s(kind, "institution").toLowerCase()
  if (value.includes("clinic") || value.includes("matern")) return "clinic"
  if (value.includes("hospital")) return "hospital"
  if (value.includes("pharmacy")) return "pharmacy"
  if (value.includes("corporate")) return "corporate"
  if (value.includes("academy") || value.includes("training")) return "academy"
  if (value.includes("school") || value.includes("preschool") || value.includes("kindergarten")) return "school"
  if (value.includes("ngo") || value.includes("association")) return "ngo"
  if (value.includes("ambassador")) return "ambassador"
  if (value.includes("supplier")) return "supplier"
  if (value.includes("media")) return "media"
  return "institution"
}

function typeToKind(type: unknown) {
  const value = s(type, "institution")
  if (value === "school") return "preschool"
  if (value === "clinic") return "maternity"
  return value
}

function agreementFromRow(row: Row): AgreementStatus {
  const v = s(row.contract_status || row.agreement_status, "none") as AgreementStatus
  return ["none", "drafting", "sent", "under_review", "signed", "renewal", "terminated"].includes(v) ? v : "none"
}

function rowToPartner(row: Row): PartnerRecordV13 {
  const raw = row.raw && typeof row.raw === "object" ? row.raw : {}
  const data = row.data && typeof row.data === "object" ? row.data : {}
  const merged: Row = { ...raw, ...data, ...row }
  const createdAt = s(merged.created_at || merged.createdAt, nowIso())
  const updatedAt = s(merged.updated_at || merged.updatedAt, createdAt)
  const type = kindToType(merged.kind || merged.type)
  const stage = statusToStage(merged.status || merged.stage)
  const health = scoreToHealth(merged.health_score ?? merged.activationScore)
  const valueMad = n(merged.value_mad ?? merged.valueMad ?? merged.contract_value_mad, 0)
  const referralPotential = n(merged.referral_potential ?? merged.referralPotential, 50)
  const strategicFit = n(merged.strategic_fit ?? merged.strategicFit, Math.max(50, referralPotential))
  const activationScore = n(merged.health_score ?? merged.activationScore, healthToScore(health))
  const trustScore = n(merged.trust_score ?? merged.trustScore, activationScore)
  return {
    id: s(merged.id),
    name: s(merged.name || merged.title || merged.organization, "Unnamed partnership"),
    organization: s(merged.organization || merged.company || merged.name, "Unnamed organization"),
    contactName: s(merged.contactName || merged.contact_name || merged.decision_maker, ""),
    role: s(merged.role, "Decision maker"),
    phone: s(merged.phone || merged.whatsapp, ""),
    email: s(merged.email, ""),
    city: s(merged.city || merged.location, "Rabat"),
    address: s(merged.address || merged.location, ""),
    type,
    stage,
    priority: (s(merged.priority, valueMad >= 300000 ? "critical" : valueMad >= 150000 ? "high" : "medium") as PartnerPriority),
    health,
    agreementStatus: agreementFromRow(merged),
    owner: s(merged.owner || merged.assignee, "BD Officer"),
    executiveSponsor: s(merged.executiveSponsor || merged.executive_sponsor, "Revenue Manager"),
    valueMad,
    referralPotential,
    strategicFit,
    activationScore,
    trustScore,
    decisionMaker: s(merged.decisionMaker || merged.decision_maker || merged.contact_name, ""),
    decisionMakerConfirmed: Boolean(merged.decisionMakerConfirmed ?? merged.decision_maker_confirmed ?? merged.contact_name),
    stakeholders: arr(merged.stakeholders),
    partnershipContext: s(merged.partnershipContext || merged.context || merged.notes || merged.description, ""),
    partnerNeeds: s(merged.partnerNeeds || merged.partner_needs, ""),
    angelcareValue: s(merged.angelcareValue || merged.angelcare_value, ""),
    offerStructure: s(merged.offerStructure || merged.offer_structure, ""),
    referralFlow: s(merged.referralFlow || merged.referral_flow, ""),
    activationPlan: s(merged.activationPlan || merged.activation_plan, ""),
    meetingObjective: s(merged.meetingObjective || merged.meeting_objective, ""),
    nextAction: s(merged.nextAction || merged.next_action, "Review next partnership action."),
    nextReviewDate: s(merged.nextReviewDate || merged.next_review_date, ""),
    blockers: s(merged.blockers, ""),
    risks: s(merged.risks, ""),
    obligations: s(merged.obligations, ""),
    documents: arr(merged.documents),
    referralsThisMonth: n(merged.referralsThisMonth || merged.referrals_this_month, 0),
    revenueThisMonth: n(merged.revenueThisMonth || merged.revenue_this_month, 0),
    createdAt,
    updatedAt,
  }
}

function partnerToRow(partner: PartnerRecordV13): Row {
  const rich = { ...partner }
  return {
    id: partner.id,
    name: partner.name,
    organization: partner.organization,
    city: partner.city,
    kind: typeToKind(partner.type),
    category: partner.type === "clinic" || partner.type === "hospital" || partner.type === "pharmacy" ? "Healthcare" : partner.type === "corporate" ? "Corporate" : "Network",
    status: stageToStatus(partner.stage),
    owner: partner.owner,
    contact_name: partner.contactName,
    phone: partner.phone,
    email: partner.email,
    value_mad: partner.valueMad,
    probability: partner.strategicFit,
    health_score: partner.activationScore,
    referral_potential: partner.referralPotential,
    context: partner.partnershipContext,
    next_action: partner.nextAction,
    contract_status: partner.agreementStatus,
    contract_value_mad: partner.valueMad,
    programs: [],
    program_details: [],
    offer_parameters: partner.offerStructure ? [{ title: "V13 offer structure", body: partner.offerStructure }] : [],
    pricing_parameters: {},
    management_controls: {
      executiveSponsor: partner.executiveSponsor,
      activationPlan: partner.activationPlan,
      referralFlow: partner.referralFlow,
      partnerNeeds: partner.partnerNeeds,
      angelcareValue: partner.angelcareValue,
      meetingObjective: partner.meetingObjective,
      blockers: partner.blockers,
      risks: partner.risks,
      obligations: partner.obligations,
      trustScore: partner.trustScore,
      referralsThisMonth: partner.referralsThisMonth,
      revenueThisMonth: partner.revenueThisMonth,
    },
    documents: partner.documents || [],
    notes: partner.partnerNeeds || partner.angelcareValue || partner.nextAction,
    tags: [`v13:${partner.type}`, `stage:${partner.stage}`, `health:${partner.health}`],
    partner_contacts: partner.contactName ? [{ name: partner.contactName, role: partner.role, phone: partner.phone, email: partner.email, primary: true }] : [],
    activity_log: [],
    raw: rich,
    updated_at: partner.updatedAt || nowIso(),
  }
}


function normalizePartnerInput(input: Row, fallbackId?: string): PartnerRecordV13 {
  const id = s(input.id || input.partnerId || fallbackId, `partner-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const now = nowIso()
  return rowToPartner({
    ...input,
    id,
    name: input.name || input.partnerName || input.organization || input.company || "Unnamed partnership",
    organization: input.organization || input.company || input.name || input.partnerName || "Unnamed organization",
    contact_name: input.contactName || input.contact_name || input.decisionMaker || input.decision_maker || "",
    kind: input.kind || input.type || input.category || "institution",
    status: input.status || input.stage || "target",
    value_mad: input.valueMad ?? input.value_mad ?? input.value ?? input.contract_value_mad ?? 0,
    health_score: input.activationScore ?? input.health_score ?? input.score ?? 70,
    referral_potential: input.referralPotential ?? input.referral_potential ?? 50,
    context: input.partnershipContext || input.context || input.notes || "",
    next_action: input.nextAction || input.next_action || "Review next partnership action.",
    raw: input,
    created_at: input.createdAt || input.created_at || now,
    updated_at: now,
  })
}

function isDirectPartnerCreate(action: string, payload: Row, body: Row) {
  const normalized = action.toLowerCase()
  return ["create", "add", "add_partner", "create_partner", "upsert", "save", "update"].includes(normalized)
    && Boolean(payload.name || payload.organization || payload.company || body.name || body.organization || body.company || body.partnerName)
}

async function tolerantUpsert(supabase: SupabaseClientLike, table: string, row: Row, conflict = "id") {
  let attempt = { ...row }
  for (let index = 0; index < 20; index += 1) {
    const { data, error } = await supabase.from(table).upsert(attempt, { onConflict: conflict }).select("*").single()
    if (!error) return data
    const missing = (error.message || "").match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:of relation\s+"?[a-zA-Z0-9_]+"?\s+)?does not exist/i)?.[1]
    if (missing && attempt[missing] !== undefined) {
      const { [missing]: _drop, ...rest } = attempt
      attempt = rest
      continue
    }
    throw error
  }
  throw new Error(`Could not upsert ${table}`)
}

async function tolerantInsert(supabase: SupabaseClientLike, table: string, row: Row) {
  let attempt = { ...row }
  for (let index = 0; index < 20; index += 1) {
    const { error } = await supabase.from(table).insert(attempt)
    if (!error) return
    const missing = (error.message || "").match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:of relation\s+"?[a-zA-Z0-9_]+"?\s+)?does not exist/i)?.[1]
    if (missing && attempt[missing] !== undefined) {
      const { [missing]: _drop, ...rest } = attempt
      attempt = rest
      continue
    }
    return
  }
}

async function readStore(supabase: SupabaseClientLike, seedIfEmpty = true): Promise<PartnershipStoreV13> {
  const { data, error } = await supabase.from("revenue_partnerships").select("*").order("updated_at", { ascending: false }).limit(500)
  if (error) throw error

  if ((!data || data.length === 0) && seedIfEmpty) {
    const seed = defaultPartnershipStoreV13()
    for (const partner of seed.partners) await tolerantUpsert(supabase, "revenue_partnerships", partnerToRow(partner)).catch(() => undefined)
    for (const log of seed.logs) await tolerantInsert(supabase, "revenue_partnership_activities", { partner_id: null, action: log.action, title: log.action, note: log.note, payload: log.payload || {}, created_at: log.at }).catch(() => undefined)
    return readStore(supabase, false)
  }

  const activity = await supabase.from("revenue_partnership_activities").select("*").order("created_at", { ascending: false }).limit(200)
  const partners = (data || []).map(rowToPartner).filter((partner) => partner.id)
  const logs = (activity.data || []).map((row: Row) => ({
    id: s(row.id, `${row.partner_id || "system"}-${row.created_at || Date.now()}`),
    partnerId: s(row.partner_id, "system"),
    at: s(row.created_at, nowIso()),
    action: s(row.action || row.title, "activity"),
    note: s(row.note || row.title, "Partnership activity synced."),
    payload: row.payload || {},
  }))
  return { partners, logs, automations: seedAutomationsV13() }
}

async function logPartnershipActivity(supabase: SupabaseClientLike, action: string, partnerId: string, note: string, payload: Row = {}) {
  await tolerantInsert(supabase, "revenue_partnership_activities", {
    partner_id: partnerId && partnerId !== "system" && partnerId !== "new" ? partnerId : null,
    action,
    title: action.replaceAll("_", " "),
    note,
    payload,
    created_at: nowIso(),
  }).catch(() => undefined)
  await tolerantInsert(supabase, "revenue_command_action_logs", {
    action_type: `partnership_v13_${action}`,
    entity_type: "partnership",
    entity_id: partnerId && partnerId !== "system" && partnerId !== "new" ? partnerId : null,
    payload,
    result: { partnerId, source: "revenue_partnerships" },
    created_at: nowIso(),
  }).catch(() => undefined)
}

export async function GET() {
  try {
    const supabase = await createClient()
    const data = await readStore(supabase)
    return json({ ok: true, data, source: "revenue_partnerships" })
  } catch (error) {
    return json({ ok: false, error: message(error), data: defaultPartnershipStoreV13(), source: "fallback_seed_readonly" }, 200)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json().catch(() => ({}))
    const action = s(body.action, "update") as PartnershipActionKey
    const partnerId = s(body.partnerId || body.id, "system")
    const payload = body.payload && typeof body.payload === "object" ? (body.payload as Row) : {}

    if (isDirectPartnerCreate(action, payload, body)) {
      const directPartner = normalizePartnerInput({ ...body, ...payload }, partnerId !== "system" ? partnerId : undefined)
      await tolerantUpsert(supabase, "revenue_partnerships", partnerToRow(directPartner))
      await logPartnershipActivity(supabase, action, directPartner.id, `Partner saved: ${directPartner.name}`, { partnerId: directPartner.id, payload })
      const fresh = await readStore(supabase, false)
      return json({ ok: true, action, partnerId: directPartner.id, partner: directPartner, data: fresh, source: "revenue_partnerships" })
    }

    const current = await readStore(supabase)
    const next = applyPartnershipActionV13(current, action, partnerId, payload)
    const beforeIds = new Set(current.partners.map((partner) => partner.id))
    const afterIds = new Set(next.partners.map((partner) => partner.id))

    for (const partner of next.partners) {
      const previous = current.partners.find((item) => item.id === partner.id)
      if (!previous || JSON.stringify(previous) !== JSON.stringify(partner)) {
        await tolerantUpsert(supabase, "revenue_partnerships", partnerToRow(partner))
      }
    }

    for (const oldId of beforeIds) {
      if (!afterIds.has(oldId)) {
        const { error } = await supabase.from("revenue_partnerships").delete().eq("id", oldId)
        if (error) await supabase.from("revenue_partnerships").update({ status: "lost", updated_at: nowIso() }).eq("id", oldId)
      }
    }

    const changed = next.partners.find((partner) => !current.partners.find((old) => old.id === partner.id && JSON.stringify(old) === JSON.stringify(partner)))
    await logPartnershipActivity(supabase, action, changed?.id || partnerId, changed?.nextAction || changed?.name || action, { partnerId, payload })
    const fresh = await readStore(supabase, false)
    return json({ ok: true, action, partnerId, data: fresh, source: "revenue_partnerships" })
  } catch (error) {
    return json({ ok: false, error: message(error) }, 500)
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from("revenue_partnerships").select("id").limit(1000)
    const ids = (data || []).map((row: Row) => row.id).filter(Boolean)
    if (ids.length) await supabase.from("revenue_partnerships").delete().in("id", ids)
    const seed = defaultPartnershipStoreV13()
    for (const partner of seed.partners) await tolerantUpsert(supabase, "revenue_partnerships", partnerToRow(partner))
    await logPartnershipActivity(supabase, "restore_seed", "system", "V13 Supabase seed restored", {})
    return json({ ok: true, data: await readStore(supabase, false), source: "revenue_partnerships" })
  } catch (error) {
    return json({ ok: false, error: message(error) }, 500)
  }
}
