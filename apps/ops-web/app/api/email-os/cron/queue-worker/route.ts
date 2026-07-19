import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { sendEmailOSDirect } from "@/lib/email-os-core/send-mail"

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeAttachments(value: unknown) {
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

  const configured = clean(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL)
  if (configured) return configured.startsWith("http") ? configured.replace(/\/+$/, "") : `https://${configured.replace(/\/+$/, "")}`

  const origin = clean(request.headers.get("origin"))
  if (origin) return origin.replace(/\/+$/, "")

  const host = clean(request.headers.get("host"))
  if (!host) return ""
  const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https"
  return `${proto}://${host}`
}

function withTrackingPixel(message: string, baseUrl: string, trackingId: string) {
  if (!trackingId || !baseUrl) return message
  const src = `${baseUrl}/api/email-os/tracking/open/${encodeURIComponent(trackingId)}.gif`
  return `${message}<img src="${src}" width="1" height="1" alt="" style="display:none;opacity:0;width:1px;height:1px" />`
}

export async function POST(request: Request) {
  const db = createEmailOSCoreDb()
  const now = nowIso()

  try {
    const { data: queueRows, error } = await db
      .from("email_os_core_queue")
      .select("*")
      .in("status", ["queued", "pending", "retry"])
      .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
      .order("scheduled_at", { ascending: true, nullsFirst: true })
      .limit(10)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const rows = queueRows || []
    const results: any[] = []

    for (const row of rows) {
      const outboxId = clean(row.outbox_id || row.outboxId || row.payload?.outboxId)
      const attemptNumber = Number(row.attempts || 0) + 1

      await db.from("email_os_core_queue").update({
        status: "processing",
        attempts: attemptNumber,
        updated_at: nowIso(),
        last_error: null,
      }).eq("id", row.id).then(() => null, () => null)

      let outbox: any = null
      if (outboxId) {
        const { data } = await db.from("email_os_core_outbox").select("*").eq("id", outboxId).maybeSingle()
        outbox = data
      }

      try {
        const payload = { ...(row.payload || {}), ...(outbox || {}) }
        const mailboxId = clean(payload.mailbox_id || payload.mailboxId)
        const fromEmail = clean(payload.from_email || payload.fromEmail)
        const toEmail = clean(payload.to_email || payload.toEmail)
        const ccEmail = clean(payload.cc_email || payload.ccEmail)
        const bccEmail = clean(payload.bcc_email || payload.bccEmail)
        const subject = clean(payload.subject) || "(Sans objet)"
        const messageHtml = clean(row.payload?.bodyHtml || row.payload?.body_html || payload.body_html || payload.body || payload.message)
        const messageText = clean(row.payload?.bodyText || row.payload?.body_text || payload.body_text || payload.text)
        const attachments = normalizeAttachments(row.payload?.attachments || payload.attachments)
        const trackingEnabled = row.payload?.tracking !== false && row.payload?.tracking !== "false" && payload.tracking_enabled !== false
        const trackingId = trackingEnabled ? clean(payload.tracking_id) || makeEmailOSId() : ""
        const sendHtml = trackingEnabled ? withTrackingPixel(messageHtml, absoluteBaseUrl(request), trackingId) : messageHtml
        const operatorName = clean(payload.sent_by_name || payload.created_by_name || row.payload?.sentBy?.name || payload.diagnostics?.operator?.name)
        const operatorId = clean(payload.sent_by_user_id || payload.created_by_user_id || row.payload?.sentBy?.userId)
        const operatorRole = clean(payload.sent_by_role || payload.created_by_role || row.payload?.sentBy?.role)
        const mailboxDisplayName = clean(payload.mailbox_name || payload.diagnostics?.resolvedMailboxLabel || fromEmail || "AngelCare")
        const externalIdentityMode = clean(process.env.EMAIL_OS_EXTERNAL_OPERATOR_IDENTITY_MODE).toLowerCase()
        const fromDisplayName = externalIdentityMode === "operator" && operatorName ? `${operatorName} | ${mailboxDisplayName}` : mailboxDisplayName

        if (!mailboxId || !toEmail) {
          throw new Error("Scheduled queue payload is missing mailboxId or recipient.")
        }

        const { identity, info } = await sendEmailOSDirect({
          mailboxId,
          fromEmail,
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
            ...(operatorId ? { "X-AngelCare-Operator-ID": operatorId } : {}),
            ...(operatorName ? { "X-AngelCare-Operator-Name": operatorName } : {}),
            ...(operatorRole ? { "X-AngelCare-Operator-Role": operatorRole } : {})
          }
        })

        const sentAt = nowIso()
        const result = {
          messageId: info.messageId || null,
          mailboxKey: identity.key,
          mailboxId: identity.mailboxId,
          from: identity.smtp.from,
          accepted: info.accepted || [],
          rejected: info.rejected || [],
          attachmentCount: attachments.length,
          trackingId: trackingId || null,
          sentAt,
        }

        await db.from("email_os_core_queue").update({
          status: "sent",
          updated_at: sentAt,
          last_error: null,
          result,
          diagnostics: {
            ...(row.diagnostics || {}),
            transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail",
            resolvedMailboxKey: identity.key,
            resolvedMailboxId: identity.mailboxId,
            attachmentCount: attachments.length,
            content: {
              bodyText: messageText,
              bodyHtml: messageHtml,
            },
            tracking: { enabled: trackingEnabled, trackingId: trackingId || null }
          }
        }).eq("id", row.id).then(() => null, () => null)

        if (outboxId) {
          await db.from("email_os_core_outbox").update({
            status: "sent",
            provider_message_id: info.messageId || null,
            tracking_id: trackingId || null,
            tracking_enabled: trackingEnabled,
            sent_at: sentAt,
            updated_at: sentAt,
            mailbox_id: identity.mailboxId,
            from_email: identity.smtp.from,
            last_error: null,
            diagnostics: {
              ...(outbox?.diagnostics || {}),
              transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail",
              resolvedMailboxKey: identity.key,
              resolvedMailboxId: identity.mailboxId,
              smtpUser: identity.smtp.user,
              attachmentCount: attachments.length,
              content: {
                bodyText: messageText,
                bodyHtml: messageHtml,
              },
              tracking: { enabled: trackingEnabled, trackingId: trackingId || null }
            }
          }).eq("id", outboxId).then(() => null, () => null)
        }

        results.push({ id: row.id, outboxId, ok: true, ...result })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Queue send failed"
        const terminalFailure = attemptNumber >= 3
        const retryAt = new Date(Date.now() + Math.min(30, 5 * attemptNumber) * 60_000).toISOString()

        await db.from("email_os_core_queue").update({
          status: terminalFailure ? "failed" : "retry",
          scheduled_at: terminalFailure ? row.scheduled_at : retryAt,
          updated_at: nowIso(),
          last_error: message,
          result: { failedAt: nowIso(), error: message, attempt: attemptNumber }
        }).eq("id", row.id).then(() => null, () => null)

        if (outboxId) {
          await db.from("email_os_core_outbox").update({
            status: terminalFailure ? "failed" : "scheduled",
            updated_at: nowIso(),
            last_error: message,
          }).eq("id", outboxId).then(() => null, () => null)
        }

        results.push({ id: row.id, outboxId, ok: false, retry: !terminalFailure, error: message })
      }
    }

    return NextResponse.json({ ok: true, data: results, processed: rows.length })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Queue worker failed" },
      { status: 500 }
    )
  }
}
