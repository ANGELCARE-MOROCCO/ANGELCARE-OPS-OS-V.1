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
    const q = (url.searchParams.get("q") || "").trim()
    const entity = url.searchParams.get("entity")
    const limit = Number(url.searchParams.get("limit") || 50)
    const mailboxId = url.searchParams.get("mailboxId") || url.searchParams.get("mailbox_id")
    const scope = await resolveMailboxScopeForUser(user.id, mailboxId || null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: scope.mailboxId,
      requiredPermission: "can_read",
      request,
    })

    const db = createEmailOSCoreDb()
    let query = db.from("email_os_core_search_index").select("*").order("updated_at", { ascending: false })

    if (entity) query = query.eq("entity", entity)

    if (q) {
      query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)
    }

    const { data, error } = await query.limit(limit)
    if (error) throw error

    const filtered = (data || []).filter((row: any) => {
      const rowMailboxId = row.mailbox_id || row.metadata?.mailbox_id || row.metadata?.mailboxId || row.metadata_json?.mailbox_id || row.metadata_json?.mailboxId
      return !rowMailboxId || rowMailboxId === scope.mailboxId
    })

    return NextResponse.json({ ok: true, data: filtered })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Search failed" }, { status: 500 })
  }
}
