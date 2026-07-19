import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { auditMailboxAccessEvent, requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { getEmailOSBridgeFailureDiagnostics, sendEmailOSDirect } from "@/lib/email-os-core/send-mail"
import { emailOSOperatorSnapshot, resolveEmailOSOperatorIdentity } from "@/lib/email-os-core/operator-identity"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

function decodeHtmlEntities(value: unknown) {
  let output = String(value || "")

  for (let pass = 0; pass < 3; pass += 1) {
    const before = output
    output = output
      .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
      .replace(/&nbsp;/gi, " ")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;|&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
    if (output === before) break
  }

  return output
}

function normalizeHtmlBody(value: unknown) {
  const raw = clean(value)
  if (!raw) return ""

  const containsHtml = /<[a-z][\s\S]*>/i.test(raw)
  const containsEncodedHtml = /&lt;\/?[a-z][\s\S]*?&gt;/i.test(raw) || /&amp;lt;\/?[a-z][\s\S]*?&amp;gt;/i.test(raw)
  return !containsHtml && containsEncodedHtml ? decodeHtmlEntities(raw) : raw
}

function htmlToPlainText(value: unknown) {
  return decodeHtmlEntities(
    String(value || "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n")
      .replace(/<li(?:\s[^>]*)?>/gi, "- ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
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
  const explicitPublic = clean(process.env.EMAIL_OS_PUBLIC_APP_URL)
  if (explicitPublic) return explicitPublic.startsWith("http") ? explicitPublic.replace(/\/+$/, "") : `https://${explicitPublic.replace(/\/+$/, "")}`

  const appUrl = clean(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL)
  if (appUrl) return appUrl.startsWith("http") ? appUrl.replace(/\/+$/, "") : `https://${appUrl.replace(/\/+$/, "")}`

  const origin = clean(request.headers.get("origin"))
  if (origin) return origin.replace(/\/+$/, "")

  const forwardedHost = clean(request.headers.get("x-forwarded-host"))
  const forwardedProto = clean(request.headers.get("x-forwarded-proto")) || "https"
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "")

  const host = clean(request.headers.get("host"))
  if (host) {
    const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https"
    return `${proto}://${host}`.replace(/\/+$/, "")
  }

  return ""
}

function trackingPixelUrl(baseUrl: string, trackingId: string) {
  if (!trackingId || !baseUrl) return ""
  return `${baseUrl}/api/email-os/tracking/open/${encodeURIComponent(trackingId)}.gif`
}

function withTrackingPixel(message: string, baseUrl: string, trackingId: string) {
  const src = trackingPixelUrl(baseUrl, trackingId)
  if (!trackingId || !src) return message || ""
  const pixel = `<img src="${src}" width="1" height="1" alt="" border="0" />`
  return `${message || ""}\n\n${pixel}`
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
    const messageHtml = normalizeHtmlBody(body.bodyHtml || body.body_html || body.body || body.html || body.message)
    const messageText = clean(body.bodyText || body.body_text || body.text) || htmlToPlainText(messageHtml)
    const priority = clean(body.priority) || "normal"
    const attachments = normalizeAttachmentsForSend(body.attachments)
    const trackingEnabled = body.tracking !== false && body.tracking !== "false"
    const sourceTemplateId = clean(body.templateId || body.template_id)
    const sourceTemplateVersion = Number(body.templateVersion || body.template_version || 0)
    const trackingId = trackingEnabled ? makeEmailOSId() : ""
    const trackingBaseUrl = absoluteBaseUrl(request)
    const trackingUrl = trackingPixelUrl(trackingBaseUrl, trackingId)
    const sendHtml = trackingEnabled ? withTrackingPixel(messageHtml, trackingBaseUrl, trackingId) : messageHtml

    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "Recipient is required" }, { status: 400 })
    }

    db = createEmailOSCoreDb()
    const operatorIdentity = await resolveEmailOSOperatorIdentity(db, user.id, {
      id: user.id,
      name: user.name || undefined,
      email: user.email || undefined,
      role: user.role || undefined
    })
    const operatorSnapshot = emailOSOperatorSnapshot(operatorIdentity)

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

    const externalIdentityMode = clean(body.externalOperatorIdentityMode || body.external_operator_identity_mode || process.env.EMAIL_OS_EXTERNAL_OPERATOR_IDENTITY_MODE).toLowerCase()
    const exposeOperatorExternally = body.externalOperatorIdentity === true || body.external_operator_identity === true || externalIdentityMode === "operator"
    const mailboxDisplayName = clean(access.mailbox?.name || resolvedFrom || "AngelCare")
    const fromDisplayName = exposeOperatorExternally ? `${operatorIdentity.fullName} | ${mailboxDisplayName}` : mailboxDisplayName

    const now = nowIso()
    outboxId = makeEmailOSId()

    await db.from("email_os_core_outbox").insert({
      id: outboxId,
      mailbox_id: mailboxScope.mailboxId,
      to_email: toEmail,
      cc_email: ccEmail || null,
      bcc_email: bccEmail || null,
      subject,
      body: messageHtml,
      status: "sending",
      provider_message_id: null,
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
        content: {
          bodyText: messageText,
          bodyHtml: messageHtml,
        },
        operator: {
          ...operatorSnapshot,
          externalDisplayName: fromDisplayName,
          externallyExposed: exposeOperatorExternally
        },
        template: sourceTemplateId ? { id: sourceTemplateId, version: sourceTemplateVersion || null } : null,
        tracking: {
          enabled: trackingEnabled,
          trackingId: trackingId || null,
          status: trackingEnabled ? "active_not_opened" : "off",
          url: trackingUrl || null,
          baseUrl: trackingBaseUrl || null,
          bodyPreview: sendHtml.slice(-500)
        },
      },
      queue_id: null,
      from_email: resolvedFrom || null,
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
      body: sendHtml,
      bodyHtml: sendHtml,
      bodyText: messageText,
      attachments,
      headers: {
        "X-AngelCare-Operator-ID": operatorIdentity.id,
        "X-AngelCare-Operator-Name": operatorIdentity.fullName,
        "X-AngelCare-Operator-Role": operatorIdentity.role
      }
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
          content: {
            bodyText: messageText,
            bodyHtml: messageHtml,
          },
          tracking: {
            enabled: trackingEnabled,
            trackingId: trackingId || null,
            status: trackingEnabled ? "active_not_opened" : "off"
          },
          accepted: info.accepted || [],
          rejected: info.rejected || [],
          operator: {
            ...operatorSnapshot,
            externalDisplayName: fromDisplayName,
            externallyExposed: exposeOperatorExternally
          },
          template: sourceTemplateId ? { id: sourceTemplateId, version: sourceTemplateVersion || null } : null,
        },
        sent_by_user_id: operatorSnapshot.userId,
        sent_by_name: operatorSnapshot.name,
        sent_by_email: operatorSnapshot.email,
        sent_by_role: operatorSnapshot.role,
        sent_by_department: operatorSnapshot.department,
        sent_by_title: operatorSnapshot.title,
        last_error: null,
      })
      .eq("id", outboxId)
      .then(() => null, () => null)

    if (sourceTemplateId) {
      const { data: templateUsageRow } = await db
        .from("email_os_mailbox_templates")
        .select("usage_count,current_version,name")
        .eq("mailbox_id", mailboxScope.mailboxId)
        .eq("id", sourceTemplateId)
        .maybeSingle()
        .then((result: any) => result, () => ({ data: null }))

      if (templateUsageRow) {
        await db.from("email_os_template_usage_events").insert({
          id: makeEmailOSId(),
          mailbox_id: mailboxScope.mailboxId,
          template_id: sourceTemplateId,
          version_number: sourceTemplateVersion || Number(templateUsageRow.current_version || 0) || null,
          action: "sent",
          outbox_id: outboxId,
          actor_user_id: user.id,
          created_at: sentAt
        }).then(() => null, () => null)

        await db.from("email_os_mailbox_templates").update({
          usage_count: Number(templateUsageRow.usage_count || 0) + 1,
          last_used_at: sentAt,
          last_used_by_user_id: user.id,
          updated_at: sentAt
        }).eq("mailbox_id", mailboxScope.mailboxId).eq("id", sourceTemplateId).then(() => null, () => null)

        await db.from("email_os_template_audit_events").insert({
          id: makeEmailOSId(),
          mailbox_id: mailboxScope.mailboxId,
          template_id: sourceTemplateId,
          template_name_snapshot: templateUsageRow.name || null,
          event_type: "template_sent",
          actor_user_id: user.id,
          actor_name_snapshot: operatorIdentity.fullName,
          version_number: sourceTemplateVersion || Number(templateUsageRow.current_version || 0) || null,
          details: { outboxId, providerMessageId: info.messageId || null },
          created_at: sentAt
        }).then(() => null, () => null)
      }
    }

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
        tracking: {
          enabled: trackingEnabled,
          trackingId: trackingId || null,
          status: trackingEnabled ? "active_not_opened" : "off",
          url: trackingUrl || null,
          baseUrl: trackingBaseUrl || null,
          bodyPreview: sendHtml.slice(-500)
        },
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
        templateId: sourceTemplateId || null,
        templateVersion: sourceTemplateVersion || null,
        operator: operatorIdentity,
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
