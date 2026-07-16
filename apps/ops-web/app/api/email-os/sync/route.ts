import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import {
  listEmailOSMultiMailboxes,
  listEmailOSMultiMailboxesFromDb,
  resolveEmailOSMailboxIdentity,
  resolveEmailOSMailboxIdentityFromDb,
  type ResolvedEmailOSMailbox
} from "@/lib/email-os-core/multi-mailbox-resolver"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
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
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const requestedMailboxId = String(body.mailboxId || body.mailbox_id || "").trim()
    const limit = parseLimit(body.limit)
    const shouldSyncAll = !requestedMailboxId || requestedMailboxId.toLowerCase() === "all"

    /*
      Production safety rule:
      - Scoped mailbox users may sync only the mailbox they unlocked with PIN.
      - Global/all sync must not be triggered from the mailbox workspace.
      - CEO/admin all-mailbox sync can be reintroduced later through a separate admin endpoint.
    */
    if (shouldSyncAll) {
      return NextResponse.json(
        {
          ok: false,
          error: "Mailbox-scoped sync requires a mailboxId.",
          diagnostics: {
            mode: "blocked_global_sync",
            reason: "Use a specific unlocked mailbox session for staff sync."
          }
        },
        { status: 403 }
      )
    }

    const mailboxScope = await resolveMailboxScopeForUser(user.id, requestedMailboxId)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_read",
      request,
    })

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

    const selected =
      (await resolveEmailOSMailboxIdentityFromDb({ mailboxId: mailboxScope.mailboxId })) ||
      resolveEmailOSMailboxIdentity({ mailboxId: mailboxScope.mailboxId }) ||
      configuredMailboxes.find((mailbox) => normalize(mailbox.mailboxId) === normalize(mailboxScope.mailboxId)) ||
      null

    if (!selected) {
      return NextResponse.json(
        {
          ok: false,
          error: "Requested mailbox is not configured for inbound sync",
          diagnostics: {
            requestedMailboxId,
            scopedMailboxId: mailboxScope.mailboxId,
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
        requestedMailboxId,
        scopedMailboxId: mailboxScope.mailboxId,
        ...result
      }
    }, { status: result.ok ? 200 : 500 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Email sync failed"
      },
      { status: 500 }
    )
  }
}
