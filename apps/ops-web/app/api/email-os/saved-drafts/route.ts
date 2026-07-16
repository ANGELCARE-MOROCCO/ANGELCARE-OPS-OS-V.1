import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const mailboxId = url.searchParams.get("mailboxId") || url.searchParams.get("mailbox_id")
    const scope = await resolveMailboxScopeForUser(user.id, mailboxId || null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: scope.mailboxId,
      requiredPermission: "can_read",
      request,
    })

    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_saved_drafts")
      .select("*")
      .eq("mailbox_id", scope.mailboxId)
      .order("updated_at", { ascending: false })
      .limit(250)

    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load saved drafts" },
      { status: 500 }
    )
  }
}
