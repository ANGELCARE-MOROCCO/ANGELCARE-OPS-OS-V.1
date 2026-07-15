
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getContentCommandServerClient()

    const { error } = await supabase.from("content_command_templates").delete().eq("id", id)
    if (error) throw error

    await supabase.from("content_command_activity").insert({
      entity_type: "template",
      entity_id: id,
      action: "delete",
      payload: {},
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to delete template" }, { status: 500 })
  }
}
