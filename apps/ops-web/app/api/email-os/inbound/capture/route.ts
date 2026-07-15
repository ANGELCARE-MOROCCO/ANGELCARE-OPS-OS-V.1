import { NextResponse } from "next/server"
import crypto from "crypto"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"

function clean(value: unknown) {
  return String(value || "").trim()
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase()
}

function previewFrom(input: { text?: string; html?: string; body?: string; preview?: string }) {
  const raw = clean(input.preview || input.text || input.body || input.html)
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 240)
}

function makeProviderUid(input: {
  mailboxId: string
  fromEmail: string
  toEmail: string
  subject: string
  date: string
  messageId?: string
  text?: string
}) {
  if (input.messageId) return input.messageId

  const hash = crypto
    .createHash("sha256")
    .update([
      input.mailboxId,
      input.fromEmail,
      input.toEmail,
      input.subject,
      input.date,
      input.text || ""
    ].join("|"))
    .digest("hex")

  return `capture_${hash}`
}

function resolveMailboxId(input: { mailboxId?: string; toEmail?: string }) {
  const mailboxId = clean(input.mailboxId)
  if (mailboxId && mailboxId !== "all") return mailboxId

  const toEmail = normalizeEmail(input.toEmail)
  const mailbox = listEmailOSMultiMailboxes().find((item) => item.email.toLowerCase() === toEmail)
  return mailbox?.mailboxId || mailboxId
}

function authorized(request: Request) {
  const expected = process.env.EMAIL_OS_INTERNAL_TOKEN || process.env.EMAIL_OS_CRON_SECRET || ""
  if (!expected) return true

  const header =
    request.headers.get("x-email-os-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""

  return header === expected
}

export async function POST(request: Request) {
  try {
    if (!authorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized inbound capture request" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    const fromEmail = normalizeEmail(body.fromEmail || body.from || body.sender)
    const toEmail = normalizeEmail(body.toEmail || body.to || body.recipient)
    const subject = clean(body.subject) || "(no subject)"
    const text = clean(body.text || body.body || body.plain)
    const html = clean(body.html)
    const date = clean(body.date) || nowIso()
    const messageId = clean(body.messageId || body.message_id || body.providerUid || body.provider_uid)

    const mailboxId = resolveMailboxId({
      mailboxId: body.mailboxId || body.mailbox_id,
      toEmail
    })

    if (!mailboxId) {
      return NextResponse.json({ ok: false, error: "mailboxId or recognized toEmail is required" }, { status: 400 })
    }

    if (!fromEmail) {
      return NextResponse.json({ ok: false, error: "fromEmail is required" }, { status: 400 })
    }

    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "toEmail is required" }, { status: 400 })
    }

    const providerUid = makeProviderUid({
      mailboxId,
      fromEmail,
      toEmail,
      subject,
      date,
      messageId,
      text
    })

    const row = {
      id: makeEmailOSId(),
      mailbox_id: mailboxId,
      provider_uid: providerUid,
      subject,
      from_email: fromEmail,
      to_email: toEmail,
      preview: previewFrom({ text, html, body: body.body, preview: body.preview }),
      status: "received",
      label: "inbox",
      folder: "inbox",
      raw: {
        source: "capture_api",
        messageId: messageId || providerUid,
        from: body.from || fromEmail,
        to: body.to || toEmail,
        cc: body.cc || null,
        bcc: body.bcc || null,
        replyTo: body.replyTo || body.reply_to || null,
        subject,
        text,
        html,
        headers: body.headers || {},
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
        original: body
      },
      created_at: date,
      updated_at: nowIso()
    }

    const db = createEmailOSCoreDb()

    const { data: existing, error: lookupError } = await db
      .from("email_os_core_inbox")
      .select("id")
      .eq("mailbox_id", mailboxId)
      .eq("provider_uid", providerUid)
      .maybeSingle()

    if (lookupError) {
      return NextResponse.json({ ok: false, error: lookupError.message }, { status: 500 })
    }

    let savedId = row.id
    let operation: "inserted" | "updated" = "inserted"

    if (existing?.id) {
      savedId = existing.id
      operation = "updated"

      const { error: updateError } = await db
        .from("email_os_core_inbox")
        .update({
          subject: row.subject,
          from_email: row.from_email,
          to_email: row.to_email,
          preview: row.preview,
          status: row.status,
          label: row.label,
          folder: row.folder,
          raw: row.raw,
          updated_at: nowIso()
        })
        .eq("id", existing.id)

      if (updateError) {
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
      }
    } else {
      const { error: insertError } = await db
        .from("email_os_core_inbox")
        .insert(row)

      if (insertError) {
        return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        captured: true,
        operation,
        mailboxId,
        providerUid,
        id: savedId,
        subject,
        fromEmail,
        toEmail
      }
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Inbound capture failed" },
      { status: 500 }
    )
  }
}
