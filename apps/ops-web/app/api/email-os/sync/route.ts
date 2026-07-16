import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import {
  listEmailOSMultiMailboxes,
  listEmailOSMultiMailboxesFromDb,
  resolveEmailOSMailboxIdentity,
  resolveEmailOSMailboxIdentityFromDb,
  type ResolvedEmailOSMailbox
} from "@/lib/email-os-core/multi-mailbox-resolver"
import { syncEmailOSMailbox } from "@/lib/email-os-core/inbound-sync"

function parseLimit(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 25
  return Math.max(1, Math.min(100, Math.floor(parsed)))
}

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

async function resolveSyncMailboxes(): Promise<ResolvedEmailOSMailbox[]> {
  const dbMailboxes = await listEmailOSMultiMailboxesFromDb().catch(() => [])
  if (dbMailboxes.length) return dbMailboxes

  return listEmailOSMultiMailboxes()
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

async function syncOneMailbox(mailbox: ResolvedEmailOSMailbox, limit: number) {
  try {
    const result = await syncEmailOSMailbox(mailbox, limit)

    await logSync({
      mailboxId: mailbox.mailboxId,
      provider: mailbox.incoming.protocol,
      syncedCount: result.inserted,
      status: "completed",
      message: `POP3 inbound sync completed. fetched=${result.fetched}, inserted=${result.inserted}, skipped=${result.skipped}`
    })

    return {
      ok: true,
      mailboxId: mailbox.mailboxId,
      mailboxKey: mailbox.key,
      email: mailbox.email,
      incoming: {
        protocol: mailbox.incoming.protocol,
        host: mailbox.incoming.host,
        port: mailbox.incoming.port,
        secure: mailbox.incoming.secure
      },
      count: result.inserted,
      fetched: result.fetched,
      skipped: result.skipped,
      synced: result.synced
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email sync failed"

    await logSync({
      mailboxId: mailbox.mailboxId,
      provider: mailbox.incoming.protocol,
      syncedCount: 0,
      status: "failed",
      message
    })

    return {
      ok: false,
      mailboxId: mailbox.mailboxId,
      mailboxKey: mailbox.key,
      email: mailbox.email,
      error: message
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const mailboxId = String(body.mailboxId || body.mailbox_id || "").trim()
    const limit = parseLimit(body.limit)
    const shouldSyncAll = !mailboxId || mailboxId.toLowerCase() === "all"

    const configuredMailboxes = await resolveSyncMailboxes()

    if (!configuredMailboxes.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "No mailbox configured for inbound sync",
          diagnostics: {
            dbResolver: "empty",
            envResolver: "empty",
            expectedSource: "email_os_core_mailbox_credentials"
          }
        },
        { status: 500 }
      )
    }

    if (shouldSyncAll) {
      const results = []

      for (const mailbox of configuredMailboxes) {
        results.push(await syncOneMailbox(mailbox, limit))
      }

      const completed = results.filter((item) => item.ok).length
      const failed = results.length - completed

      return NextResponse.json({
        ok: failed === 0,
        data: {
          mode: "all",
          total: results.length,
          completed,
          failed,
          inserted: results.reduce((sum, item: any) => sum + Number(item.count || 0), 0),
          fetched: results.reduce((sum, item: any) => sum + Number(item.fetched || 0), 0),
          skipped: results.reduce((sum, item: any) => sum + Number(item.skipped || 0), 0),
          results
        }
      }, { status: failed === 0 ? 200 : 207 })
    }

    const selected =
      (await resolveEmailOSMailboxIdentityFromDb({ mailboxId })) ||
      resolveEmailOSMailboxIdentity({ mailboxId }) ||
      configuredMailboxes.find((mailbox) => normalize(mailbox.mailboxId) === normalize(mailboxId)) ||
      null

    if (!selected) {
      return NextResponse.json(
        {
          ok: false,
          error: "Requested mailbox is not configured for inbound sync",
          diagnostics: {
            requestedMailboxId: mailboxId,
            configuredMailboxes: configuredMailboxes.map((mailbox) => mailbox.mailboxId)
          }
        },
        { status: 404 }
      )
    }

    const result = await syncOneMailbox(selected, limit)

    return NextResponse.json({
      ok: result.ok,
      data: {
        mode: "single",
        ...result
      }
    }, { status: result.ok ? 200 : 500 })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Email sync failed" },
      { status: 500 }
    )
  }
}
