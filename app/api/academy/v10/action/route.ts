import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const action = payload.action || "manual_action"
  const ids: string[] = Array.isArray(payload.selected) ? payload.selected : []
  const { error } = await supabase.from("revenue_command_action_logs").insert({
    module_key: payload.module_key || payload.module || "revenue_hq",
    page_key: payload.page_key || payload.page || null,
    action_key: action,
    selected_count: ids.length,
    payload,
    status: "logged",
  })
  return NextResponse.json({ ok: !error, error: error?.message || null })
}
