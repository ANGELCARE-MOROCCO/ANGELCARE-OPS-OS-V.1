import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const objectiveId = searchParams.get("objective_id")
  const supabase = await createClient()

  let query = supabase
    .from("market_audit_events")
    .select("*")
    .order("created_at", { ascending: false })

  if (objectiveId) query = query.eq("objective_id", objectiveId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("market_audit_events")
    .insert({
      objective_id: body.objective_id || null,
      event_type: body.event_type,
      event_title: body.event_title,
      event_summary: body.event_summary || null,
      actor_name: body.actor_name || "System",
      source_module: body.source_module || "Strategy Growth Control Room",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
