import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { action, prospectId } = body

  if (!action || !prospectId) {
    return NextResponse.json({ error: "Missing action or prospectId" }, { status: 400 })
  }

  if (action === "escalation_sweep") {
    const { data, error } = await supabase.rpc("prospect_escalation_sweep")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, inserted: data })
  }

  return NextResponse.json({ ok: true, action, prospectId })
}
