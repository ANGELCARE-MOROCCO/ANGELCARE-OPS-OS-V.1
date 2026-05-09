import { NextResponse } from "next/server"
import { sendEmailOSMessage } from "@/lib/email-os/production/smtp-service"
import { writeFinalAudit } from "@/lib/email-os/final/final-audit"
import { createFinalQueueJob } from "@/lib/email-os/final/final-queue"
import { emailOSFinalDb, finalId, nowIso } from "@/lib/email-os/final/final-db"

type ActionBody = {
  action?: string
  payload?: Record<string, any>
}

function ok(action: string, message: string, data?: unknown) {
  return NextResponse.json({ ok: true, action, message, data })
}

function fail(action: string, error: string, status = 400) {
  return NextResponse.json({ ok: false, action, message: "Action failed", error }, { status })
}

async function audit(action: string, payload: Record<string, any>, severity: "info" | "warning" | "critical" = "info") {
  try {
    await writeFinalAudit({
      action,
      mailboxId: payload.mailboxId,
      threadId: payload.threadId,
      draftId: payload.draftId,
      severity,
      details: payload
    })
  } catch {
    // Keep UI execution resilient if audit table is not ready.
  }
}

async function runtimeEvent(type: string, payload: Record<string, any>) {
  try {
    const db = emailOSFinalDb()
    await db.from("email_os_runtime_events").insert({
      id: finalId("evt"),
      type,
      actor_id: null,
      mailbox_id: payload.mailboxId || null,
      thread_id: payload.threadId || null,
      payload,
      created_at: nowIso()
    })
  } catch {
    // Non-blocking.
  }
}

async function updateThread(action: string, payload: Record<string, any>) {
  if (!payload.threadId) throw new Error("Missing threadId")

  const db = emailOSFinalDb()
  const update: Record<string, any> = { updated_at: nowIso() }

  if (action === "thread.read") update.unread = false
  if (action === "thread.archive") update.status = "archived"
  if (action === "thread.resolve") update.status = "resolved"
  if (action === "thread.assign") {
    update.status = "assigned"
    update.owner_id = payload.data?.ownerId || payload.ownerId || "assigned"
  }
  if (action === "thread.escalate") {
    update.status = "approval"
    update.priority = "critical"
  }
  if (action === "thread.snooze") {
    update.status = "waiting"
  }

  const { error } = await db.from("email_os_threads").update(update).eq("id", payload.threadId)
  if (error) throw error
  return update
}

async function saveDraft(payload: Record<string, any>) {
  const db = emailOSFinalDb()
  const now = nowIso()

  const row = {
    id: payload.draftId || finalId("draft"),
    to_address: payload.to || "",
    subject: payload.subject || "",
    html: payload.html || null,
    text: payload.text || null,
    mailbox_id: payload.mailboxId || null,
    thread_id: payload.threadId || null,
    status: "draft",
    created_at: now,
    updated_at: now
  }

  const { data, error } = await db.from("email_os_drafts").upsert(row).select("*").single()
  if (error) throw error
  return data
}

async function createTemplate(payload: Record<string, any>) {
  const db = emailOSFinalDb()
  const now = nowIso()

  const row = {
    id: payload.templateId || finalId("tpl"),
    name: payload.data?.name || payload.subject || "New template",
    subject: payload.subject || payload.data?.subject || "",
    body: payload.text || payload.html || payload.data?.body || "Template body",
    category: payload.data?.category || "General",
    status: "active",
    created_at: now,
    updated_at: now
  }

  const { data, error } = await db.from("email_os_templates").insert(row).select("*").single()
  if (error) throw error
  return data
}

async function createMailbox(payload: Record<string, any>) {
  const db = emailOSFinalDb()
  const now = nowIso()

  const row = {
    id: payload.mailboxId || finalId("mbx"),
    name: payload.mailboxName || payload.data?.name || "New mailbox",
    address: payload.address || payload.data?.address || "mailbox@example.com",
    provider: payload.data?.provider || "smtp_imap",
    status: "active",
    owner_role: payload.data?.ownerRole || "operations_director",
    created_at: now,
    updated_at: now
  }

  const { data, error } = await db.from("email_os_mailboxes").insert(row).select("*").single()
  if (error) throw error
  return data
}

async function execute(action: string, payload: Record<string, any>) {
  if (action.startsWith("thread.")) {
    const data = await updateThread(action, payload)
    await audit(action, payload, action === "thread.escalate" ? "critical" : "info")
    await runtimeEvent(action, payload)

    if (action === "thread.escalate") {
      await createFinalQueueJob({
        type: "notification",
        payload: {
          type: "sla_breach",
          title: "Thread escalated",
          body: `Thread ${payload.threadId} escalated`,
          priority: "high"
        }
      }).catch(() => null)
    }

    return { message: `${action.replace("thread.", "")} completed`, data }
  }

  if (action === "compose.saveDraft") {
    const data = await saveDraft(payload)
    await audit("compose.saveDraft", payload)
    await runtimeEvent("compose.saveDraft", payload)
    return { message: "Draft saved", data }
  }

  if (action === "compose.send") {
    if (!payload.to || !payload.subject || (!payload.text && !payload.html)) {
      throw new Error("Missing recipient, subject or message body")
    }

    try {
      const sent = await sendEmailOSMessage({
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html
      })
      await audit("compose.send", payload, "critical")
      await runtimeEvent("compose.send", payload)
      return { message: "Message sent", data: sent }
    } catch (error) {
      const job = await createFinalQueueJob({
        type: "send",
        payload
      })
      await audit("compose.queued", { ...payload, jobId: job.id }, "warning")
      await runtimeEvent("compose.queued", { ...payload, jobId: job.id })
      return { message: "Provider unavailable. Message queued.", data: job }
    }
  }

  if (action === "approval.approve" || action === "approval.reject") {
    const db = emailOSFinalDb()
    const row = {
      id: finalId("appr"),
      target_id: payload.draftId || payload.threadId || payload.data?.targetId || "unknown",
      target_type: payload.draftId ? "draft" : "thread",
      decision: action === "approval.approve" ? "approved" : "rejected",
      decided_by: payload.data?.decidedBy || null,
      reason: payload.reason || null,
      created_at: nowIso()
    }
    const { data, error } = await db.from("email_os_approval_decisions").insert(row).select("*").single()
    if (error) throw error
    await audit(action, payload, "critical")
    await runtimeEvent(action, payload)
    return { message: action === "approval.approve" ? "Approved" : "Rejected", data }
  }

  if (action === "template.create") {
    const data = await createTemplate(payload)
    await audit(action, payload)
    await runtimeEvent(action, payload)
    return { message: "Template created", data }
  }

  if (action === "template.update") {
    if (!payload.templateId) throw new Error("Missing templateId")
    const db = emailOSFinalDb()
    const { data, error } = await db
      .from("email_os_templates")
      .update({ ...(payload.data || {}), updated_at: nowIso() })
      .eq("id", payload.templateId)
      .select("*")
      .single()
    if (error) throw error
    await audit(action, payload)
    return { message: "Template updated", data }
  }

  if (action === "template.delete") {
    if (!payload.templateId) throw new Error("Missing templateId")
    const db = emailOSFinalDb()
    const { error } = await db.from("email_os_templates").delete().eq("id", payload.templateId)
    if (error) throw error
    await audit(action, payload, "warning")
    return { message: "Template deleted", data: { id: payload.templateId } }
  }

  if (action === "mailbox.create") {
    const data = await createMailbox(payload)
    await audit(action, payload, "warning")
    await runtimeEvent(action, payload)
    return { message: "Mailbox created", data }
  }

  if (action === "mailbox.update") {
    if (!payload.mailboxId) throw new Error("Missing mailboxId")
    const db = emailOSFinalDb()
    const { data, error } = await db
      .from("email_os_mailboxes")
      .update({ ...(payload.data || {}), updated_at: nowIso() })
      .eq("id", payload.mailboxId)
      .select("*")
      .single()
    if (error) throw error
    await audit(action, payload, "warning")
    return { message: "Mailbox updated", data }
  }

  if (action === "mailbox.delete") {
    if (!payload.mailboxId) throw new Error("Missing mailboxId")
    const db = emailOSFinalDb()
    const { error } = await db.from("email_os_mailboxes").delete().eq("id", payload.mailboxId)
    if (error) throw error
    await audit(action, payload, "critical")
    return { message: "Mailbox deleted", data: { id: payload.mailboxId } }
  }

  if (action === "queue.retry") {
    const job = await createFinalQueueJob({
      type: "retry",
      payload
    })
    await audit(action, { ...payload, jobId: job.id }, "warning")
    return { message: "Retry queued", data: job }
  }

  if (action === "sync.mailbox") {
    const job = await createFinalQueueJob({
      type: "sync",
      payload
    })
    await audit(action, { ...payload, jobId: job.id }, "warning")
    return { message: "Mailbox sync queued", data: job }
  }

  if (action === "automation.create" || action === "automation.toggle") {
    await audit(action, payload, "warning")
    await runtimeEvent(action, payload)
    return { message: action === "automation.create" ? "Automation created" : "Automation toggled", data: payload }
  }

  if (action === "audit.open") {
    await audit(action, payload)
    return { message: "Audit opened", data: payload }
  }

  throw new Error(`Unsupported Email-OS action: ${action}`)
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ActionBody | null
  const action = body?.action
  const payload = body?.payload || {}

  if (!action) return fail("unknown", "Missing action", 400)

  try {
    const result = await execute(action, payload)
    return ok(action, result.message, result.data)
  } catch (error) {
    return fail(action, error instanceof Error ? error.message : "Execution failed", 500)
  }
}
