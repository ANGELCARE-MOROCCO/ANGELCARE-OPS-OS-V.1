import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  if (!body.objective_id || !body.objective_title) {
    return NextResponse.json({ error: "Missing objective_id or objective_title" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("market_task_chains")
    .insert({
      title: `Advisor Action: ${body.objective_title}`,
      linked_objective: body.objective_title,
      owner_name: body.owner_name || "Marketing Director",
      status: "draft",
      progress: 0,
      ai_generated: true,
      step_1: body.recommended_action || "Clarify recommended action",
      step_2: "Assign accountable owner and deadline",
      step_3: "Execute and track blocker status",
      step_4: "Close outcome and convert learning into playbook",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from("market_audit_events").insert({
    objective_id: body.objective_id,
    event_type: "advisor_task_chain_created",
    event_title: "AI advisor recommendation converted into task chain",
    event_summary: body.recommended_action || null,
    actor_name: "Market-OS",
    source_module: "AI Execution Advisor",
  })

  return NextResponse.json({ data })
}
