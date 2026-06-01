import { NextResponse } from "next/server"
import net from "node:net"
import tls from "node:tls"
import { getEmailOSMailboxCredentialByKey } from "@/lib/email-os-core/mailbox-credentials"
import { assertCeoAccess } from "@/lib/email-os-core/ceo-access"

function probeTcp(host: string, port: number, secure: boolean, timeout = 10000): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
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
      resolve({ ok, latencyMs: Date.now() - started, error })
    }

    socket.setTimeout(timeout)
    socket.once("connect", () => done(true))
    socket.once("secureConnect", () => done(true))
    socket.once("timeout", () => done(false, "timeout"))
    socket.once("error", (error) => done(false, error.message))
  })
}

export async function POST(request: Request) {
  const denied = assertCeoAccess(request)
  if (denied) return denied

  try {
    const body = await request.json().catch(() => ({}))
    const key = String(body.key || "")
    const mailbox = getEmailOSMailboxCredentialByKey(key)

    if (!mailbox) {
      return NextResponse.json({ ok: false, error: "Mailbox config not found" }, { status: 404 })
    }

    const incomingConfig: any = (mailbox as any).incoming || (mailbox as any).imap

    const [smtp, incoming] = await Promise.all([
      probeTcp(mailbox.smtp.host, mailbox.smtp.port, mailbox.smtp.secure),
      probeTcp(incomingConfig.host, incomingConfig.port, incomingConfig.secure)
    ])

    return NextResponse.json({
      ok: true,
      data: {
        key: mailbox.key,
        email: mailbox.email,
        smtp: {
          ok: smtp.ok,
          latencyMs: smtp.latencyMs,
          error: smtp.error || null
        },
        incoming: {
          protocol: incomingConfig.protocol || "pop3",
          host: incomingConfig.host,
          port: incomingConfig.port,
          secure: incomingConfig.secure,
          ok: incoming.ok,
          latencyMs: incoming.latencyMs,
          error: incoming.error || null
        },
        health: smtp.ok && incoming.ok ? "live" : smtp.ok || incoming.ok ? "partial" : "risk",
        checkedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Mailbox probe failed" },
      { status: 500 }
    )
  }
}
