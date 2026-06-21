import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const action = payload.action || "manual_action"
  const ids: string[] = Array.isArray(payload.selected) ? payload.selected : []
  const { error } = await supabase.from("academy_action_logs").insert({
    module_key: payload.module_key || payload.module || "academy",
    page_key: payload.page_key || payload.page || null,
    action_key: action,
    selected_count: ids.length,
    payload,
    status: "logged",
  })
  if (!error && payload.target_module) {
    await supabase.from("academy_integration_events").insert({
      target_module: payload.target_module,
      event_key: action,
      entity: payload.entity || "academy_command_records",
      entity_id: payload.entity_id || null,
      payload,
      status: "queued",
    })
  }
  return NextResponse.json({ ok: !error, error: error?.message || null })
}
