import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type PartnerRow = Record<string, any>
const statuses = ["target", "qualified", "meeting", "proposal", "agreement", "active", "growth", "risk", "recovery", "lost"]

function n(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function s(value: unknown, fallback = "") { return typeof value === "string" && value.trim() ? value.trim() : fallback }
function mapProspectToPartner(row: PartnerRow): PartnerRow {
  const stage = s(row.stage || row.status, "target").toLowerCase()
  const mapped = stage.includes("proposal") ? "proposal" : stage.includes("negoti") ? "agreement" : stage.includes("qualified") ? "qualified" : stage.includes("appointment") ? "meeting" : "target"
  return {
    id: `prospect-${row.id}`,
    name: s(row.company || row.name || row.title, "Unnamed prospect"),
    organization: s(row.company || row.name || row.title, "Prospect account"),
    city: s(row.city, "Rabat"),
    kind: "preschool",
    status: mapped,
    owner: s(row.owner || row.assignee, "BD Officer"),
    contact_name: s(row.decision_maker || row.contact_name, ""),
    phone: s(row.phone || row.whatsapp, ""),
    email: s(row.email, ""),
    value_mad: n(row.value_mad || row.pipeline_value || row.value, 0),
    probability: n(row.probability || row.score, 50),
    health_score: n(row.score, 70),
    referral_potential: n(row.referral_potential, 50),
    next_action: s(row.next_action || row.notes, "Qualify B2B partnership potential."),
    context: s(row.notes || row.context, "Synced from revenue prospects source of truth."),
    source_prospect_id: row.id,
    last_activity: row.updated_at || row.created_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
function compute(partners: PartnerRow[], prospectsCount: number) {
  const pipeline = partners.reduce((sum, p) => sum + n(p.value_mad), 0)
  return {
    total: partners.length,
    active: partners.filter(p => ["active", "growth"].includes(s(p.status))).length,
    pipeline_mad: pipeline,
    forecast_mad: partners.reduce((sum, p) => sum + n(p.value_mad) * (n(p.probability, 0) / 100), 0),
    high_value: partners.filter(p => n(p.value_mad) >= 100000 || n(p.referral_potential) >= 75).length,
    risk: partners.filter(p => ["risk", "recovery", "lost"].includes(s(p.status)) || n(p.health_score, 100) < 45).length,
    referral_potential: partners.length ? Math.round(partners.reduce((sum, p) => sum + n(p.referral_potential), 0) / partners.length) : 0,
    synced_prospects: prospectsCount,
  }
}
async function readData() {
  const supabase = await createClient()
  let partners: PartnerRow[] = []
  let activities: PartnerRow[] = []
  let live = true
  let warning = ""
  const partnerRes = await supabase.from("revenue_partnerships").select("*").order("updated_at", { ascending: false }).limit(300)
  if (!partnerRes.error && partnerRes.data) partners = partnerRes.data
  else { live = false; warning = partnerRes.error?.message || "revenue_partnerships not available" }
  const prospectRes = await supabase.from("revenue_prospects").select("*").order("updated_at", { ascending: false }).limit(300)
  const prospectPartners = !prospectRes.error && prospectRes.data ? prospectRes.data.map(mapProspectToPartner) : []
  const existingSources = new Set(partners.map(p => String(p.source_prospect_id || "")))
  for (const p of prospectPartners) if (!existingSources.has(String(p.source_prospect_id))) partners.push(p)
  const activityRes = await supabase.from("revenue_partnership_activities").select("*").order("created_at", { ascending: false }).limit(50)
  if (!activityRes.error && activityRes.data) activities = activityRes.data
  return { partners, activities, metrics: compute(partners, prospectPartners.length), sync: { live, source: "revenue_partnerships + revenue_prospects", warning } }
}
export async function GET() {
  try { return NextResponse.json({ ok: true, ...(await readData()) }) }
  catch (error) { return NextResponse.json({ ok: false, partners: [], activities: [], metrics: compute([], 0), sync: { live: false, source: "Supabase", warning: error instanceof Error ? error.message : String(error) } }, { status: 200 }) }
}
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json().catch(() => ({}))
    const action = s(body.action, "note")
    const partnerId = s(body.partnerId, "")
    const payload = (body.payload || {}) as Record<string, any>
    if (action === "create") {
      const insert = {
        name: s(payload.name, "New AngelCare partnership"), organization: s(payload.organization || payload.name, "B2B Partner"), city: s(payload.city, "Rabat"), kind: s(payload.kind, "preschool"), status: "target",
        owner: s(payload.owner, "BD Officer"), contact_name: s(payload.contact_name, ""), phone: s(payload.phone, ""), email: s(payload.email, ""), value_mad: n(payload.value_mad, 0), probability: 35, health_score: 70, referral_potential: 50, context: s(payload.context, ""), next_action: "Qualify partnership and confirm decision maker."
      }
      const { error } = await supabase.from("revenue_partnerships").insert(insert)
      if (error) throw error
    } else if (partnerId && !partnerId.startsWith("prospect-")) {
      const statusMap: Record<string, string> = { qualify: "qualified", meeting: "meeting", proposal: "proposal", agreement: "agreement", activate: "active", referral: "growth", risk: "risk", recovery: "recovery" }
      const update: Record<string, any> = { updated_at: new Date().toISOString() }
      if (statusMap[action]) update.status = statusMap[action]
      if (payload.owner) update.owner = payload.owner
      if (payload.note) update.next_action = payload.note
      const { error } = await supabase.from("revenue_partnerships").update(update).eq("id", partnerId)
      if (error) throw error
    }
    await supabase.from("revenue_partnership_activities").insert({ partner_id: partnerId && !partnerId.startsWith("prospect-") ? partnerId : null, action, title: s(payload.title, `${action} saved`), note: s(payload.note, "Partnership action synced live."), created_at: new Date().toISOString() })
    return NextResponse.json({ ok: true, ...(await readData()) })
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 }) }
}
