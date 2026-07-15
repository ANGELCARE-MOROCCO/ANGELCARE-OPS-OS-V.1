import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const { data: threads, error } = await db
      .from("email_os_core_threads")
      .select("*")
      .limit(500)

    if (error) throw error

    const missingSubject = (threads || []).filter((thread: any) => !thread.subject)

    for (const thread of missingSubject) {
      await db
        .from("email_os_core_threads")
        .update({
          subject: "Untitled conversation",
          last_action: "threading.repair",
          updated_at: nowIso()
        })
        .eq("id", thread.id)
    }

    await db.from("email_os_core_realtime_events").insert({
      id: makeEmailOSId(),
      event_type: "threading.repair.completed",
      entity_type: "system",
      entity_id: null,
      payload: { repaired: missingSubject.length },
      created_at: nowIso()
    })
    return NextResponse.json({ ok: true, data: { repaired: missingSubject.length } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Threading repair failed" }, { status: 500 })
  }
}
