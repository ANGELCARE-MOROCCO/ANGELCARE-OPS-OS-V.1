import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      attachment_id: body.attachmentId || null,
      pipeline_status: "queued",
      scan_status: "pending",
      storage_status: "pending",
      error: null,
      metadata: body.metadata || {},
      created_at: nowIso(),
      updated_at: nowIso()
    }
    const { data, error } = await db.from("email_os_core_attachment_pipeline_jobs").insert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Attachment pipeline failed" }, { status: 500 })
  }
}
