import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const TABLES = [
  "market_os_records",
  "market_os_agents",
  "market_os_kpis",
  "market_os_actions",
  "market_os_audit",
  "market_os_sessions",
  "market_action_events",
  "market_audit_events",
  "market_strategy_objectives",
  "market_task_chains",
  "market_users",
  "market_automation_rules",
]

async function tableCheck(supabase: Awaited<ReturnType<typeof createClient>>, table: string) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true })
  return { table, ok: !error, count: count ?? 0, error: error?.message || null }
}

export async function GET() {
  const supabase = await createClient()
  const checks = await Promise.all(TABLES.map((table) => tableCheck(supabase, table)))
  const latestStatic = await supabase
    .from("market_audit_events")
    .select("*")
    .eq("event_type", "runtime_execution_audit")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()


  const counters = Object.fromEntries(checks.map((item) => [item.table, item.count || 0]))
  return NextResponse.json({
    ok: checks.every((item) => item.ok),
    counters,
    checks,
    latest_runtime_audit: latestStatic && "data" in latestStatic ? latestStatic.data?.payload || null : null,
    latest_static_audit: latestStatic && "data" in latestStatic ? latestStatic.data || null : null,
  })
}

export async function POST(req: Request) {
  const audit = await req.json().catch(() => ({}))
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("market_audit_events")
    .insert({
      event_type: "runtime_execution_audit",
      event_title: audit?.ok ? "Runtime execution audit passed" : "Runtime execution audit needs review",
      event_summary: `${audit?.suspectButtons?.length || 0} suspect button(s) detected on ${audit?.path || "Market-OS"}`,
      actor_name: "Execution Guard",
      source_module: "final-execution-guard",
      payload: audit || {},
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
