import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = createEmailOSCoreDb()
    const body = await request.json().catch(() => ({}))
    const mailboxScope = await resolveMailboxScopeForUser(user.id, clean(body.mailboxId || body.mailbox_id) || null)
    const access = await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_send",
      request,
    })
    const now = nowIso()
    const id = makeEmailOSId()

    const row = {
      id,
      mailbox_id: mailboxScope.mailboxId,
      from_email: clean(access.mailbox?.address || access.mailbox?.name || "") || null,
      to_email: clean(body.toEmail || body.to_email || body.to) || null,
      cc_email: clean(body.ccEmail || body.cc_email || body.cc) || null,
      bcc_email: clean(body.bccEmail || body.bcc_email || body.bcc) || null,
      subject: clean(body.subject) || "(Sans objet)",
      body: clean(body.body || body.message || body.text || body.html),
      status: "draft",
      priority: clean(body.priority) || "normal",
      diagnostics: { route: "compose/draft", transport: "draft-only" },
      created_at: now,
      updated_at: now
    }

    const { data, error } = await db.from("email_os_core_drafts").insert(row).select("*").single()

    if (error) {
      const fallback = await db.from("email_os_core_outbox").insert({
        ...row,
        provider_message_id: null,
        queue_id: null,
        sent_at: null,
        last_error: null
      }).select("*").single()

      if (fallback.error) {
        return NextResponse.json({ ok: false, error: fallback.error.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, data: fallback.data })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Draft save failed" },
      { status: 500 }
    )
  }
}
