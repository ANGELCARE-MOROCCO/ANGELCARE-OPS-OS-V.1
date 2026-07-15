import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const outboxId = body.outboxId

    if (!outboxId) {
      return NextResponse.json({ ok: false, error: "outboxId is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()

    const { data: outbox, error: loadError } = await db
      .from("email_os_core_outbox")
      .select("*")
      .eq("id", outboxId)
      .single()

    if (loadError) throw loadError

    if (outbox?.queue_id) {
      const { error: queueError } = await db
        .from("email_os_core_queue")
        .update({ status: "queued", last_error: null, updated_at: nowIso() })
        .eq("id", outbox.queue_id)

      if (queueError) throw queueError
    }

    const { data, error } = await db
      .from("email_os_core_outbox")
      .update({ status: "queued", last_error: null, updated_at: nowIso() })
      .eq("id", outboxId)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Retry failed" },
      { status: 500 }
    )
  }
}
