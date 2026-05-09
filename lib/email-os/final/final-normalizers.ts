export function normalizeMailbox(row: any) {
  return {
    id: String(row.id),
    name: String(row.name || row.label || "Mailbox"),
    address: String(row.address || row.email || ""),
    provider: String(row.provider || "smtp_imap"),
    status: String(row.status || "active"),
    unread: Number(row.unread || row.unread_count || 0),
    ownerRole: row.owner_role || row.ownerRole || null,
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null
  }
}

export function normalizeThread(row: any) {
  return {
    id: String(row.id),
    sender: String(row.sender || row.from_name || row.from_email || "Unknown"),
    role: String(row.role || row.category || "Email"),
    subject: String(row.subject || "(No subject)"),
    preview: String(row.preview || row.snippet || row.body_preview || ""),
    mailbox: String(row.mailbox_name || row.mailbox || "Inbox"),
    mailboxId: row.mailbox_id || row.mailboxId || null,
    priority:
      row.priority === "critical" || row.priority === "Critical"
        ? "Critical"
        : row.priority === "high" || row.priority === "High"
          ? "High"
          : "Normal",
    status:
      row.status === "resolved"
        ? "Resolved"
        : row.status === "assigned"
          ? "Assigned"
          : row.status === "waiting"
            ? "Waiting"
            : row.status === "approval" || row.requires_approval
              ? "Approval"
              : "Open",
    time: row.received_at || row.created_at || "",
    unread: Boolean(row.unread || row.is_unread),
    starred: Boolean(row.starred || row.is_starred),
    attachments: Number(row.attachments || row.attachment_count || 0),
    labels: Array.isArray(row.labels) ? row.labels : [],
    receivedAt: row.received_at || row.created_at || null
  }
}

export function normalizeTemplate(row: any) {
  return {
    id: String(row.id),
    name: String(row.name || row.title || "Template"),
    subject: String(row.subject || ""),
    body: String(row.body || row.html || row.text || ""),
    category: String(row.category || "General"),
    status: String(row.status || "active"),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  }
}
