import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const threadId = url.searchParams.get("threadId")

  const db = createEmailOSCoreDb()
  let query = db.from("email_os_core_comments").select("*").order("created_at", { ascending: false })

  if (threadId) query = query.eq("thread_id", threadId)

  const { data, error } = await query.limit(100)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data || [] })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const db = createEmailOSCoreDb()

  const row = {
    id: makeEmailOSId(),
    thread_id: body.threadId || null,
    author: body.author || "operations",
    body: body.body || "",
    mentions: body.mentions || [],
    created_at: nowIso()
  }

  const { data, error } = await db
    .from("email_os_core_comments")
    .insert(row)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data })
}
