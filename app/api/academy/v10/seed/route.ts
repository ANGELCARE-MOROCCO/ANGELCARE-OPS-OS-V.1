import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const owners = ["Amina", "Youssef", "Salma", "Nora"]
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const module_key = payload.module_key || "revenue_hq"
  const page_key = payload.page_key || null
  const presets: string[] = Array.isArray(payload.presets) ? payload.presets : ["Revenue action", "Manager review", "Follow-up", "Recovery task"]
  const lanes: string[] = Array.isArray(payload.lanes) ? payload.lanes : ["open", "in_progress", "blocked", "completed"]
  const rows = presets.map((title, index) => ({
    module_key,
    page_key,
    record_type: module_key,
    title,
    description: `Seeded production record for ${module_key}. Replace with real business data or edit directly from the command desk.`,
    owner_name: owners[index % owners.length],
    department: "Revenue Command",
    status: lanes[index % lanes.length],
    priority: ["urgent", "high", "medium", "low"][index % 4],
    risk_level: ["critical", "high", "medium", "low"][index % 4],
    value_mad: [65000, 42000, 27000, 136000][index % 4],
    due_at: new Date(Date.now() + (index - 1) * 86400000).toISOString(),
    next_action: ["Call and qualify", "Manager review", "Recover blocker", "Close with proof"][index % 4],
    stage: lanes[index % lanes.length],
    score: 65 + index * 8,
    metadata: { seeded_by: "revenue_command_v10", preset_index: index },
  }))
  const { data, error } = await supabase.from("revenue_command_records").insert(rows).select("id")
  await supabase.from("revenue_command_action_logs").insert({ module_key, page_key, action_key: "seed_records", selected_count: rows.length, payload: { rows }, status: error ? "failed" : "logged" })
  return NextResponse.json({ ok: !error, count: data?.length || 0, error: error?.message || null }, { status: error ? 500 : 200 })
}
