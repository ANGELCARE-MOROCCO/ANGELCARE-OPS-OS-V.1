import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.id || !body.action) {
      return NextResponse.json(
        { error: "Missing id/action" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.stage) patch.stage = body.stage
    if (body.approval_status) patch.approval_status = body.approval_status
    if (typeof body.production_score === "number") {
      patch.production_score = body.production_score
    }
    if (body.review_notes) patch.review_notes = body.review_notes

    const { data, error } = await supabase
      .from("market_content_workspace_items")
      .update(patch)
      .eq("id", body.id)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({
        ok: false,
        fallback: true,
        error: error.message,
      })
    }

    try {
      await supabase.from("market_content_workspace_events").insert({
        item_id: body.id,
        action: body.action,
        note: body.note || null,
      })
    } catch {
      // Event logging must not block the main workspace update.
    }

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    )
  }
}