import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { resolveEmailOSMailboxIdentity, listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"
import { syncEmailOSMailbox } from "@/lib/email-os-core/inbound-sync"

function parseLimit(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 25
  return Math.max(1, Math.min(100, Math.floor(parsed)))
}

async function logSync(input: {
  mailboxId: string
  provider: string
  syncedCount: number
  status: "completed" | "failed"
  message: string
}) {
  try {
    const db = createEmailOSCoreDb()
    await db.from("email_os_core_sync_logs").insert({
      id: makeEmailOSId(),
      mailbox_id: input.mailboxId,
      provider: input.provider,
      synced_count: input.syncedCount,
      status: input.status,
      message: input.message,
      created_at: nowIso()
    })
  } catch {}
}

export async function POST(request: Request) {
  let selected: ReturnType<typeof resolveEmailOSMailboxIdentity> | null = null

  try {
    const body = await request.json().catch(() => ({}))
    const mailboxId = body.mailboxId || body.mailbox_id || ""
    const limit = parseLimit(body.limit)
    const mailboxes = listEmailOSMultiMailboxes()
    selected = resolveEmailOSMailboxIdentity({ mailboxId }) || mailboxes[0] || null

    if (!selected) {
      return NextResponse.json({ ok: false, error: "No mailbox configured" }, { status: 500 })
    }

    const result = await syncEmailOSMailbox(selected, limit)

    await logSync({
      mailboxId: selected.mailboxId,
      provider: selected.incoming.protocol,
      syncedCount: result.inserted,
      status: "completed",
      message: `POP3 inbound sync completed. fetched=${result.fetched}, inserted=${result.inserted}, skipped=${result.skipped}`
    })

    return NextResponse.json({
      ok: true,
      data: {
        mailboxId: selected.mailboxId,
        mailboxKey: selected.key,
        email: selected.email,
        incoming: {
          protocol: selected.incoming.protocol,
          host: selected.incoming.host,
          port: selected.incoming.port,
          secure: selected.incoming.secure
        },
        count: result.inserted,
        fetched: result.fetched,
        skipped: result.skipped,
        synced: result.synced
      }
    })
  } catch (error) {
    if (selected) {
      await logSync({
        mailboxId: selected.mailboxId,
        provider: selected.incoming.protocol,
        syncedCount: 0,
        status: "failed",
        message: error instanceof Error ? error.message : "Email sync failed"
      })
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Email sync failed" },
      { status: 500 }
    )
  }
}
