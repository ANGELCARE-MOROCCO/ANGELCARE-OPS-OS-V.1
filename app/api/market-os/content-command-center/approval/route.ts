
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = getContentCommandServerClient()
    const taskId = payload.task_id || `approval-${Date.now()}`

    await supabase.from("content_command_tasks").upsert({
      id: taskId,
      entity_type: payload.entity_type || "asset",
      entity_id: payload.entity_id,
      title: payload.title || "Approval requested",
      status: "review",
      owner: payload.owner || "Marketing Director",
      priority: payload.priority || "high",
      payload: { approval: true, ...payload },
    }, { onConflict: "id" })

    await supabase.from("content_command_activity").insert({
      entity_type: payload.entity_type || "asset",
      entity_id: payload.entity_id || taskId,
      action: "approval-requested",
      actor: payload.actor || "workspace-user",
      payload,
    })

    return NextResponse.json({ ok: true, taskId })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Approval request failed" }, { status: 500 })
  }
}
