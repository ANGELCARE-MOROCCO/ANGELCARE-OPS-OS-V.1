import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function normalizeProgramPayload(body: any) {
  return {
    name: body.name || body.title || "Untitled Partnership Program",
    subtitle: body.subtitle || body.shortDescription || body.description || null,
    partner_type: body.partner_type || body.partnerType || body.type || null,
    status: body.status || "Draft",
    partners: Number(body.partners || body.partner_count || 0),
    revenue_impact: Number(body.revenue_impact || body.revenueImpact || 0),
    engagement: Number(body.engagement || 0),
    owner: body.owner || body.launchOwner || null,
    city: body.city || body.scope || null,
    offers: body.offers || [],
    pricing_rules: body.pricing_rules || body.pricingRules || [],
    contract_terms: body.contract_terms || body.contractTerms || [],
    eligibility_requirements: body.eligibility_requirements || body.eligibilityRequirements || [],
    publish_review: body.publish_review || body.publishReview || {},
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({
      ok: true,
      live: false,
      programs: [],
      records: [],
      message: "Supabase environment variables missing.",
    })
  }

  const { data, error } = await supabase
    .from("revenue_partnership_programs")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, programs: [], records: [] }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    live: true,
    programs: data || [],
    records: data || [],
  })
}

export async function POST(request: Request) {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase environment variables missing." }, { status: 500 })
  }

  const body = await request.json()
  const payload = normalizeProgramPayload(body)

  const id = body.id || body.program_id || body.programId

  const query = id
    ? supabase.from("revenue_partnership_programs").upsert({ id, ...payload }).select("*").single()
    : supabase.from("revenue_partnership_programs").insert(payload).select("*").single()

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, live: true, program: data, record: data })
}

export async function PUT(request: Request) {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase environment variables missing." }, { status: 500 })
  }

  const body = await request.json()
  const id = body.id || body.program_id || body.programId

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing program id." }, { status: 400 })
  }

  const payload = normalizeProgramPayload(body)

  const { data, error } = await supabase
    .from("revenue_partnership_programs")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, live: true, program: data, record: data })
}

export async function DELETE(request: Request) {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase environment variables missing." }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing program id." }, { status: 400 })
  }

  const { error } = await supabase
    .from("revenue_partnership_programs")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, live: true, deleted: id })
}
