import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("market_strategy_objectives")
    .select("*")

  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("market_strategy_objectives")
    .update({
      title: body.title,
      owner_name: body.owner_name,
      priority: body.priority,
      status: body.status,
      deadline: body.deadline,
      depends_on: body.depends_on,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message })

  return NextResponse.json({ data })
}
