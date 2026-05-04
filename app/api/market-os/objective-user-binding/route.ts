import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  if (!body.objective_id) {
    return NextResponse.json({ error: "Missing objective_id" }, { status: 400 })
  }

  if (!body.owner_id) {
    return NextResponse.json({ error: "Missing owner_id" }, { status: 400 })
  }

  const { data: user, error: userError } = await supabase
    .from("market_users")
    .select("id, name, role, is_active")
    .eq("id", body.owner_id)
    .single()

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })
  if (!user?.is_active) return NextResponse.json({ error: "User is inactive" }, { status: 400 })

  const { data, error } = await supabase
    .from("market_strategy_objectives")
    .update({
      owner_id: user.id,
      owner_name: user.name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.objective_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from("market_audit_events").insert({
    objective_id: body.objective_id,
    event_type: "owner_bound",
    event_title: `Objective owner bound to ${user.name}`,
    actor_name: "Market-OS",
    source_module: "User Management",
  })

  return NextResponse.json({ data })
}
