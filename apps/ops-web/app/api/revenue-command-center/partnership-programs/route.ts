import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET() {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ ok: false, live: false, records: [], error: "Supabase env missing" })
  const { data, error } = await supabase.from("revenue_partnership_programs").select("*").order("updated_at", { ascending: false })
  if (error) return NextResponse.json({ ok: false, live: true, records: [], error: error.message })
  return NextResponse.json({ ok: true, live: true, records: data || [] })
}

export async function POST(req: Request) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase env missing" }, { status: 500 })
  const body = await req.json()
  const payload = {
    name: body.name || "Untitled partnership program",
    subtitle: body.subtitle || null,
    partner_type: body.partner_type || "Preschools & Kindergarten",
    status: body.status || "Active",
    partners: Number(body.partners || 0),
    revenue_impact: Number(body.revenue_impact || 0),
    engagement: Number(body.engagement || 0),
    city: body.city || null,
    owner: body.owner || null,
    stage: body.stage || "Active",
    offers: body.offers || [],
    pricing_rules: body.pricing_rules || body.pricingRules || [],
    contract_terms: body.contract_terms || body.contractTerms || [],
    eligibility_requirements: body.eligibility_requirements || body.eligibilityRequirements || [],
    publish_review: body.publish_review || body.publishReview || {},
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from("revenue_partnership_programs").insert(payload).select("*").single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, record: data })
}

export async function PATCH(req: Request) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase env missing" }, { status: 500 })
  const body = await req.json()
  if (!body.id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
  const payload = {
    name: body.name,
    subtitle: body.subtitle,
    partner_type: body.partner_type,
    status: body.status,
    partners: body.partners,
    revenue_impact: body.revenue_impact,
    engagement: body.engagement,
    city: body.city,
    owner: body.owner,
    stage: body.stage,
    offers: body.offers || [],
    pricing_rules: body.pricing_rules || body.pricingRules || [],
    contract_terms: body.contract_terms || body.contractTerms || [],
    eligibility_requirements: body.eligibility_requirements || body.eligibilityRequirements || [],
    publish_review: body.publish_review || body.publishReview || {},
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from("revenue_partnership_programs").update(payload).eq("id", body.id).select("*").single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, record: data })
}
