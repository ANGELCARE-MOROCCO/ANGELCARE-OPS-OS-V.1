import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const scope = await resolveMailboxScopeForUser(user.id, null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: scope.mailboxId,
      requiredPermission: "can_read",
      request: null,
    })

    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_outbox")
      .select("*")
      .eq("mailbox_id", scope.mailboxId)
      .order("created_at", { ascending: false })
      .limit(250)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      data: data || []
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Outbox load failed"
      },
      { status: 500 }
    )
  }
}
