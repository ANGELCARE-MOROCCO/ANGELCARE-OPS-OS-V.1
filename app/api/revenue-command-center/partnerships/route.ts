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
  if (!supabase) return NextResponse.json({ ok: true, live: false, partners: [], programs: [] })

  const [partners, programs] = await Promise.all([
    supabase.from("revenue_partners").select("*").order("updated_at", { ascending: false }).limit(500),
    supabase.from("revenue_partnership_programs").select("*").order("updated_at", { ascending: false }).limit(500),
  ])

  return NextResponse.json({
    ok: true,
    live: true,
    partners: partners.data || [],
    programs: programs.data || [],
    errors: [partners.error?.message, programs.error?.message].filter(Boolean),
  })
}

export async function POST(req: Request) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase env missing" }, { status: 500 })

  const body = await req.json()
  const table = body.table === "programs" ? "revenue_partnership_programs" : "revenue_partners"
  const payload = { ...(body.record || {}), updated_at: new Date().toISOString() }

  const { data, error } = await supabase.from(table).upsert(payload).select("*").single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, record: data })
}
