import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const objectiveId = searchParams.get("objective_id")
  const supabase = await createClient()

  let query = supabase
    .from("market_execution_notes")
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
    .from("market_execution_notes")
    .insert({
      objective_id: body.objective_id,
      step_id: body.step_id || null,
      note_type: body.note_type || "note",
      severity: body.severity || "medium",
      title: body.title,
      body: body.body,
      owner_name: body.owner_name,
      status: body.status || "open",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("market_execution_notes")
    .update({
      status: body.status,
      severity: body.severity,
      owner_name: body.owner_name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from("market_execution_notes").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
