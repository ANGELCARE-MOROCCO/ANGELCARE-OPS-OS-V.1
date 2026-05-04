import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function evaluate(conditionKey: string, operator: string, value: any, objective: any) {
  const field = objective[conditionKey]

  if (operator === "equals") return field == value
  if (operator === "not_equals") return field != value
  if (operator === "is_null") return !field
  if (operator === "less_than") return Number(field) < Number(value)

  return false
}

function priorityWeight(priority: string) {
  if (priority === "P0") return 4
  if (priority === "P1") return 3
  if (priority === "P2") return 2
  return 1
}

async function wasRecentlyExecuted(supabase: any, dedupeKey: string) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()

  const { data } = await supabase
    .from("market_automation_logs")
    .select("id")
    .eq("dedupe_key", dedupeKey)
    .gte("created_at", since)
    .limit(1)

  return Boolean(data && data.length > 0)
}

async function logAutomation(
  supabase: any,
  action: string,
  objectiveId: string | null,
  ruleKey: string
) {
  const dedupeKey = `${ruleKey}:${objectiveId || "global"}`

  await supabase.from("market_automation_logs").insert({
    action,
    objective_id: objectiveId,
    rule_key: ruleKey,
    dedupe_key: dedupeKey,
  })
}

export async function POST() {
  const supabase = await createClient()

  const { data: settings, error: settingsError } = await supabase
    .from("market_automation_settings")
    .select("*")

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 })
  }

  const settingMap = new Map((settings || []).map((setting: any) => [setting.key, setting.value]))
  const automationEnabled = settingMap.get("automation_enabled") !== "false"
  const maxActionsPerRun = Number(settingMap.get("max_actions_per_run") || 10)

  if (!automationEnabled) {
    return NextResponse.json({
      message: "Automation is disabled by emergency stop",
      actions: [],
      skipped: ["Emergency stop is active"],
    })
  }

  const { data: objectives, error: objectivesError } = await supabase
    .from("market_strategy_objectives")
    .select("*")

  if (objectivesError) {
    return NextResponse.json({ error: objectivesError.message }, { status: 500 })
  }

  const { data: rules, error: rulesError } = await supabase
    .from("market_automation_rules")
    .select("*")
    .eq("is_active", true)

  if (rulesError) {
    return NextResponse.json({ error: rulesError.message }, { status: 500 })
  }

  const sortedObjectives = [...(objectives || [])].sort(
    (a, b) => priorityWeight(b.priority) - priorityWeight(a.priority)
  )

  const actions: string[] = []
  const skipped: string[] = []
  let actionCount = 0

  for (const objective of sortedObjectives) {
    for (const rule of rules || []) {
      if (actionCount >= maxActionsPerRun) {
        skipped.push(`Action limit reached: ${maxActionsPerRun}`)

        return NextResponse.json({
          message: "Safe dynamic automation executed with action limit",
          actions,
          skipped,
        })
      }

      const ruleKey = rule.rule_name || rule.id
      const dedupeKey = `${ruleKey}:${objective.id}`

      const match = evaluate(
        rule.condition_key,
        rule.condition_operator,
        rule.condition_value,
        objective
      )

      if (!match) continue

      const recentlyDone = await wasRecentlyExecuted(supabase, dedupeKey)

      if (recentlyDone) {
        skipped.push(`Skipped duplicate rule ${rule.rule_name} on ${objective.title}`)
        continue
      }

      if (rule.action_type === "set_next_action") {
        await supabase
          .from("market_strategy_objectives")
          .update({ next_action: rule.action_value })
          .eq("id", objective.id)

        const action = `Rule ${rule.rule_name} → next_action on ${objective.title}`

        await logAutomation(supabase, action, objective.id, ruleKey)
        actions.push(action)
        actionCount++
      }

      if (rule.action_type === "assign_owner") {
        await supabase.from("market_objective_owners").insert({
          objective_id: objective.id,
          owner_name: rule.action_value,
          role: "manager",
          authority: "manage",
          status: "active",
        })

        await supabase
          .from("market_strategy_objectives")
          .update({ owner_name: rule.action_value })
          .eq("id", objective.id)

        const action = `Rule ${rule.rule_name} → owner assigned on ${objective.title}`

        await logAutomation(supabase, action, objective.id, ruleKey)
        actions.push(action)
        actionCount++
      }
    }
  }

  return NextResponse.json({
    message: "Final hardened automation executed",
    actions,
    skipped,
  })
}