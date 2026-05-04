import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function daysUntil(deadline?: string | null) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(deadline)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

async function logAutomation(supabase: any, action: string, objectiveId?: string | null, rule?: string) {
  await supabase.from("market_automation_logs").insert({
    action,
    objective_id: objectiveId || null,
    rule_key: rule || "cron",
  })
}

export async function GET(req: Request) {
  const secret = process.env.MARKET_OS_CRON_SECRET
  const headerSecret = req.headers.get("x-market-os-cron-secret")
  const urlSecret = new URL(req.url).searchParams.get("secret")

  if (secret && headerSecret !== secret && urlSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: objectives } = await supabase
    .from("market_strategy_objectives")
    .select("*")

  const { data: notes } = await supabase
    .from("market_execution_notes")
    .select("*")

  const actions: string[] = []

  for (const o of objectives || []) {
    const days = daysUntil(o.deadline)

    if (days !== null && days < 0 && o.status !== "completed") {
      const action = `CRON: overdue escalation created for ${o.title}`

      await supabase.from("market_execution_notes").insert({
        objective_id: o.id,
        note_type: "escalation",
        severity: "critical",
        title: "Cron escalation: overdue objective",
        body: "Automation cron detected overdue objective.",
        status: "open",
      })

      await logAutomation(supabase, action, o.id, "cron_overdue_escalation")
      actions.push(action)
    }

    if (!o.next_action && o.status !== "completed") {
      const action = `CRON: next action repaired for ${o.title}`

      await supabase
        .from("market_strategy_objectives")
        .update({ next_action: "Define execution step immediately" })
        .eq("id", o.id)

      await logAutomation(supabase, action, o.id, "cron_missing_next_action")
      actions.push(action)
    }

    const blockers = notes?.filter(
      (n: any) =>
        n.objective_id === o.id &&
        n.status === "open" &&
        (n.severity === "critical" || n.severity === "high")
    )

    if (blockers && blockers.length > 0 && o.status !== "completed") {
      const action = `CRON: blocker task chain created for ${o.title}`

      await supabase.from("market_task_chains").insert({
        title: `Cron Task: Resolve blocker (${o.title})`,
        linked_objective: o.title,
        owner_name: o.owner_name || "Manager",
        status: "draft",
        progress: 0,
        ai_generated: true,
        step_1: "Review blocker context",
        step_2: "Assign accountable owner",
        step_3: "Resolve blocker and document proof",
        step_4: "Close blocker and update objective status",
      })

      await logAutomation(supabase, action, o.id, "cron_critical_blocker_task")
      actions.push(action)
    }
  }

  return NextResponse.json({
    message: "Market-OS cron automation executed",
    actions,
  })
}
