import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  if (!body.objective_title) {
    return NextResponse.json({ error: "Missing objective_title" }, { status: 400 })
  }

  const generatedTitle = `Execute: ${body.objective_title}`
  const generatedSteps = [
    `Clarify strategic output for: ${body.objective_title}`,
    "Assign owner and execution deadline",
    "Create measurable KPI and proof of completion",
    "Review outcome and close with lesson learned",
  ]

  const { data, error } = await supabase
    .from("market_task_chains")
    .insert({
      title: generatedTitle,
      linked_objective: body.objective_title,
      owner_name: body.owner_name || "Marketing Director",
      status: "draft",
      progress: 0,
      ai_generated: true,
      step_1: generatedSteps[0],
      step_2: generatedSteps[1],
      step_3: generatedSteps[2],
      step_4: generatedSteps[3],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
