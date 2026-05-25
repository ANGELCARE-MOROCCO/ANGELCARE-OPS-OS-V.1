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
  const { data, error } = await supabase.from("revenue_partnerships").select("*").limit(500)
  if (error) return NextResponse.json({ ok: false, live: true, records: [], error: error.message })
  return NextResponse.json({ ok: true, live: true, records: data || [] })
}
