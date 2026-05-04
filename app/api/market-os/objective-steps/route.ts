import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const objectiveId = searchParams.get("objective_id")

  const supabase = await createClient()

  const query = supabase
    .from("market_objective_steps")
    .select("*")
    .order("created_at", { ascending: true })

  const { data, error } = objectiveId
    ? await query.eq("objective_id", objectiveId)
    : await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("market_objective_steps")
    .insert({
      objective_id: body.objective_id,
      title: body.title,
      owner_name: body.owner_name,
      status: body.status || "todo",
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
    .from("market_objective_steps")
    .update({
      title: body.title,
      owner_name: body.owner_name,
      status: body.status,
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

  const { error } = await supabase
    .from("market_objective_steps")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
