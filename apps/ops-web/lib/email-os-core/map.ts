import type { EmailOSEntity } from "./schema"

export function normalize(entity: EmailOSEntity, row: any) {
  if (!row) return row

  if (entity === "mailboxes") {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      provider: row.provider,
      status: row.status,
      owner: row.owner,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  if (entity === "templates") {
    return { id: row.id, name: row.name, subject: row.subject, body: row.body, category: row.category, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at }
  }

  if (entity === "threads") {
    return { id: row.id, mailboxId: row.mailbox_id, fromEmail: row.from_email, subject: row.subject, preview: row.preview, status: row.status, priority: row.priority, owner: row.owner, createdAt: row.created_at, updatedAt: row.updated_at }
  }

  if (entity === "drafts") {
    return { id: row.id, mailboxId: row.mailbox_id, toEmail: row.to_email, subject: row.subject, body: row.body, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at }
  }

  if (entity === "queue") {
    return { id: row.id, type: row.type, status: row.status, payload: row.payload || {}, attempts: row.attempts, lastError: row.last_error, scheduledAt: row.scheduled_at, createdAt: row.created_at, updatedAt: row.updated_at }
  }

  if (entity === "audit") {
    return { id: row.id, action: row.action, targetType: row.target_type, targetId: row.target_id, severity: row.severity, details: row.details || {}, createdAt: row.created_at }
  }

  if (entity === "automation") {
    return { id: row.id, name: row.name, trigger: row.trigger, action: row.action, enabled: row.enabled, createdAt: row.created_at, updatedAt: row.updated_at }
  }

  return row
}

export function toDb(entity: EmailOSEntity, input: any) {
  const now = new Date().toISOString()

  if (entity === "mailboxes") return { id: input.id, name: input.name || "Mailbox", address: input.address || "", provider: input.provider || "smtp_imap", status: input.status || "active", owner: input.owner || "operations", created_at: input.createdAt ? undefined : now, updated_at: now }
  if (entity === "templates") return { id: input.id, name: input.name || "Template", subject: input.subject || "", body: input.body || "", category: input.category || "General", status: input.status || "active", created_at: input.createdAt ? undefined : now, updated_at: now }
  if (entity === "threads") return { id: input.id, mailbox_id: input.mailboxId || null, from_email: input.fromEmail || "", subject: input.subject || "", preview: input.preview || "", status: input.status || "open", priority: input.priority || "normal", owner: input.owner || null, created_at: input.createdAt ? undefined : now, updated_at: now }
  if (entity === "drafts") return { id: input.id, mailbox_id: input.mailboxId || null, to_email: input.toEmail || "", subject: input.subject || "", body: input.body || "", status: input.status || "draft", created_at: input.createdAt ? undefined : now, updated_at: now }
  if (entity === "queue") return { id: input.id, type: input.type || "send", status: input.status || "queued", payload: input.payload || {}, attempts: Number(input.attempts || 0), last_error: input.lastError || null, scheduled_at: input.scheduledAt || now, created_at: input.createdAt ? undefined : now, updated_at: now }
  if (entity === "audit") return { id: input.id, action: input.action || "manual", target_type: input.targetType || null, target_id: input.targetId || null, severity: input.severity || "info", details: input.details || {}, created_at: now }
  if (entity === "automation") return { id: input.id, name: input.name || "Rule", trigger: input.trigger || "", action: input.action || "", enabled: Boolean(input.enabled), created_at: input.createdAt ? undefined : now, updated_at: now }
  return input
}

export function cleanUndefined<T extends Record<string, any>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined))
}
