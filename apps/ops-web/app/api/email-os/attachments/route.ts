import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const threadId = url.searchParams.get("threadId")
    const draftId = url.searchParams.get("draftId")
    const mailboxId = url.searchParams.get("mailboxId") || url.searchParams.get("mailbox_id")
    const scope = await resolveMailboxScopeForUser(user.id, mailboxId || null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: scope.mailboxId,
      requiredPermission: "can_read",
      request,
    })

    const db = createEmailOSCoreDb()
    let query = db.from("email_os_core_attachments").select("*").order("created_at", { ascending: false })

    if (threadId) query = query.eq("thread_id", threadId)
    if (draftId) query = query.eq("draft_id", draftId)
    query = query.eq("mailbox_id", scope.mailboxId)

    const { data, error } = await query.limit(250)
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load attachments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    if (!body.fileName) {
      return NextResponse.json({ ok: false, error: "fileName is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const scope = await resolveMailboxScopeForUser(user.id, body.mailboxId || body.mailbox_id || null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: scope.mailboxId,
      requiredPermission: "can_send",
      request,
    })

    const row = {
      id: makeEmailOSId(),
      thread_id: body.threadId || null,
      draft_id: body.draftId || null,
      mailbox_id: scope.mailboxId,
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
