import { NextResponse } from "next/server"
import net from "node:net"
import tls from "node:tls"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"
import { assertCeoAccess } from "@/lib/email-os-core/ceo-access"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function probeTcp(host: string, port: number, secure: boolean, timeout = 3500): Promise<{ ok: boolean; ms: number; error?: string }> {
  const started = Date.now()

  return new Promise((resolve) => {
    const socket = secure
      ? tls.connect({ host, port, servername: host, rejectUnauthorized: false })
      : net.connect({ host, port })

    let settled = false

    const done = (ok: boolean, error?: string) => {
      if (settled) return
      settled = true
      try {
        socket.destroy()
      } catch {}
      resolve({ ok, ms: Date.now() - started, error })
    }

    socket.setTimeout(timeout)
    socket.once("connect", () => done(true))
    socket.once("secureConnect", () => done(true))
    socket.once("timeout", () => done(false, "timeout"))
    socket.once("error", (error) => done(false, error.message))
  })
}

async function countRows(db: any, table: string, column: string, value: string) {
  try {
    const { count, error } = await db
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(column, value)

    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

export async function GET(request: Request) {
  const denied = assertCeoAccess(request)
  if (denied) return denied

  try {
    const db = createEmailOSCoreDb()
    const mailboxes = listEmailOSMultiMailboxes()
    const data: any[] = []

    for (const mailbox of mailboxes) {
      const [smtpProbe, incomingProbe, inboxCount, outboxCount, sentCount, failedCount] = await Promise.all([
        probeTcp(mailbox.smtp.host, mailbox.smtp.port, mailbox.smtp.secure),
        probeTcp(mailbox.incoming.host, mailbox.incoming.port, mailbox.incoming.secure),
        countRows(db, "email_os_core_inbox", "mailbox_id", mailbox.mailboxId),
        countRows(db, "email_os_core_outbox", "mailbox_id", mailbox.mailboxId),
        countRows(db, "email_os_core_outbox", "status", "sent"),
        countRows(db, "email_os_core_outbox", "status", "failed")
      ])

      const configured = Boolean(
        mailbox.email &&
        mailbox.smtp.user &&
        mailbox.smtp.pass &&
        mailbox.incoming.user &&
        mailbox.incoming.pass
      )

      data.push({
        key: mailbox.key,
        label: mailbox.label,
        email: mailbox.email,
        mailboxId: mailbox.mailboxId,
        configured,
        smtp: {
          host: mailbox.smtp.host,
          port: mailbox.smtp.port,
          secure: mailbox.smtp.secure,
          user: mailbox.smtp.user,
          passwordConfigured: Boolean(mailbox.smtp.pass),
          reachable: smtpProbe.ok,
          latencyMs: smtpProbe.ms,
          error: smtpProbe.error || null
        },
        imap: {
          protocol: mailbox.incoming.protocol,
          host: mailbox.incoming.host,
          port: mailbox.incoming.port,
          secure: mailbox.incoming.secure,
          user: mailbox.incoming.user,
          passwordConfigured: Boolean(mailbox.incoming.pass),
          reachable: incomingProbe.ok,
          latencyMs: incomingProbe.ms,
          error: incomingProbe.error || null
        },
        production: {
          inboxCount,
          outboxCount,
          sentCount,
          failedCount
        },
        health:
          configured && smtpProbe.ok && incomingProbe.ok
            ? "live"
            : configured && (smtpProbe.ok || incomingProbe.ok)
              ? "partial"
              : "risk"
      })

      await sleep(350)
    }

    return NextResponse.json({
      ok: true,
      data: {
        summary: {
          total: data.length,
          live: data.filter((item) => item.health === "live").length,
          partial: data.filter((item) => item.health === "partial").length,
          risk: data.filter((item) => item.health === "risk").length,
          checkedAt: new Date().toISOString()
        },
        mailboxes: data
      }
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Mailbox liveness failed" },
      { status: 500 }
    )
  }
}
