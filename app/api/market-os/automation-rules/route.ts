import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("market_automation_rules")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("market_automation_rules")
    .insert({
      rule_name: body.rule_name,
      condition_key: body.condition_key,
      condition_operator: body.condition_operator,
      condition_value: body.condition_value,
      action_type: body.action_type,
      action_value: body.action_value,
      is_active: body.is_active ?? true,
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
    .from("market_automation_rules")
    .update({
      rule_name: body.rule_name,
      condition_key: body.condition_key,
      condition_operator: body.condition_operator,
      condition_value: body.condition_value,
      action_type: body.action_type,
      action_value: body.action_value,
      is_active: body.is_active,
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
  const { error } = await supabase.from("market_automation_rules").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
