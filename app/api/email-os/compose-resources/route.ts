import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"

async function safeSelect(db: any, table: string) {
  try {
    const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false })
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

function normalizeDbMailbox(row: any) {
  const email =
    row?.email_address ||
    row?.address ||
    row?.email ||
    row?.from_email ||
    row?.username ||
    ""

  return {
    id: row?.id || `mbx_${String(email).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`,
    mailbox_id: row?.id || `mbx_${String(email).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`,
    key: row?.key || row?.code || "",
    name: row?.name || row?.label || row?.title || email || row?.id || "Mailbox",
    label: row?.name || row?.label || row?.title || email || row?.id || "Mailbox",
    email,
    email_address: email,
    address: email,
    from_email: email,
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
    name: `${mailbox.label} Inbox`,
    label: `${mailbox.label} Inbox`,
    email: mailbox.email,
    email_address: mailbox.email,
    address: mailbox.email,
    from_email: mailbox.email,
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
    raw: {
      key: mailbox.key,
      label: mailbox.label,
      mailboxId: mailbox.mailboxId
    }
  }
}

function normalizeTemplate(row: any) {
  return {
    id: row?.id,
    name: row?.name || row?.title || row?.template_name || "Untitled template",
    subject: row?.subject || row?.title || row?.name || "",
    body: row?.body || row?.content || row?.description || row?.instructions || "",
    category: row?.category || row?.department || row?.type || "General",
    priority: row?.priority || "normal",
    tone: row?.tone || "professional",
    variables: row?.variables || {},
    raw: row
  }
}

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const envMailboxes = listEmailOSMultiMailboxes().map(normalizeEnvMailbox)

    const [dbMailboxesRaw, coreTemplatesRaw, entityTemplatesRaw] = await Promise.all([
      safeSelect(db, "email_os_core_mailboxes"),
      safeSelect(db, "email_os_core_templates"),
      safeSelect(db, "email_os_core_entities")
    ])

    const dbMailboxes = (dbMailboxesRaw || []).map(normalizeDbMailbox)

    /*
      Compose must never lose mailboxes just because DB rows are missing/stale.
      Env mailboxes are the production source of truth for SMTP identity.
      DB rows are merged only as enrichment.
    */
    const byEmail = new Map<string, any>()

    for (const mailbox of dbMailboxes) {
      if (mailbox.email) byEmail.set(String(mailbox.email).toLowerCase(), mailbox)
    }

    for (const mailbox of envMailboxes) {
      const key = String(mailbox.email).toLowerCase()
      const existing = byEmail.get(key)

      byEmail.set(key, {
        ...(existing || {}),
        ...mailbox,
        name: existing?.name && existing.name !== existing.email ? existing.name : mailbox.name,
        label: existing?.label && existing.label !== existing.email ? existing.label : mailbox.label,
        source: existing ? "env+database" : "env"
      })
    }

    const templatesFromEntities = (entityTemplatesRaw || []).filter((row: any) => {
      const type = String(row?.entity || row?.type || row?.kind || row?.category || "").toLowerCase()
      return type.includes("template")
    })

    const templates = [...(coreTemplatesRaw || []), ...templatesFromEntities].map(normalizeTemplate)

    const mailboxes = Array.from(byEmail.values()).sort((a, b) => {
      const aName = String(a.name || a.email || "")
      const bName = String(b.name || b.email || "")
      return aName.localeCompare(bName)
    })

    return NextResponse.json({
      ok: true,
      data: {
        mailboxes,
        templates,
        diagnostics: {
          envMailboxCount: envMailboxes.length,
          dbMailboxCount: dbMailboxes.length,
          finalMailboxCount: mailboxes.length,
          templateCount: templates.length
        }
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Compose resources failed"
      },
      { status: 500 }
    )
  }
}
