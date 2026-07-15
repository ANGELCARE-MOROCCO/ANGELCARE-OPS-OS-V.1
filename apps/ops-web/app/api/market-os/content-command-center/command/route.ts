
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = getContentCommandServerClient()

    await supabase.from("content_command_activity").insert({
      entity_type: payload.entity_type || "command",
      entity_id: payload.entity_id || "workspace",
      action: payload.action || "execute",
      actor: payload.actor || "workspace-user",
      payload: payload.payload || payload,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Command failed" }, { status: 500 })
  }
}
