import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function normalizeActionBody(body: Record<string, any>) {
  return {
    module_key: body.module_key || body.moduleKey || body.source_module || body.sourceModule || "market-os",
    action_key: body.action_key || body.actionKey || body.action || "manual_action",
    action_label: body.action_label || body.actionLabel || body.label || body.action_key || body.actionKey || "Market-OS Action",
    target_id: body.target_id || body.targetId || null,
    target_title: body.target_title || body.targetTitle || body.title || null,
    target_type: body.target_type || body.targetType || null,
    objective_id: body.objective_id || body.objectiveId || null,
    payload: body.payload || {},
    status: body.status || "executed",
    actor_name: body.actor_name || body.actorName || body.created_by_name || body.createdByName || "Market-OS User",
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("market_action_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, any>
  const row = normalizeActionBody(body)

  if (!row.module_key || !row.action_key || !row.action_label) {
    return NextResponse.json({ error: "module/action keys are required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("market_action_events")
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from("market_audit_events").insert({
    objective_id: row.objective_id,
    event_type: row.action_key,
    event_title: row.action_label,
    event_summary: row.target_title,
    actor_name: row.actor_name,
    source_module: row.module_key,
    payload: { ...row.payload, target_type: row.target_type },
})

  return NextResponse.json({ data })
}
