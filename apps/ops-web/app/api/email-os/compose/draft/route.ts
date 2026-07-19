import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { emailOSOperatorSnapshot, resolveEmailOSOperatorIdentity } from "@/lib/email-os-core/operator-identity"

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

function parseScheduledAt(value: unknown) {
  const raw = clean(value)
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = createEmailOSCoreDb()
    const body = await request.json().catch(() => ({}))
    const operatorIdentity = await resolveEmailOSOperatorIdentity(db, user.id, {
      id: user.id,
      name: user.name || undefined,
      email: user.email || undefined,
      role: user.role || undefined
    })
    const operatorSnapshot = emailOSOperatorSnapshot(operatorIdentity)
    const mailboxScope = await resolveMailboxScopeForUser(user.id, clean(body.mailboxId || body.mailbox_id) || null)
    const access = await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_send",
      request,
    })

    const requestedStatus = clean(body.status).toLowerCase() === "scheduled" ? "scheduled" : "draft"
    const scheduledAt = requestedStatus === "scheduled" ? parseScheduledAt(body.scheduledAt || body.scheduled_at) : null
    if (requestedStatus === "scheduled" && !scheduledAt) {
      return NextResponse.json({ ok: false, error: "A valid scheduledAt value is required." }, { status: 400 })
    }
    if (scheduledAt && new Date(scheduledAt).getTime() <= Date.now()) {
      return NextResponse.json({ ok: false, error: "Scheduled delivery must be in the future." }, { status: 400 })
    }

    const now = nowIso()
    const fromEmail = clean(access.mailbox?.address || access.mailbox?.name || "") || null
    const toEmail = clean(body.toEmail || body.to_email || body.to) || null
    const ccEmail = clean(body.ccEmail || body.cc_email || body.cc) || null
    const bccEmail = clean(body.bccEmail || body.bcc_email || body.bcc) || null
    const subject = clean(body.subject) || "(Sans objet)"
    const messageHtml = clean(body.bodyHtml || body.body_html || body.body || body.html || body.message)
    const messageText = clean(body.bodyText || body.body_text || body.text)
    const priority = clean(body.priority) || "normal"
    const attachments = normalizeAttachments(body.attachments)
    const trackingEnabled = body.tracking !== false && body.tracking !== "false"
    const sourceTemplateId = clean(body.templateId || body.template_id)
    const sourceTemplateVersion = Number(body.templateVersion || body.template_version || 0)
    const diagnostics = {
      ...(body.diagnostics || {}),
      route: "compose/draft",
      transport: requestedStatus === "scheduled" ? "scheduled-queue" : "draft-only",
      operator: operatorSnapshot,
      attachmentCount: attachments.length,
      content: {
        bodyText: messageText,
        bodyHtml: messageHtml,
      },
      tracking: { enabled: trackingEnabled },
      template: sourceTemplateId ? { id: sourceTemplateId, version: sourceTemplateVersion || null } : null,
      scheduledAt,
    }

    if (requestedStatus === "scheduled") {
      const outboxId = makeEmailOSId()
      const queueId = makeEmailOSId()

      const outboxRow = {
        id: outboxId,
        queue_id: queueId,
        mailbox_id: mailboxScope.mailboxId,
        from_email: fromEmail,
        to_email: toEmail,
        cc_email: ccEmail,
        bcc_email: bccEmail,
        subject,
        body: messageHtml,
        status: "scheduled",
        priority,
        template_key: sourceTemplateId || null,
        provider_message_id: null,
        last_error: null,
        diagnostics,
        scheduled_at: scheduledAt,
        tracking_enabled: trackingEnabled,
        sent_by_user_id: operatorSnapshot.userId,
        sent_by_name: operatorSnapshot.name,
        sent_by_email: operatorSnapshot.email,
        sent_by_role: operatorSnapshot.role,
        sent_by_department: operatorSnapshot.department,
        sent_by_title: operatorSnapshot.title,
        created_at: now,
        updated_at: now,
        sent_at: null,
      }

      const { error: outboxError } = await db.from("email_os_core_outbox").insert(outboxRow)
      if (outboxError) {
        return NextResponse.json({ ok: false, error: outboxError.message }, { status: 500 })
      }

      const queuePayload = {
        outboxId,
        mailboxId: mailboxScope.mailboxId,
        fromEmail,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        body: messageHtml,
        bodyHtml: messageHtml,
        bodyText: messageText,
        priority,
        attachments,
        tracking: trackingEnabled,
        templateId: sourceTemplateId || null,
        templateVersion: sourceTemplateVersion || null,
        diagnostics,
        sentBy: operatorSnapshot,
      }

      const { error: queueError } = await db.from("email_os_core_queue").insert({
        id: queueId,
        type: "send",
        status: "queued",
        mailbox_id: mailboxScope.mailboxId,
        outbox_id: outboxId,
        payload: queuePayload,
        attempts: 0,
        last_error: null,
        result: {},
        diagnostics,
        scheduled_at: scheduledAt,
        created_at: now,
        updated_at: now,
      })

      if (queueError) {
        await db.from("email_os_core_outbox").update({ status: "failed", last_error: queueError.message, updated_at: nowIso() }).eq("id", outboxId).then(() => null, () => null)
        return NextResponse.json({ ok: false, error: queueError.message }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        data: { id: outboxId, outboxId, queueId, status: "scheduled", scheduledAt }
      })
    }

    const id = makeEmailOSId()
    const row = {
      id,
      mailbox_id: mailboxScope.mailboxId,
      from_email: fromEmail,
      to_email: toEmail,
      cc_email: ccEmail,
      bcc_email: bccEmail,
      subject,
      body: messageHtml,
      status: "draft",
      priority,
      template_key: sourceTemplateId || null,
      created_by_user_id: operatorSnapshot.userId,
      created_by_name: operatorSnapshot.name,
      created_by_email: operatorSnapshot.email,
      created_by_role: operatorSnapshot.role,
      created_by_department: operatorSnapshot.department,
      created_by_title: operatorSnapshot.title,
      diagnostics,
      created_at: now,
      updated_at: now
    }

    const { data, error } = await db.from("email_os_core_drafts").insert(row).select("*").single()
    if (!error) return NextResponse.json({ ok: true, data })

    const fallback = await db.from("email_os_core_outbox").insert({
      id,
      queue_id: null,
      mailbox_id: mailboxScope.mailboxId,
      from_email: fromEmail,
      to_email: toEmail,
      cc_email: ccEmail,
      bcc_email: bccEmail,
      subject,
      body: messageHtml,
      status: "draft",
      priority,
      template_key: sourceTemplateId || null,
      provider_message_id: null,
      last_error: null,
      diagnostics,
      sent_by_user_id: operatorSnapshot.userId,
      sent_by_name: operatorSnapshot.name,
      sent_by_email: operatorSnapshot.email,
      sent_by_role: operatorSnapshot.role,
      sent_by_department: operatorSnapshot.department,
      sent_by_title: operatorSnapshot.title,
      created_at: now,
      updated_at: now,
      sent_at: null
    }).select("*").single()

    if (fallback.error) {
      return NextResponse.json({ ok: false, error: fallback.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: fallback.data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Draft save failed" },
      { status: 500 }
    )
  }
}
