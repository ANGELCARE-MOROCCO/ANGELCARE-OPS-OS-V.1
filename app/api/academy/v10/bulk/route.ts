import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(payload.ids) ? payload.ids : []
  if (!ids.length) return NextResponse.json({ ok: false, error: "No record ids selected" }, { status: 400 })
  const supabase = await createClient()
  const updates = { ...(payload.updates || {}), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from("revenue_command_records").update(updates).in("id", ids).select("id")
  await supabase.from("revenue_command_action_logs").insert({
    module_key: payload.module_key || "revenue_hq",
    page_key: payload.page_key || null,
    action_key: `bulk_${payload.action || "update"}`,
    selected_count: ids.length,
    payload: { ids, updates, action: payload.action },
    status: error ? "failed" : "logged",
  })
  return NextResponse.json({ ok: !error, count: data?.length || 0, error: error?.message || null }, { status: error ? 500 : 200 })
}
