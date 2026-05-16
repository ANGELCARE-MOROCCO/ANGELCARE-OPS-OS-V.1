import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("revenue_prospects")
    .select("id,name,city,stage,priority,value_mad,score,updated_at")
    .order("updated_at", { ascending: false })
    .limit(25)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, sample: data || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const prospects = Array.isArray(body?.prospects) ? body.prospects : []

  if (!prospects.length) {
    return NextResponse.json({ ok: false, error: "No prospects provided" }, { status: 400 })
  }

  const rows = prospects.map((p: any) => ({
    id: String(p.id),
    name: String(p.name || p.company || "Unnamed prospect"),
    city: String(p.city || "Unassigned"),
    stage: String(p.stage || "new_lead"),
    priority: String(p.priority || "medium"),
    value_mad: Number(p.valueMad || 0),
    score: Number(p.score || 0),
    data: p,
  }))

  const { data, error } = await supabase
    .from("revenue_prospects")
    .upsert(rows, { onConflict: "id" })
    .select("id")

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, count: data?.length || 0 })
}
