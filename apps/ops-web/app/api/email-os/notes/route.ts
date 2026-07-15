import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const threadId = url.searchParams.get("threadId")
    const db = createEmailOSCoreDb()

    let query = db.from("email_os_core_notes").select("*").order("created_at", { ascending: false }).limit(250)
    if (threadId) query = query.eq("thread_id", threadId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load notes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.body) return NextResponse.json({ ok: false, error: "Missing note body" }, { status: 400 })

    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      thread_id: body.threadId || null,
      body: body.body,
      author: body.author || "operations",
      visibility: body.visibility || "internal",
      created_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_notes").insert(row).select("*").single()
    if (error) throw error

    await audit("note.created", { targetType: "thread", targetId: row.thread_id || "", noteId: row.id })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create note" }, { status: 500 })
  }
}
