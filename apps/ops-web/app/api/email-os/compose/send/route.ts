import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { auditMailboxAccessEvent, requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { getEmailOSBridgeFailureDiagnostics, sendEmailOSDirect } from "@/lib/email-os-core/send-mail"
import { emailOSOperatorSnapshot, resolveEmailOSOperatorIdentity } from "@/lib/email-os-core/operator-identity"
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


function htmlToPlainText(value: unknown) {
  return String(value || "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
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

    const operatorIdentity = await resolveEmailOSOperatorIdentity(db, user.id, {
      id: user.id,
      name: user.name || undefined,
      email: user.email || undefined,
      role: user.role || undefined
    })
    const operatorSnapshot = emailOSOperatorSnapshot(operatorIdentity)

    const requestedMailboxId = clean(body.mailboxId || body.mailbox_id)
    const fromEmail = clean(body.fromEmail || body.from_email)
    const toEmail = clean(body.toEmail || body.to_email || body.to)
    const ccEmail = clean(body.ccEmail || body.cc_email || body.cc)
    const bccEmail = clean(body.bccEmail || body.bcc_email || body.bcc)
    const subject = clean(body.subject) || "(Sans objet)"
    const messageHtml = clean(body.bodyHtml || body.body_html || body.body || body.html || body.message)
    const messageText = clean(body.bodyText || body.body_text || body.text) || htmlToPlainText(messageHtml)
    const message = messageHtml
    const attachments = normalizeAttachmentsForSend(body.attachments)
    const trackingEnabled = body.tracking !== false && body.tracking !== "false"
    const trackingId = trackingEnabled ? makeEmailOSId() : ""
    const trackingBaseUrl = absoluteBaseUrl(request)
    const sendBody = trackingEnabled ? withTrackingPixel(messageHtml, trackingBaseUrl, trackingId) : messageHtml

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
    const externalIdentityMode = clean(body.externalOperatorIdentityMode || body.external_operator_identity_mode || process.env.EMAIL_OS_EXTERNAL_OPERATOR_IDENTITY_MODE).toLowerCase()
    const exposeOperatorExternally = body.externalOperatorIdentity === true || body.external_operator_identity === true || externalIdentityMode === "operator"
    const mailboxDisplayName = clean(access.mailbox?.name || resolvedFrom || "AngelCare")
    const fromDisplayName = exposeOperatorExternally ? `${operatorIdentity.fullName} | ${mailboxDisplayName}` : mailboxDisplayName

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
        sent_by_user_id: operatorSnapshot.userId,
        sent_by_name: operatorSnapshot.name,
        sent_by_email: operatorSnapshot.email,
        sent_by_role: operatorSnapshot.role,
        sent_by_department: operatorSnapshot.department,
        sent_by_title: operatorSnapshot.title,
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
          operator: {
            ...operatorSnapshot,
            externalDisplayName: fromDisplayName,
            externallyExposed: exposeOperatorExternally
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
        fromDisplayName,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        body: sendBody,
        bodyHtml: sendBody,
        bodyText: messageText,
        attachments,
        headers: {
          "X-AngelCare-Operator-ID": operatorIdentity.id,
          "X-AngelCare-Operator-Name": operatorIdentity.fullName,
          "X-AngelCare-Operator-Role": operatorIdentity.role
        }
      })

      const sentAt = nowIso()

      await db.from("email_os_core_outbox").update({
        mailbox_id: identity.mailboxId,
        from_email: info.senderIdentity.fromAddress,
        sender_identity_id: info.senderIdentity.identityId,
        sender_identity_version: info.senderIdentity.version,
        resolved_from_name: info.senderIdentity.fromName,
        resolved_reply_to_name: info.senderIdentity.replyToName,
        resolved_reply_to_address: info.senderIdentity.replyToAddress,
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
          senderIdentity: info.senderIdentity,
          resolvedFromName: info.senderIdentity.fromName,
          smtpUser: identity.smtp.user,
          accepted: info.accepted || [],
          rejected: info.rejected || [],
          operator: {
            ...operatorSnapshot,
            externalDisplayName: info.senderIdentity.fromName,
            externallyExposed: exposeOperatorExternally
          },
          ac360Guarded: true,
        },
        sent_by_user_id: operatorSnapshot.userId,
        sent_by_name: operatorSnapshot.name,
        sent_by_email: operatorSnapshot.email,
        sent_by_role: operatorSnapshot.role,
        sent_by_department: operatorSnapshot.department,
        sent_by_title: operatorSnapshot.title,
      }).eq("id", outboxId).then(() => null, () => null)

      return {
        sent: true,
        outboxId,
        messageId: info.messageId || null,
        mailboxId: identity.mailboxId,
        mailboxKey: identity.key,
        from: info.senderIdentity.fromAddress,
        fromName: info.senderIdentity.fromName,
        senderIdentity: info.senderIdentity,
        attachmentCount: attachments.length,
        operator: operatorIdentity,
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
