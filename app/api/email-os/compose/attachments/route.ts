import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const attachments = Array.isArray(body.attachments) ? body.attachments : []

    const rows = attachments.map((item: any) => ({
      id: makeEmailOSId(),
      draft_id: body.draftId || null,
      outbox_id: body.outboxId || null,
      filename: item.filename || item.name || "attachment",
      size_bytes: Number(item.size || item.size_bytes || 0),
      mime_type: item.mimeType || item.type || null,
      status: "attached",
      metadata: item.metadata || {}
    }))

    if (rows.length > 0) {
      const { error } = await db.from("email_os_core_compose_attachments").insert(rows)
      if (error) throw error
    }

    return NextResponse.json({
      ok: true,
      data: {
        inserted: rows.length,
        attachments: rows
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Attachment registration failed"
      },
      { status: 500 }
    )
  }
}
