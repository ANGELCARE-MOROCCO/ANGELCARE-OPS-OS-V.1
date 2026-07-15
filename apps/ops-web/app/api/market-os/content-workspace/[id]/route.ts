import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { seedContentItems } from "@/lib/market-os/content-workspace"

function toDb(body: any) {
  return {
    title: body.title,
    content_type: body.content_type,
    service_id: body.service_id || null,
    service_name: body.service_name || null,
    creator: body.creator || null,
    asset_url: body.asset_url || null,
    stage: body.stage || "planned",
    priority: body.priority || "normal",
    channel: body.channel || "Meta",
    target: body.target || "Parents B2C",
    deadline: body.deadline || null,
    objective: body.objective || "",
    output_notes: body.output_notes || null,
    review_notes: body.review_notes || null,
    approval_status: body.approval_status || "none",
    production_score: Number(body.production_score || 0),
    updated_at: new Date().toISOString(),
  }
}

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const fallback = seedContentItems.find((i) => i.id === id)
  const supabase = await createClient()
  const { data, error } = await supabase.from("market_content_workspace_items").select("*").eq("id", id).maybeSingle()
  if (error) return NextResponse.json({ data: fallback || null, fallback: true, error: error.message })
  return NextResponse.json({ data: data || fallback || null, fallback: !data })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const body = await req.json()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("market_content_workspace_items")
    .update(toDb(body))
    .eq("id", id)
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { error } = await supabase.from("market_content_workspace_items").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
