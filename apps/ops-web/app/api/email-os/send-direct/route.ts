import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { getEmailOSBridgeFailureDiagnostics, sendEmailOSDirect } from "@/lib/email-os-core/send-mail"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

async function resolveMailboxEmailFromDb(db: any, mailboxId: string) {
  if (!mailboxId) return ""

  try {
    const { data } = await db
      .from("email_os_core_mailboxes")
      .select("*")
      .eq("id", mailboxId)
      .maybeSingle()

    return (
      data?.email_address ||
      data?.address ||
      data?.email ||
      data?.from_email ||
      data?.username ||
      ""
    )
  } catch {
    return ""
  }
}

export async function POST(request: Request) {
  let outboxId = ""
  let db: any = null
  let body: any = null

  try {
    body = await request.json().catch(() => ({}))

    const mailboxId = clean(body.mailboxId || body.mailbox_id)
    const toEmail = clean(body.toEmail || body.to_email || body.recipient || body.to)
    const ccEmail = clean(body.ccEmail || body.cc_email)
    const bccEmail = clean(body.bccEmail || body.bcc_email)
    const subject = clean(body.subject) || "(Sans objet)"
    const messageBody = clean(body.body || body.message)
    const priority = clean(body.priority) || "normal"

    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "Recipient is required" }, { status: 400 })
    }

    db = createEmailOSCoreDb()

    const dbMailboxEmail = await resolveMailboxEmailFromDb(db, mailboxId)
    const requestedFrom = clean(body.fromEmail || body.from_email) || dbMailboxEmail
    const now = nowIso()
    outboxId = makeEmailOSId()

    await db.from("email_os_core_outbox").insert({
      id: outboxId,
      mailbox_id: mailboxId || null,
      to_email: toEmail,
      cc_email: ccEmail || null,
      bcc_email: bccEmail || null,
      subject,
      body: messageBody,
      status: "sending",
      provider_message_id: null,
      created_at: now,
      updated_at: now,
      sent_at: null,
      priority,
      template_key: body.templateKey || body.template_key || null,
      diagnostics: {
        ...(body.diagnostics || {}),
        requestedMailboxId: mailboxId,
        requestedFrom,
        route: "send-direct",
        transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail"
      },
      queue_id: null,
      from_email: requestedFrom || null,
      last_error: null
    }).then(() => null, () => null)

    const { identity, info } = await sendEmailOSDirect({
      mailboxId,
      fromEmail: requestedFrom,
      toEmail,
      ccEmail,
      bccEmail,
      subject,
      body: messageBody
    })

    const sentAt = nowIso()

    await db
      .from("email_os_core_outbox")
      .update({
        mailbox_id: identity.mailboxId,
        status: "sent",
        provider_message_id: info.messageId || null,
        updated_at: sentAt,
        sent_at: sentAt,
        from_email: identity.smtp.from,
        diagnostics: {
          ...(body.diagnostics || {}),
          resolvedMailboxKey: identity.key,
          resolvedMailboxLabel: identity.label,
          resolvedMailboxId: identity.mailboxId,
          actualFrom: identity.smtp.from,
          smtpUser: identity.smtp.user,
          transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail",
          accepted: info.accepted || [],
          rejected: info.rejected || []
        },
        last_error: null
      })
      .eq("id", outboxId)
      .then(() => null, () => null)

    await db.from("email_os_core_audit").insert({
      id: makeEmailOSId(),
      action: "send_direct_central_resolver",
      target_type: "email_outbox",
      target_id: outboxId,
      severity: "info",
      details: {
        mailboxId,
        resolvedMailboxKey: identity.key,
        resolvedMailboxId: identity.mailboxId,
        from: identity.smtp.from,
        smtpUser: identity.smtp.user,
        messageId: info.messageId || null
      },
      created_at: sentAt
    }).then(() => null, () => null)

    return NextResponse.json({
      ok: true,
      data: {
        sent: true,
        outboxId,
        messageId: info.messageId || null,
        mailboxId: identity.mailboxId,
        mailboxKey: identity.key,
        from: identity.smtp.from
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Direct send failed"
    const bridgeDiagnostics = getEmailOSBridgeFailureDiagnostics(error)

    if (db && outboxId) {
      await db
        .from("email_os_core_outbox")
        .update({
          status: "failed",
          updated_at: nowIso(),
          last_error: message,
          ...(bridgeDiagnostics
            ? {
                diagnostics: {
                  ...(body?.diagnostics || {}),
                  route: "send-direct",
                  transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail",
                  ...bridgeDiagnostics
                }
              }
            : {})
        })
        .eq("id", outboxId)
        .then(() => null, () => null)
    }

    return NextResponse.json(
      {
        ok: false,
        error: message,
        ...(bridgeDiagnostics || {}),
        hint: message.includes("535")
          ? "Selected mailbox credentials were rejected. Confirm the selected compose mailbox matches the configured mailbox email/password."
          : message.includes("421")
            ? "Menara throttled SMTP. Wait 60 seconds and retry without liveness/diagnostics refreshing."
            : null
      },
      { status: bridgeDiagnostics ? 502 : 500 }
    )
  }
}
