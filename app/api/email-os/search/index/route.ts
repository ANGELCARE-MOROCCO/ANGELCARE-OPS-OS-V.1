import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const { data: threads, error: threadError } = await db
      .from("email_os_core_threads")
      .select("*")
      .limit(1000)

    if (threadError) throw threadError

    const { data: drafts, error: draftError } = await db
      .from("email_os_core_drafts")
      .select("*")
      .limit(1000)

    if (draftError) throw draftError

    const rows = [
      ...(threads || []).map((item: any) => ({
        id: `thread:${item.id}`,
        entity: "thread",
        entity_id: item.id,
        title: item.subject || "",
        body: item.preview || "",
        keywords: [item.status, item.priority, item.owner].filter(Boolean),
        metadata: item,
        created_at: item.created_at || nowIso(),
        updated_at: nowIso()
      })),
      ...(drafts || []).map((item: any) => ({
        id: `draft:${item.id}`,
        entity: "draft",
        entity_id: item.id,
        title: item.subject || "",
        body: item.body || "",
        keywords: [item.status, item.to_email].filter(Boolean),
        metadata: item,
        created_at: item.created_at || nowIso(),
        updated_at: nowIso()
      }))
    ]

    if (rows.length) {
      const { error } = await db.from("email_os_core_search_index").upsert(rows)
      if (error) throw error
    }

    return NextResponse.json({ ok: true, data: { indexed: rows.length } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Indexing failed" }, { status: 500 })
  }
}
