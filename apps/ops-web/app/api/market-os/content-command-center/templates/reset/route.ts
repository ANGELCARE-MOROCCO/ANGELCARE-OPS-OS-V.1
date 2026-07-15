
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabase = getContentCommandServerClient()
    const { error } = await supabase.from("content_command_templates").delete().neq("id", "__never__")
    if (error) throw error

    await supabase.from("content_command_activity").insert({
      entity_type: "template",
      entity_id: "workspace",
      action: "reset",
      payload: {},
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to reset templates" }, { status: 500 })
  }
}
