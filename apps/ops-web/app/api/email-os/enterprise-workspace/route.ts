import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess } from "@/lib/email-os-core/access-governance"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"

async function safeSelect(db: any, table: string, limit = 500, mailboxId?: string | null) {
  try {
    let query = db.from(table).select("*").order("created_at", { ascending: false }).limit(limit)
    if (mailboxId && ['email_os_core_inbox', 'email_os_core_outbox', 'email_os_core_drafts', 'email_os_core_saved_drafts', 'email_os_core_threads', 'email_os_core_attachments', 'email_os_core_notes', 'email_os_core_comments'].includes(table)) {
      query = query.eq('mailbox_id', mailboxId)
    }
    const { data, error } = await query
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

function mailboxIdFromEmail(email: string) {
  return `mbx_${String(email || "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`
}

function normalizeDbMailbox(row: any) {
  const email = row?.email_address || row?.address || row?.email || row?.from_email || row?.username || ""
  return {
    id: row?.id || mailboxIdFromEmail(email),
    mailbox_id: row?.id || mailboxIdFromEmail(email),
    key: row?.key || row?.code || "",
    name: row?.name || row?.label || row?.title || email || row?.id || "Mailbox",
    label: row?.name || row?.label || row?.title || email || row?.id || "Mailbox",
    email,
    email_address: email,
    status: row?.status || "active",
    department: row?.department || row?.owner || "operations",
    provider: row?.provider || row?.type || "database",
    source: "database",
    raw: row
  }
}

function normalizeEnvMailbox(mailbox: any) {
  return {
    id: mailbox.mailboxId,
    mailbox_id: mailbox.mailboxId,
    key: mailbox.key,
    name: `${mailbox.label} Workspace`,
    label: `${mailbox.label} Workspace`,
    email: mailbox.email,
    email_address: mailbox.email,
    status: "active",
    department: mailbox.key.toLowerCase(),
    provider: "menara_smtp_pop",
    source: "env",
    smtp: {
      host: mailbox.smtp.host,
      port: mailbox.smtp.port,
      secure: mailbox.smtp.secure,
      user: mailbox.smtp.user,
      configured: Boolean(mailbox.smtp.pass)
    },
    incoming: {
      protocol: mailbox.incoming.protocol,
      host: mailbox.incoming.host,
      port: mailbox.incoming.port,
      secure: mailbox.incoming.secure,
      user: mailbox.incoming.user,
      configured: Boolean(mailbox.incoming.pass)
    },
    raw: { key: mailbox.key, label: mailbox.label, mailboxId: mailbox.mailboxId }
  }
}

function mergeMailboxes(dbRows: any[], envRows: any[]) {
  const byEmail = new Map<string, any>()
  for (const row of dbRows.map(normalizeDbMailbox)) {
    if (row.email) byEmail.set(String(row.email).toLowerCase(), row)
  }
  for (const row of envRows.map(normalizeEnvMailbox)) {
    const key = String(row.email).toLowerCase()
    const existing = byEmail.get(key)
    byEmail.set(key, {
      ...(existing || {}),
      ...row,
      name: existing?.name && existing.name !== existing.email ? existing.name : row.name,
      label: existing?.label && existing.label !== existing.email ? existing.label : row.label,
      department: existing?.department || row.department,
      status: existing?.status || row.status,
      source: existing ? "env+database" : "env"
    })
  }
  return Array.from(byEmail.values()).sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email)))
}

function templateFrom(row: any) {
  return {
    id: row?.id,
    name: row?.name || row?.title || row?.template_name || "Untitled template",
    subject: row?.subject || row?.title || row?.name || "",
    body: row?.body || row?.content || row?.description || row?.instructions || "",
    category: row?.category || row?.department || row?.type || "General",
    priority: row?.priority || "normal",
    tone: row?.tone || "professional",
    raw: row
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const mailboxId = String(url.searchParams.get("mailboxId") || "").trim()
    if (!mailboxId) {
      return NextResponse.json({ ok: false, error: 'Mailbox scope required.' }, { status: 403 })
    }

    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId,
      requiredPermission: 'can_read',
      request,
    })

    const db = createEmailOSCoreDb()
    const envRows = listEmailOSMultiMailboxes()
    const [dbMailboxes, inbox, outbox, draftsA, draftsB, templatesA, entities, audit, notes, comments, savedViews] = await Promise.all([
      safeSelect(db, "email_os_core_mailboxes"),
      safeSelect(db, "email_os_core_inbox", 600, mailboxId),
      safeSelect(db, "email_os_core_outbox", 600, mailboxId),
      safeSelect(db, "email_os_core_drafts", 300, mailboxId),
      safeSelect(db, "email_os_core_saved_drafts", 300, mailboxId),
      safeSelect(db, "email_os_core_templates", 400),
      safeSelect(db, "email_os_core_entities", 400),
      safeSelect(db, "email_os_core_audit", 120, mailboxId),
      safeSelect(db, "email_os_core_notes", 120, mailboxId),
      safeSelect(db, "email_os_core_comments", 120, mailboxId),
      safeSelect(db, "email_os_core_saved_views", 120)
    ])

    const entityTemplates = (entities || []).filter((row: any) => String(row?.entity || row?.type || row?.kind || row?.category || "").toLowerCase().includes("template"))
    const mailboxes = mergeMailboxes(dbMailboxes || [], envRows || []).filter((item) => !mailboxId || item.id === mailboxId || item.mailbox_id === mailboxId)
    const templates = [...(templatesA || []), ...entityTemplates].map(templateFrom)

    return NextResponse.json({
      ok: true,
      data: {
        mailboxes,
        inbox: inbox || [],
        outbox: outbox || [],
        drafts: [...(draftsA || []), ...(draftsB || [])],
        templates,
        audit: audit || [],
        notes: notes || [],
        comments: comments || [],
        savedViews: savedViews || [],
        diagnostics: {
          envMailboxCount: envRows.length,
          dbMailboxCount: dbMailboxes.length,
          finalMailboxCount: mailboxes.length,
          inboxCount: inbox.length,
          outboxCount: outbox.length,
          draftCount: (draftsA.length + draftsB.length),
          templateCount: templates.length
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Enterprise workspace load failed" }, { status: 500 })
  }
}
