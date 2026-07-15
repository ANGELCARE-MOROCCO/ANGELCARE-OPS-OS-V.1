
import { NextResponse } from "next/server"
import {
  fromCamelTemplate,
  getContentCommandServerClient,
  toCamelTemplate,
} from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getContentCommandServerClient()
    const { data, error } = await supabase
      .from("content_command_templates")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ ok: true, templates: (data || []).map(toCamelTemplate) })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load templates", templates: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const template = await request.json()
    const supabase = getContentCommandServerClient()
    const row = fromCamelTemplate(template)

    const { data, error } = await supabase
      .from("content_command_templates")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single()

    if (error) throw error

    await supabase.from("content_command_activity").insert({
      entity_type: "template",
      entity_id: row.id,
      action: "upsert",
      actor: row.owner,
      payload: row,
    })

    return NextResponse.json({ ok: true, template: toCamelTemplate(data) })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save template" }, { status: 500 })
  }
}
