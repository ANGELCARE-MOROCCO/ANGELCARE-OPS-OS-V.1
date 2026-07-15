import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db.from("email_os_core_ai_memory").select("*").order("created_at", { ascending: false }).limit(250)
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load AI memory" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.content) return NextResponse.json({ ok: false, error: "content is required" }, { status: 400 })

    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      memory_type: body.memoryType || "operational",
      entity_type: body.entityType || null,
      entity_id: body.entityId || null,
      content: body.content,
      embedding_ref: body.embeddingRef || null,
      metadata: body.metadata || {},
      created_at: nowIso()
    }
    const { data, error } = await db.from("email_os_core_ai_memory").insert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to save AI memory" }, { status: 500 })
  }
}
