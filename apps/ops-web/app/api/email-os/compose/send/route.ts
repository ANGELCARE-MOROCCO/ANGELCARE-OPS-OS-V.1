import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { auditMailboxAccessEvent, requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { getEmailOSBridgeFailureDiagnostics, sendEmailOSDirect } from "@/lib/email-os-core/send-mail"
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, countEmailRecipients, runAc360WiredAction } from "@/lib/ac360/action-wiring"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeAttachmentsForSend(value: any) {
  const rows = Array.isArray(value) ? value : []
  return rows.slice(0, 10)
    .map((item: any) => ({
      filename: clean(item.filename || item.name || item.original_filename),
      contentType: clean(item.contentType || item.content_type || item.mimeType) || "application/octet-stream",
      contentBase64: clean(item.contentBase64 || item.content_base64 || item.base64 || item.content),
      fileId: clean(item.fileId || item.file_id || item.storageFileId || item.storage_file_id),
      storageFileId: clean(item.storageFileId || item.storage_file_id || item.fileId || item.file_id),
    }))
    .filter((item: any) => item.filename && (item.contentBase64 || item.fileId || item.storageFileId))
}

function absoluteBaseUrl(request: Request) {
  const configured = clean(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL)
  if (configured) return configured.startsWith("http") ? configured.replace(/\/+$/, "") : `https://${configured.replace(/\/+$/, "")}`
  const origin = request.headers.get("origin")
  if (origin) return origin.replace(/\/+$/, "")
  const host = request.headers.get("host") || ""
  const proto = host.includes("localhost") ? "http" : "https"
  return host ? `${proto}://${host}` : ""
}

function withTrackingPixel(message: string, baseUrl: string, trackingId: string) {
  if (!trackingId || !baseUrl) return message
  const src = `${baseUrl}/api/email-os/tracking/open/${encodeURIComponent(trackingId)}.gif`
  const pixel = `<img src="${src}" width="1" height="1" alt="" style="display:none;opacity:0;width:1px;height:1px" />`
  return `${message || ""}\n\n${pixel}`
}

export async function POST(request: Request) {
  const db = createEmailOSCoreDb()
  let outboxId = ""
  let body: any = null

  try {
    body = await request.json().catch(() => ({}))

    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const requestedMailboxId = clean(body.mailboxId || body.mailbox_id)
    const fromEmail = clean(body.fromEmail || body.from_email)
    const toEmail = clean(body.toEmail || body.to_email || body.to)
    const ccEmail = clean(body.ccEmail || body.cc_email || body.cc)
    const bccEmail = clean(body.bccEmail || body.bcc_email || body.bcc)
    const subject = clean(body.subject) || "(Sans objet)"
    const message = clean(body.body || body.message || body.text || body.html)
    const attachments = normalizeAttachmentsForSend(body.attachments)
    const trackingEnabled = body.tracking !== false && body.tracking !== "false"
    const trackingId = trackingEnabled ? makeEmailOSId() : ""
    const trackingBaseUrl = absoluteBaseUrl(request)
    const sendBody = trackingEnabled ? withTrackingPixel(message, trackingBaseUrl, trackingId) : message

    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "Recipient is required" }, { status: 400 })
    }

    const mailboxScope = await resolveMailboxScopeForUser(user.id, requestedMailboxId || null)
    const access = await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_send",
      request,
    })

    const resolvedFrom = clean(access.mailbox?.address || access.mailbox?.name || "")
    if (fromEmail && fromEmail.toLowerCase() !== resolvedFrom.toLowerCase()) {
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
        metadata_json: { reason: "fromEmail mismatch", requested_from: fromEmail, resolved_from: resolvedFrom },
      }).catch(() => null)

      return NextResponse.json({ ok: false, error: "Permission denied for this mailbox action." }, { status: 403 })
    }

    const recipientCount = countEmailRecipients(toEmail, ccEmail, bccEmail)

    const guarded = await runAc360WiredAction("email_os.compose_send", async () => {
      const now = nowIso()
      outboxId = makeEmailOSId()

      await db.from("email_os_core_outbox").insert({
        id: outboxId,
        mailbox_id: mailboxScope.mailboxId,
        from_email: resolvedFrom || null,
        to_email: toEmail,
        cc_email: ccEmail || null,
        bcc_email: bccEmail || null,
        subject,
        body: message,
        status: "sending",
        priority: body.priority || "normal",
        provider_message_id: null,
        queue_id: null,
        tracking_id: trackingId || null,
        tracking_enabled: trackingEnabled,
        first_opened_at: null,
        last_opened_at: null,
        open_count: 0,
        diagnostics: {
          route: "compose/send",
          transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail",
          attachmentCount: attachments.length,
          tracking: {
            enabled: trackingEnabled,
            trackingId: trackingId || null,
            status: trackingEnabled ? "active_not_opened" : "off"
          },
          ac360Guarded: true,
        },
        created_at: now,
        updated_at: now,
        sent_at: null,
        last_error: null,
      }).then(() => null, () => null)

      const { identity, info } = await sendEmailOSDirect({
        mailboxId: mailboxScope.mailboxId,
        fromEmail: resolvedFrom,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        body: sendBody,
        attachments,
      })

      const sentAt = nowIso()

      await db.from("email_os_core_outbox").update({
        mailbox_id: identity.mailboxId,
        from_email: identity.smtp.from,
        status: "sent",
        provider_message_id: info.messageId || null,
        sent_at: sentAt,
        updated_at: sentAt,
        last_error: null,
        diagnostics: {
          route: "compose/send",
          transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail",
          attachmentCount: attachments.length,
          tracking: {
            enabled: trackingEnabled,
            trackingId: trackingId || null,
            status: trackingEnabled ? "active_not_opened" : "off"
          },
          resolvedMailboxKey: identity.key,
          resolvedMailboxId: identity.mailboxId,
          smtpUser: identity.smtp.user,
          accepted: info.accepted || [],
          rejected: info.rejected || [],
          ac360Guarded: true,
        },
      }).eq("id", outboxId).then(() => null, () => null)

      return {
        sent: true,
        outboxId,
        messageId: info.messageId || null,
        mailboxId: identity.mailboxId,
        mailboxKey: identity.key,
        from: identity.smtp.from,
        attachmentCount: attachments.length,
        tracking: {
          enabled: trackingEnabled,
          trackingId: trackingId || null,
          status: trackingEnabled ? "active_not_opened" : "off"
        },
      }
    }, {
      orgId: body.orgId || body.org_id,
      quantity: recipientCount,
      idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey("email.compose.send", `${mailboxScope.mailboxId || resolvedFrom || "mailbox"}:${toEmail}:${subject}`),
      metadata: {
        mailboxId: mailboxScope.mailboxId,
        fromEmail: resolvedFrom,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        recipientCount,
        attachmentCount: attachments.length,
        source: "api.email-os.compose.send.POST",
      },
    })

    if (!guarded.ok) return ac360GuardBlockedResponse(guarded)

    return NextResponse.json({
      ok: true,
      data: guarded.data,
      ac360: { guard: guarded.guard, usage: guarded.usage },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compose send failed"
    const bridgeDiagnostics = getEmailOSBridgeFailureDiagnostics(error)

    if (outboxId) {
      await db.from("email_os_core_outbox").update({
        status: "failed",
        updated_at: nowIso(),
        last_error: message,
        ...(bridgeDiagnostics
          ? {
              diagnostics: {
                ...(body?.diagnostics || {}),
                route: "compose/send",
                transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail",
                ...bridgeDiagnostics,
              },
            }
          : {}),
      }).eq("id", outboxId).then(() => null, () => null)
    }

    return NextResponse.json(
      {
        ok: false,
        error: message,
        ...(bridgeDiagnostics || {}),
      },
      { status: bridgeDiagnostics ? 502 : 500 }
    )
  }
}
