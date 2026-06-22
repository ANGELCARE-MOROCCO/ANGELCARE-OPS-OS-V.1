
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = getContentCommandServerClient()
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit") || "200")
    const family = searchParams.get("family")
    const status = searchParams.get("status")

    let query = supabase.from("content_command_assets").select("*").order("updated_at", { ascending: false }).limit(limit)
    if (family) query = query.eq("family", family)
    if (status) query = query.eq("status", status)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ ok: true, assets: data || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load assets", assets: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = getContentCommandServerClient()
    const row = {
      ...payload,
      id: payload.id || `assets-${Date.now()}`,
    }

    const { data, error } = await supabase
      .from("content_command_assets")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single()

    if (error) throw error

    await supabase.from("content_command_activity").insert({
      entity_type: "assets",
      entity_id: row.id,
      action: "upsert",
      actor: payload.owner || payload.author || "workspace-user",
      payload: row,
    })

    return NextResponse.json({ ok: true, record: data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save assets" }, { status: 500 })
  }
}
