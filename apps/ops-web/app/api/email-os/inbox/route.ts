import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const mailboxId = clean(url.searchParams.get("mailboxId") || url.searchParams.get("mailbox_id"))
    const limitParam = Number(url.searchParams.get("limit") || 100)
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, Math.floor(limitParam))) : 100
    const scope = await resolveMailboxScopeForUser(user.id, mailboxId && mailboxId.toLowerCase() !== "all" ? mailboxId : null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: scope.mailboxId,
      requiredPermission: "can_read",
      request,
    })

    const db = createEmailOSCoreDb()

    let query = db
      .from("email_os_core_inbox")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit)

    query = query.eq("mailbox_id", scope.mailboxId)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: data || []
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Inbox fetch failed" },
      { status: 500 }
    )
  }
}
