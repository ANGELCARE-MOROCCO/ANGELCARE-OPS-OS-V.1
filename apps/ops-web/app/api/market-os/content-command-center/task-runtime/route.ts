import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { auditContentHeadquarters } from "@/lib/market-os/content-command-headquarters/repository"

export const dynamic = "force-dynamic"

function clean(value: unknown) { return String(value ?? "").trim() }

export async function GET(request: Request) {
  try {
    await requireContentHeadquartersUser("view")
    const taskId = new URL(request.url).searchParams.get("task_id") || ""
    const supabase = await createServiceClient() as any
    let query = supabase.from("market_content_notes").select("*").eq("note_type", "task_runtime").neq("status", "archived").order("updated_at", { ascending: false }).limit(1000)
    if (taskId) query = query.eq("task_id", taskId)
    const result = await query
    if (result.error) throw result.error
    const latest = new Map<string, Record<string, unknown>>()
    for (const row of result.data || []) {
      const key = clean(row.task_id)
      if (key && !latest.has(key)) latest.set(key, row.metadata || {})
    }
    return NextResponse.json({ ok: true, runtimes: [...latest.values()], source: "market_content_notes" })
  } catch (error) {
    return contentHeadquartersApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireContentHeadquartersUser("operate")
    const payload = await request.json() as Record<string, unknown>
    const taskId = clean(payload.taskId)
    if (!taskId) throw new Error("TASK_ID_REQUIRED")
    const supabase = await createServiceClient() as any
    const current = await supabase.from("market_content_notes").select("id").eq("task_id", taskId).eq("note_type", "task_runtime").neq("status", "archived").order("updated_at", { ascending: false }).limit(1).maybeSingle()
    if (current.error) throw current.error
    const row = {
      task_id: taskId,
      note_type: "task_runtime",
      body: `Task runtime · ${taskId}`,
      status: "active",
      author_id: actor.id || null,
      author_name: actor.name,
      metadata: payload,
      updated_at: new Date().toISOString(),
    }
    const result = current.data?.id
      ? await supabase.from("market_content_notes").update(row).eq("id", current.data.id).select("*").single()
      : await supabase.from("market_content_notes").insert(row).select("*").single()
    if (result.error) throw result.error
    await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: "task.runtime_saved", entityType: "mission_task", entityId: taskId, detail: { noteId: result.data.id } })
    return NextResponse.json({ ok: true, runtime: result.data.metadata, persisted: true, source: "market_content_notes" })
  } catch (error) {
    return contentHeadquartersApiError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireContentHeadquartersUser("cancel")
    const taskId = new URL(request.url).searchParams.get("task_id") || ""
    if (!taskId) throw new Error("TASK_ID_REQUIRED")
    const supabase = await createServiceClient() as any
    const result = await supabase.from("market_content_notes").update({ status: "archived", updated_at: new Date().toISOString() }).eq("task_id", taskId).eq("note_type", "task_runtime")
    if (result.error) throw result.error
    await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: "task.runtime_archived", entityType: "mission_task", entityId: taskId })
    return NextResponse.json({ ok: true, persisted: true })
  } catch (error) {
    return contentHeadquartersApiError(error)
  }
}
