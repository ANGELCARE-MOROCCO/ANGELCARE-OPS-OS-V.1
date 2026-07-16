import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { auditMailboxAccessEvent, requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { getEmailOSBridgeFailureDiagnostics, sendEmailOSDirect } from "@/lib/email-os-core/send-mail"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeAttachmentsForSend(value: any) {
  const rows = Array.isArray(value) ? value : []
  return rows.slice(0, 10)
    .map((item: any) => ({
      filename: clean(item.filename || item.name),
      contentType: clean(item.contentType || item.content_type || item.mimeType) || "application/octet-stream",
      contentBase64: clean(item.contentBase64 || item.content_base64 || item.base64 || item.content),
    }))
    .filter((item: any) => item.filename && item.contentBase64)
}

export async function POST(request: Request) {
  let outboxId = ""
  let db: any = null
  let body: any = null

  try {
    body = await request.json().catch(() => ({}))

    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const requestedMailboxId = clean(body.mailboxId || body.mailbox_id)
    const toEmail = clean(body.toEmail || body.to_email || body.recipient || body.to)
    const ccEmail = clean(body.ccEmail || body.cc_email)
    const bccEmail = clean(body.bccEmail || body.bcc_email)
    const subject = clean(body.subject) || "(Sans objet)"
    const messageBody = clean(body.body || body.message)
    const priority = clean(body.priority) || "normal"
    const attachments = normalizeAttachmentsForSend(body.attachments)

    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "Recipient is required" }, { status: 400 })
    }

    db = createEmailOSCoreDb()

    const mailboxScope = await resolveMailboxScopeForUser(user.id, requestedMailboxId || null)
    const access = await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_send",
      request,
    })

    const resolvedFrom = clean(access.mailbox?.address || access.mailbox?.name || "")
    const requestedFrom = clean(body.fromEmail || body.from_email)

    if (requestedFrom && requestedFrom.toLowerCase() !== resolvedFrom.toLowerCase()) {
      await auditMailboxAccessEvent({
        actor_user_id: user.id,
        target_user_id: user.id,
        mailbox_id: mailboxScope.mailboxId,
        assignment_id: access.assignment.id,
        session_id: access.session.id,
        event_type: "spoofed_mailbox_payload_blocked",
        event_result: "denied",
        severity: "warning",
        request,
        metadata_json: { reason: "fromEmail mismatch", requested_from: requestedFrom, resolved_from: resolvedFrom },
      }).catch(() => null)

      return NextResponse.json({ ok: false, error: "Permission denied for this mailbox action." }, { status: 403 })
    }

    const now = nowIso()
    outboxId = makeEmailOSId()

    await db.from("email_os_core_outbox").insert({
      id: outboxId,
      mailbox_id: mailboxScope.mailboxId,
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
        requestedMailboxId: mailboxScope.mailboxId,
        route: "send-direct",
        transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail",
        attachmentCount: attachments.length,
      },
      queue_id: null,
      from_email: resolvedFrom || null,
      last_error: null,
    }).then(() => null, () => null)

    const { identity, info } = await sendEmailOSDirect({
      mailboxId: mailboxScope.mailboxId,
      fromEmail: resolvedFrom,
      toEmail,
      ccEmail,
      bccEmail,
      subject,
      body: messageBody,
      attachments,
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
          attachmentCount: attachments.length,
          accepted: info.accepted || [],
          rejected: info.rejected || [],
        },
        last_error: null,
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
        mailboxId: mailboxScope.mailboxId,
        resolvedMailboxKey: identity.key,
        resolvedMailboxId: identity.mailboxId,
        from: identity.smtp.from,
        smtpUser: identity.smtp.user,
        messageId: info.messageId || null,
        attachmentCount: attachments.length,
      },
      created_at: sentAt,
    }).then(() => null, () => null)

    return NextResponse.json({
      ok: true,
      data: {
        sent: true,
        outboxId,
        messageId: info.messageId || null,
        mailboxId: identity.mailboxId,
        mailboxKey: identity.key,
        from: identity.smtp.from,
        attachmentCount: attachments.length,
      },
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
                  ...bridgeDiagnostics,
                },
              }
            : {}),
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
            : null,
      },
      { status: bridgeDiagnostics ? 502 : 500 }
    )
  }
}
