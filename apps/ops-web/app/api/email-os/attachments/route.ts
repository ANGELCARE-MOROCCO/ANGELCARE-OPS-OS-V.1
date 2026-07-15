import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const threadId = url.searchParams.get("threadId")
    const draftId = url.searchParams.get("draftId")

    const db = createEmailOSCoreDb()
    let query = db.from("email_os_core_attachments").select("*").order("created_at", { ascending: false })

    if (threadId) query = query.eq("thread_id", threadId)
    if (draftId) query = query.eq("draft_id", draftId)

    const { data, error } = await query.limit(250)
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load attachments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (!body.fileName) {
      return NextResponse.json({ ok: false, error: "fileName is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()

    const row = {
      id: makeEmailOSId(),
      thread_id: body.threadId || null,
      draft_id: body.draftId || null,
      file_name: body.fileName,
      mime_type: body.mimeType || "application/octet-stream",
      size_bytes: Number(body.sizeBytes || 0),
      storage_path: body.storagePath || null,
      status: body.status || "attached",
      created_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_attachments").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create attachment" }, { status: 500 })
  }
}
