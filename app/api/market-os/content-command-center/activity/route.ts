
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = getContentCommandServerClient()
  const { data, error } = await supabase
    .from("content_command_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ ok: false, error: error.message, activity: [] }, { status: 500 })
  return NextResponse.json({ ok: true, activity: data || [] })
}

export async function POST(request: Request) {
  const payload = await request.json()
  const supabase = getContentCommandServerClient()
  const { data, error } = await supabase
    .from("content_command_activity")
    .insert({
      entity_type: payload.entity_type || "workspace",
      entity_id: payload.entity_id || "unknown",
      action: payload.action || "command",
      actor: payload.actor || "workspace-user",
      payload: payload.payload || {},
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, activity: data })
}
