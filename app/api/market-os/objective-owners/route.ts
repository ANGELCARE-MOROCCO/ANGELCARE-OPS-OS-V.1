import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const objectiveId = searchParams.get("objective_id")
  const supabase = await createClient()

  let query = supabase
    .from("market_objective_owners")
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
    .from("market_objective_owners")
    .insert({
      objective_id: body.objective_id,
      owner_name: body.owner_name,
      role: body.role || "executor",
      authority: body.authority || "execute",
      responsibility: body.responsibility || null,
      status: body.status || "active",
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
    .from("market_objective_owners")
    .update({
      owner_name: body.owner_name,
      role: body.role,
      authority: body.authority,
      responsibility: body.responsibility,
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
  const { error } = await supabase.from("market_objective_owners").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
