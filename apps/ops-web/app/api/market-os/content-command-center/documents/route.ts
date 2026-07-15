
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

    let query = supabase.from("content_command_documents").select("*").order("updated_at", { ascending: false }).limit(limit)
    if (family) query = query.eq("family", family)
    if (status) query = query.eq("status", status)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ ok: true, documents: data || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load documents", documents: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = getContentCommandServerClient()
    const row = {
      ...payload,
      id: payload.id || `documents-${Date.now()}`,
    }

    const { data, error } = await supabase
      .from("content_command_documents")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single()

    if (error) throw error

    await supabase.from("content_command_activity").insert({
      entity_type: "documents",
      entity_id: row.id,
      action: "upsert",
      actor: payload.owner || payload.author || "workspace-user",
      payload: row,
    })

    return NextResponse.json({ ok: true, record: data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save documents" }, { status: 500 })
  }
}
