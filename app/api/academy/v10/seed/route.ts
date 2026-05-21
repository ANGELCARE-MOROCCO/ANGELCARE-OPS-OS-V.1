import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const owners = ["Academy Manager", "Admissions", "Training Lead", "Placement Lead"]
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const module_key = payload.module_key || "academy"
  const page_key = payload.page_key || null
  const presets: string[] = Array.isArray(payload.presets) ? payload.presets : ["Eligibility backlog", "Payment follow-up", "Attendance risk", "Certificate readiness"]
  const lanes: string[] = Array.isArray(payload.lanes) ? payload.lanes : ["open", "in_progress", "blocked", "completed"]
  const rows = presets.map((title, index) => ({
    module_key,
    page_key,
    record_type: "academy_command",
    title,
    description: `Academy production command record for ${module_key}. Connect it to live trainee, payment, attendance, certificate or partner data.`,
    owner_name: owners[index % owners.length],
    department: "Academy",
    status: lanes[index % lanes.length],
    priority: ["urgent", "high", "medium", "low"][index % 4],
    risk_level: ["critical", "high", "medium", "low"][index % 4],
    value_mad: [18000, 42000, 9000, 26000][index % 4],
    due_at: new Date(Date.now() + (index - 1) * 86400000).toISOString(),
    next_action: ["Validate file", "Recover payment", "Call trainee", "Issue certificate"][index % 4],
    stage: lanes[index % lanes.length],
    score: 65 + index * 8,
    metadata: { seeded_by: "academy_v10", preset_index: index },
  }))
  const { data, error } = await supabase.from("academy_command_records").insert(rows).select("id")
  await supabase.from("academy_action_logs").insert({ module_key, page_key, action_key: "seed_records", selected_count: rows.length, payload: { rows }, status: error ? "failed" : "logged" })
  return NextResponse.json({ ok: !error, count: data?.length || 0, error: error?.message || null }, { status: error ? 500 : 200 })
}
