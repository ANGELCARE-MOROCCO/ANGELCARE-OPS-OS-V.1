import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
  const supabase = await createClient()
  const record = await supabase.from("revenue_command_records").select("*").eq("id", id).single()
  const logs = await supabase.from("revenue_command_action_logs").select("*").contains("payload", { id }).order("created_at", { ascending: false }).limit(50)
  return NextResponse.json({ ok: !record.error, record: record.data || null, logs: logs.data || [], error: record.error?.message || null })
}
