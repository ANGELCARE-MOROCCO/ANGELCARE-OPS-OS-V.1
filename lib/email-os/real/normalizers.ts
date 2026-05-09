export function normalizeRecord(entity: string, row: any) {
  if (!row) return row

  if (entity === "mailboxes") {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      provider: row.provider,
      status: row.status,
      unreadCount: row.unread_count ?? 0,
      ownerRole: row.owner_role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  if (entity === "templates") {
    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      category: row.category,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  if (entity === "automation") {
    return {
      id: row.id,
      name: row.name,
      trigger: row.trigger,
      action: row.action,
      enabled: row.enabled,
      status: row.enabled ? "enabled" : "disabled",
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  if (entity === "approvals") {
    return {
      id: row.id,
      targetId: row.target_id,
      targetType: row.target_type,
      decision: row.decision,
      decidedBy: row.decided_by,
      reason: row.reason,
      createdAt: row.created_at
    }
  }

  if (entity === "outbox") {
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      lastError: row.last_error,
      scheduledAt: row.scheduled_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      payload: row.payload
    }
  }

  if (entity === "audit") {
    return {
      id: row.id,
      action: row.action,
      actorId: row.actor_id,
      mailboxId: row.mailbox_id,
      threadId: row.thread_id,
      draftId: row.draft_id,
      severity: row.severity,
      details: row.details,
      createdAt: row.created_at
    }
  }

  if (entity === "runtime-events") {
    return {
      id: row.id,
      type: row.type,
      actorId: row.actor_id,
      mailboxId: row.mailbox_id,
      threadId: row.thread_id,
      payload: row.payload,
      createdAt: row.created_at
    }
  }

  return row
}

export function toDbPayload(entity: string, payload: any) {
  const now = new Date().toISOString()

  if (entity === "mailboxes") {
    return {
      id: payload.id,
      name: payload.name,
      address: payload.address,
      provider: payload.provider || "smtp_imap",
      status: payload.status || "active",
      unread_count: payload.unreadCount ?? 0,
      owner_role: payload.ownerRole || "operations_director",
      updated_at: now,
      ...(payload.createdAt ? {} : { created_at: now })
    }
  }

  if (entity === "templates") {
    return {
      id: payload.id,
      name: payload.name,
      subject: payload.subject || "",
      body: payload.body || "",
      category: payload.category || "General",
      status: payload.status || "active",
      updated_at: now,
      ...(payload.createdAt ? {} : { created_at: now })
    }
  }

  if (entity === "automation") {
    return {
      id: payload.id,
      name: payload.name,
      trigger: payload.trigger || "",
      action: payload.action || "",
      enabled: Boolean(payload.enabled),
      updated_at: now,
      ...(payload.createdAt ? {} : { created_at: now })
    }
  }

  if (entity === "outbox") {
    return {
      id: payload.id,
      type: payload.type || "send",
      status: payload.status || "queued",
      attempts: payload.attempts ?? 0,
      max_attempts: payload.maxAttempts ?? 3,
      payload: payload.payload || {},
      last_error: payload.lastError || null,
      scheduled_at: payload.scheduledAt || now,
      updated_at: now,
      ...(payload.createdAt ? {} : { created_at: now })
    }
  }

  return payload
}
