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
    production_score: body.production_score || 0,
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("market_content_workspace_items").select("*").order("created_at", { ascending: false })
  if (error) return NextResponse.json({ data: seedContentItems, fallback: true, error: error.message })
  return NextResponse.json({ data: data?.length ? data : seedContentItems, fallback: !data?.length })
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()
  const { data, error } = await supabase.from("market_content_workspace_items").insert(toDb(body)).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.from("market_content_workspace_items").update(toDb(body)).eq("id", body.id).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
