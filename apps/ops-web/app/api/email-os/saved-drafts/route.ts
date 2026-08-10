import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

async function safeDraftRows(db: ReturnType<typeof createEmailOSCoreDb>, table: string, mailboxId: string) {
  const { data, error } = await db
    .from(table)
    .select("*")
    .eq("mailbox_id", mailboxId)
    .order("updated_at", { ascending: false })
    .limit(250)

  if (error) return []
  return (data || []).map((row: any) => ({
    ...row,
    __draft_table: table,
    source_table: row.source_table || table
  }))
}

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

    const [savedDrafts, coreDrafts, outboxRows] = await Promise.all([
      safeDraftRows(db, "email_os_core_saved_drafts", scope.mailboxId),
      safeDraftRows(db, "email_os_core_drafts", scope.mailboxId),
      safeDraftRows(db, "email_os_core_outbox", scope.mailboxId)
    ])

    const outboxDrafts = outboxRows.filter((row: any) => {
      const status = clean(row.status).toLowerCase()
      return status === "draft" || status === "scheduled"
    })

    const byId = new Map<string, any>()
    for (const row of [...savedDrafts, ...coreDrafts, ...outboxDrafts]) {
      byId.set(`${row.__draft_table || row.source_table || "draft"}:${row.id}`, row)
    }

    const rows = Array.from(byId.values()).sort((a: any, b: any) => {
      const left = Date.parse(a.updated_at || a.created_at || 0)
      const right = Date.parse(b.updated_at || b.created_at || 0)
      return right - left
    })

    return NextResponse.json({ ok: true, data: rows })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load saved drafts" },
      { status: 500 }
    )
  }
}
