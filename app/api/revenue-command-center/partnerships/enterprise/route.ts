import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Row = Record<string, any>
type SupabaseClientLike = Awaited<ReturnType<typeof createClient>>

const writablePartnerColumns = [
  "name",
  "organization",
  "city",
  "kind",
  "category",
  "status",
  "owner",
  "contact_name",
  "phone",
  "email",
  "website",
  "value_mad",
  "probability",
  "health_score",
  "referral_potential",
  "context",
  "next_action",
  "contract_status",
  "contract_value_mad",
  "payment_terms",
  "commission_rate",
  "programs",
  "program_details",
  "offer_parameters",
  "pricing_parameters",
  "management_controls",
  "type_icon",
  "documents",
  "notes",
  "tags",
  "partner_contacts",
  "linked_programs",
  "linked_contracts",
  "linked_offers",
  "transactions",
  "invoices",
  "communications",
  "team_members",
  "activity_log",
  "contract_checklist",
  "contract_checklist_done",
  "updated_at",
]

const writableProspectColumns = [
  "company",
  "name",
  "title",
  "city",
  "stage",
  "status",
  "owner",
  "assignee",
  "decision_maker",
  "contact_name",
  "phone",
  "whatsapp",
  "email",
  "website",
  "value_mad",
  "pipeline_value",
  "value",
  "probability",
  "score",
  "notes",
  "context",
  "next_action",
  "updated_at",
]

function n(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function s(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function arrayify(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[;,|]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function statusLabel(value: unknown) {
  const status = s(value, "target").toLowerCase()
  if (["active", "growth", "won", "partner"].some((x) => status.includes(x))) return "active"
  if (["proposal", "quote", "offer"].some((x) => status.includes(x))) return "proposal"
  if (["agreement", "contract", "negoti"].some((x) => status.includes(x))) return "agreement"
  if (["meeting", "appointment", "visit"].some((x) => status.includes(x))) return "meeting"
  if (["qualified", "qualify"].some((x) => status.includes(x))) return "qualified"
  if (["risk", "recovery", "lost", "inactive"].some((x) => status.includes(x))) return status.includes("inactive") ? "inactive" : status.includes("lost") ? "lost" : status.includes("recovery") ? "recovery" : "risk"
  return "target"
}

function inferKind(row: Row) {
  const text = [row.kind, row.type, row.category, row.segment, row.company, row.name, row.title, row.organization].join(" ").toLowerCase()
  if (text.includes("matern") || text.includes("clinic") || text.includes("clinique")) return "maternity"
  if (text.includes("ortho") || text.includes("speech") || text.includes("orthophon")) return "orthophoniste"
  if (text.includes("hotel") || text.includes("hôtel") || text.includes("hospitality")) return "hotel"
  if (text.includes("corporate") || text.includes("corp") || text.includes("entreprise")) return "corporate"
  if (text.includes("association") || text.includes("ngo") || text.includes("non-profit")) return "association"
  return "preschool"
}

function kindLabel(kind: unknown) {
  const normalized = s(kind, "preschool").toLowerCase()
  if (normalized.includes("maternity")) return "Maternity Clinic"
  if (normalized.includes("ortho")) return "Orthophoniste"
  if (normalized.includes("hotel")) return "Hotel"
  if (normalized.includes("corporate")) return "Corporate"
  if (normalized.includes("association")) return "Association"
  return "Preschool & Kindergarten"
}

function normalizePartner(row: Row, source: "partner" | "prospect") {
  const kind = inferKind(row)
  const value = n(row.value_mad ?? row.pipeline_value ?? row.contract_value_mad ?? row.value, 0)
  const probability = Math.min(100, Math.max(0, n(row.probability ?? row.score, source === "partner" ? 70 : 45)))
  const health = Math.min(100, Math.max(0, n(row.health_score ?? row.score, probability)))
  const status = statusLabel(row.status ?? row.stage)
  const programs = arrayify(row.programs ?? row.assigned_programs ?? row.program_names)
  const name = s(row.name ?? row.company ?? row.organization ?? row.title, source === "partner" ? "Unnamed partner" : "Unnamed prospect")

  return {
    ...row,
    id: source === "prospect" ? `prospect-${row.id}` : String(row.id),
    source,
    source_id: row.id,
    source_prospect_id: row.source_prospect_id ?? (source === "prospect" ? row.id : null),
    name,
    organization: s(row.organization ?? row.company ?? row.name ?? row.title, name),
    type: kindLabel(kind),
    kind,
    type_icon: s(row.type_icon ?? row.icon_key, arrayify(row.tags).find((tag) => tag.startsWith("icon:"))?.replace("icon:", "") || ""),
    category: s(row.category, kind === "preschool" ? "Education" : kind === "maternity" || kind === "orthophoniste" ? "Healthcare" : kind === "hotel" ? "Hospitality" : kind === "corporate" ? "Corporate" : "Network"),
    city: s(row.city ?? row.location, "Rabat"),
    district: s(row.district ?? row.neighborhood ?? row.area, ""),
    status,
    owner: s(row.owner ?? row.assignee, "BD Officer"),
    contact_name: s(row.contact_name ?? row.decision_maker ?? row.contact, ""),
    phone: s(row.phone ?? row.whatsapp, ""),
    email: s(row.email, ""),
    website: s(row.website ?? row.url, ""),
    value_mad: value,
    revenueImpact: value,
    probability,
    health_score: health,
    engagement: health,
    referral_potential: n(row.referral_potential, Math.round((health + probability) / 2)),
    programs,
    program_details: row.program_details ?? row.program_settings ?? [],
    offer_parameters: row.offer_parameters ?? [],
    pricing_parameters: row.pricing_parameters ?? {},
    management_controls: row.management_controls ?? {},
    documents: arrayify(row.documents),
    tags: arrayify(row.tags),
    partner_contacts: row.partner_contacts ?? [],
    linked_programs: row.linked_programs ?? [],
    linked_contracts: row.linked_contracts ?? [],
    linked_offers: row.linked_offers ?? [],
    transactions: row.transactions ?? [],
    invoices: row.invoices ?? [],
    communications: row.communications ?? [],
    team_members: row.team_members ?? [],
    activity_log: row.activity_log ?? [],
    contract_checklist: row.contract_checklist ?? [],
    contract_checklist_done: row.contract_checklist_done ?? [],
    joinedOn: row.created_at || row.joined_on || row.updated_at || null,
    summary: s(row.context ?? row.notes ?? row.description ?? row.next_action, source === "prospect" ? "Synced from revenue prospects source of truth." : "Live partner record from partnerships source of truth."),
    next_action: s(row.next_action, "Review next partnership step."),
    updated_at: row.updated_at,
    created_at: row.created_at,
    raw: row,
  }
}

function compute(partners: Row[], prospectsCount: number) {
  const pipeline = partners.reduce((sum, p) => sum + n(p.value_mad), 0)
  return {
    total: partners.length,
    active: partners.filter((p) => ["active", "growth"].includes(s(p.status))).length,
    pipeline_mad: pipeline,
    forecast_mad: Math.round(partners.reduce((sum, p) => sum + n(p.value_mad) * (n(p.probability, 0) / 100), 0)),
    high_value: partners.filter((p) => n(p.value_mad) >= 100000 || n(p.referral_potential) >= 75).length,
    risk: partners.filter((p) => ["risk", "recovery", "lost", "inactive"].includes(s(p.status)) || n(p.health_score, 100) < 45).length,
    referral_potential: partners.length ? Math.round(partners.reduce((sum, p) => sum + n(p.referral_potential), 0) / partners.length) : 0,
    synced_prospects: prospectsCount,
  }
}

function pickAllowed(payload: Row, allowed: string[]) {
  const out: Row = {}
  for (const column of allowed) if (payload[column] !== undefined) out[column] = payload[column]
  return out
}

async function tolerantUpdate(supabase: SupabaseClientLike, table: string, id: string, update: Row) {
  let attempt = { ...update }
  for (let index = 0; index < 8; index += 1) {
    const { error } = await supabase.from(table).update(attempt).eq("id", id)
    if (!error) return
    const message = error.message || ""
    const missing = message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:of relation\s+"?[a-zA-Z0-9_]+"?\s+)?does not exist/i)?.[1]
    if (missing && attempt[missing] !== undefined) {
      const { [missing]: _removed, ...rest } = attempt
      attempt = rest
      continue
    }
    throw error
  }
}

async function tolerantInsert(supabase: SupabaseClientLike, table: string, insert: Row) {
  let attempt = { ...insert }
  for (let index = 0; index < 10; index += 1) {
    const { error } = await supabase.from(table).insert(attempt)
    if (!error) return
    const message = error.message || ""
    const missing = message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:of relation\s+"?[a-zA-Z0-9_]+"?\s+)?does not exist/i)?.[1]
    if (missing && attempt[missing] !== undefined) {
      const { [missing]: _removed, ...rest } = attempt
      attempt = rest
      continue
    }
    throw error
  }
}

async function readData() {
  const supabase = await createClient()
  let live = true
  const warnings: string[] = []

  const partnerRes = await supabase.from("revenue_partnerships").select("*").order("updated_at", { ascending: false }).limit(300)
  if (partnerRes.error) {
    live = false
    warnings.push(partnerRes.error.message)
  }

  const prospectRes = await supabase.from("revenue_prospects").select("*").order("updated_at", { ascending: false }).limit(300)
  if (prospectRes.error) warnings.push(prospectRes.error.message)

  const partnerRows = Array.isArray(partnerRes.data) ? partnerRes.data.map((row) => normalizePartner(row, "partner")) : []
  const prospectRows = Array.isArray(prospectRes.data) ? prospectRes.data.map((row) => normalizePartner(row, "prospect")) : []

  const existingProspects = new Set(partnerRows.map((row) => String(row.source_prospect_id || "")).filter(Boolean))
  const partners = [...partnerRows, ...prospectRows.filter((row) => !existingProspects.has(String(row.source_id)))]

  const activityRes = await supabase.from("revenue_partnership_activities").select("*").order("created_at", { ascending: false }).limit(80)
  if (activityRes.error) warnings.push(activityRes.error.message)

  return {
    partners,
    activities: Array.isArray(activityRes.data) ? activityRes.data : [],
    metrics: compute(partners, prospectRows.length),
    sync: {
      live,
      source: "revenue_partnerships + revenue_prospects",
      warning: warnings.join(" | "),
      synced_at: new Date().toISOString(),
    },
  }
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...(await readData()) })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        partners: [],
        activities: [],
        metrics: compute([], 0),
        sync: { live: false, source: "Supabase", warning: error instanceof Error ? error.message : String(error), synced_at: new Date().toISOString() },
      },
      { status: 200 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json().catch(() => ({} as Row))
    const action = s(body.action, "save")
    const partnerId = s(body.partnerId, "")
    const payload = (body.payload || {}) as Row
    const source = s(body.source, partnerId.startsWith("prospect-") ? "prospect" : "partner")
    const sourceId = s(body.sourceId, partnerId.replace(/^prospect-/, ""))
    const now = new Date().toISOString()

    if (action === "create") {
      const insert = pickAllowed(
        {
          name: s(payload.name, "New AngelCare partnership"),
          organization: s(payload.organization ?? payload.name, "B2B Partner"),
          city: s(payload.city, "Rabat"),
          kind: s(payload.kind, "preschool"),
          category: s(payload.category, "Education"),
          status: statusLabel(payload.status ?? "target"),
          owner: s(payload.owner, "BD Officer"),
          contact_name: s(payload.contact_name, ""),
          phone: s(payload.phone, ""),
          email: s(payload.email, ""),
          website: s(payload.website, ""),
          value_mad: n(payload.value_mad, 0),
          probability: n(payload.probability, 35),
          health_score: n(payload.health_score, 70),
          referral_potential: n(payload.referral_potential, 50),
          context: s(payload.context ?? payload.summary, ""),
          next_action: s(payload.next_action, "Qualify partnership and confirm decision maker."),
          programs: payload.programs,
          program_details: payload.program_details,
          offer_parameters: payload.offer_parameters,
          pricing_parameters: payload.pricing_parameters,
          management_controls: payload.management_controls,
          type_icon: payload.type_icon,
          documents: payload.documents,
          notes: payload.notes,
          tags: payload.tags,
          partner_contacts: payload.partner_contacts,
          linked_programs: payload.linked_programs,
          linked_contracts: payload.linked_contracts,
          linked_offers: payload.linked_offers,
          transactions: payload.transactions,
          invoices: payload.invoices,
          communications: payload.communications,
          team_members: payload.team_members,
          activity_log: payload.activity_log,
          contract_checklist: payload.contract_checklist,
          contract_checklist_done: payload.contract_checklist_done,
          updated_at: now,
        },
        writablePartnerColumns,
      )
      await tolerantInsert(supabase, "revenue_partnerships", insert)
    } else if (partnerId || sourceId) {
      if (["delete", "archive"].includes(action) && source !== "prospect") {
        const { error } = await supabase.from("revenue_partnerships").delete().eq("id", partnerId)
        if (error) throw error
      } else {
        const normalizedStatus = statusLabel(payload.status ?? action)
        const updateCommon = {
          name: payload.name,
          organization: payload.organization ?? payload.name,
          city: payload.city,
          kind: payload.kind,
          category: payload.category,
          status: normalizedStatus,
          owner: payload.owner,
          contact_name: payload.contact_name,
          phone: payload.phone,
          email: payload.email,
          website: payload.website,
          value_mad: payload.value_mad !== undefined ? n(payload.value_mad) : undefined,
          probability: payload.probability !== undefined ? n(payload.probability) : undefined,
          health_score: payload.health_score !== undefined ? n(payload.health_score) : undefined,
          referral_potential: payload.referral_potential !== undefined ? n(payload.referral_potential) : undefined,
          context: payload.context ?? payload.summary,
          next_action: payload.next_action,
          contract_status: payload.contract_status,
          contract_value_mad: payload.contract_value_mad !== undefined ? n(payload.contract_value_mad) : undefined,
          payment_terms: payload.payment_terms,
          commission_rate: payload.commission_rate !== undefined ? n(payload.commission_rate) : undefined,
          programs: payload.programs,
          program_details: payload.program_details,
          offer_parameters: payload.offer_parameters,
          pricing_parameters: payload.pricing_parameters,
          management_controls: payload.management_controls,
          type_icon: payload.type_icon,
          documents: payload.documents,
          notes: payload.notes,
          tags: payload.tags,
          partner_contacts: payload.partner_contacts,
          linked_programs: payload.linked_programs,
          linked_contracts: payload.linked_contracts,
          linked_offers: payload.linked_offers,
          transactions: payload.transactions,
          invoices: payload.invoices,
          communications: payload.communications,
          team_members: payload.team_members,
          activity_log: payload.activity_log,
          contract_checklist: payload.contract_checklist,
          contract_checklist_done: payload.contract_checklist_done,
          updated_at: now,
        }

        if (source === "prospect") {
          const prospectUpdate = pickAllowed(
            {
              company: payload.organization ?? payload.name,
              name: payload.name,
              title: payload.name,
              city: payload.city,
              stage: normalizedStatus,
              status: normalizedStatus,
              owner: payload.owner,
              assignee: payload.owner,
              decision_maker: payload.contact_name,
              contact_name: payload.contact_name,
              phone: payload.phone,
              whatsapp: payload.phone,
              email: payload.email,
              website: payload.website,
              value_mad: payload.value_mad !== undefined ? n(payload.value_mad) : undefined,
              pipeline_value: payload.value_mad !== undefined ? n(payload.value_mad) : undefined,
              value: payload.value_mad !== undefined ? n(payload.value_mad) : undefined,
              probability: payload.probability !== undefined ? n(payload.probability) : undefined,
              score: payload.health_score !== undefined ? n(payload.health_score) : undefined,
              notes: payload.context ?? payload.summary ?? payload.notes,
              context: payload.context ?? payload.summary,
              next_action: payload.next_action,
              updated_at: now,
            },
            writableProspectColumns,
          )
          await tolerantUpdate(supabase, "revenue_prospects", sourceId, prospectUpdate)
        } else {
          await tolerantUpdate(supabase, "revenue_partnerships", partnerId, pickAllowed(updateCommon, writablePartnerColumns))
        }
      }
    }

    if (!["delete", "archive"].includes(action)) {
      await supabase.from("revenue_partnership_activities").insert({
        partner_id: source !== "prospect" && partnerId ? partnerId : null,
        action,
        title: s(payload.activity_title, action === "save" ? "Partner record updated" : `${action} saved`),
        note: s(payload.activity_note ?? payload.next_action, "Partnership management action synced live."),
        created_at: now,
      })
    }

    return NextResponse.json({ ok: true, ...(await readData()) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
