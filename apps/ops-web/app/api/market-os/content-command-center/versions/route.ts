
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = getContentCommandServerClient()
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get("entity_id")
  let query = supabase.from("content_command_versions").select("*").order("created_at", { ascending: false })
  if (entityId) query = query.eq("entity_id", entityId)
  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ ok: false, error: error.message, versions: [] }, { status: 500 })
  return NextResponse.json({ ok: true, versions: data || [] })
}

export async function POST(request: Request) {
  const payload = await request.json()
  const supabase = getContentCommandServerClient()
  const { data, error } = await supabase.from("content_command_versions").insert(payload).select("*").single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, version: data })
}
