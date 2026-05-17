
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = getContentCommandServerClient()
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit") || "200")
    const entityId = searchParams.get("entity_id")
    const templateId = searchParams.get("template_id")

    let query = supabase
      .from("content_command_comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (entityId) query = query.eq("entity_id", entityId)
    if (templateId) query = query.eq("template_id", templateId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ ok: true, comments: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load comments", comments: [] },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = getContentCommandServerClient()

    const row = {
      id: payload.id || `comment-${Date.now()}`,
      entity_type: payload.entity_type || "asset",
      entity_id: payload.entity_id || null,
      template_id: payload.template_id || null,
      author: payload.author || "Workspace User",
      role: payload.role || "team",
      message: payload.message || "",
      payload: payload.payload || {},
    }

    const { data, error } = await supabase
      .from("content_command_comments")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single()

    if (error) throw error

    await supabase.from("content_command_activity").insert({
      entity_type: "comments",
      entity_id: row.id,
      action: "upsert",
      actor: row.author,
      payload: row,
    })

    return NextResponse.json({ ok: true, record: data, comment: data })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to save comment" },
      { status: 500 },
    )
  }
}
