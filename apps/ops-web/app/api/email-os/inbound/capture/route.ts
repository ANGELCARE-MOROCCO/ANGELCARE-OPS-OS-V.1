import { NextResponse } from "next/server"
import crypto from "crypto"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"
import {
  buildEmailOSInboundIdentity,
  buildEmailOSInboundIdentityFromRow,
  emailOSInboundIdentityIntersects,
  loadEmailOSInboundSuppressionKeys
} from "@/lib/email-os-core/inbound-identity"

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

    const identity = buildEmailOSInboundIdentity({
      mailboxId,
      providerUid: body.providerUid || body.provider_uid,
      externalId: body.externalId || body.external_id,
      messageId,
      fromEmail,
      toEmail,
      ccEmail: body.cc,
      subject,
      date,
      text,
      html
    })
    const providerUid = identity.canonicalProviderUid

    const row = {
      id: makeEmailOSId(),
      mailbox_id: mailboxId,
      provider_uid: providerUid,
      ingest_key: identity.ingestKey,
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

    const suppressionKeys = await loadEmailOSInboundSuppressionKeys(db, mailboxId)
    if (emailOSInboundIdentityIntersects(suppressionKeys, identity.keys)) {
      return NextResponse.json({
        ok: true,
        data: {
          captured: false,
          operation: "suppressed",
          mailboxId,
          providerUid,
          ingestKey: identity.ingestKey
        }
      })
    }

    const { data: candidates, error: lookupError } = await db
      .from("email_os_core_inbox")
      .select("id,mailbox_id,provider_uid,ingest_key,subject,from_email,to_email,preview,status,folder,raw,created_at,updated_at")
      .eq("mailbox_id", mailboxId)
      .order("created_at", { ascending: false })
      .limit(2500)

    if (lookupError) {
      return NextResponse.json({ ok: false, error: lookupError.message }, { status: 500 })
    }

    const existing = (candidates || []).find((candidate: any) =>
      emailOSInboundIdentityIntersects(
        buildEmailOSInboundIdentityFromRow(candidate).keys,
        identity.keys
      )
    ) || null

    let savedId = row.id
    let operation: "inserted" | "updated" = "inserted"

    if (existing?.id) {
      savedId = existing.id
      operation = "updated"

      const { error: updateError } = await db
        .from("email_os_core_inbox")
        .update({
          provider_uid: row.provider_uid,
          ingest_key: row.ingest_key,
          subject: row.subject,
          from_email: row.from_email,
          to_email: row.to_email,
          preview: row.preview,
          ...(["read", "archived", "trash", "trashed", "spam", "deleted"].includes(String(existing.status || "").toLowerCase())
            ? {}
            : { status: row.status, label: row.label, folder: row.folder }),
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
        ingestKey: identity.ingestKey,
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
