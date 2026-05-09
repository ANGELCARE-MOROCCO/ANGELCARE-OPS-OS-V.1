import type { LiveThread } from "./live-types"

export function normalizeThreadRecord(raw: any): LiveThread {
  return {
    id: String(raw.id || raw.thread_id || `thr-${Date.now()}`),
    sender: String(raw.sender || raw.from_name || raw.from || "Unknown sender"),
    role: String(raw.role || raw.department || raw.category || "Email"),
    subject: String(raw.subject || "(No subject)"),
    preview: String(raw.preview || raw.snippet || raw.body_preview || ""),
    mailbox: String(raw.mailbox || raw.mailbox_name || "Inbox"),
    mailboxId: raw.mailbox_id || raw.mailboxId,
    priority: raw.priority === "critical" || raw.priority === "Critical"
      ? "Critical"
      : raw.priority === "high" || raw.priority === "High"
        ? "High"
        : "Normal",
    status: raw.status === "resolved"
      ? "Resolved"
      : raw.status === "assigned"
        ? "Assigned"
        : raw.status === "waiting"
          ? "Waiting"
          : raw.status === "approval" || raw.requires_approval
            ? "Approval"
            : "Open",
    time: String(raw.time || raw.received_at || raw.created_at || ""),
    unread: Boolean(raw.unread || raw.is_unread),
    starred: Boolean(raw.starred || raw.is_starred),
    attachments: Number(raw.attachments || raw.attachment_count || 0),
    labels: Array.isArray(raw.labels) ? raw.labels.map(String) : [],
    receivedAt: raw.received_at || raw.created_at
  }
}

export function normalizeThreadList(raw: any): LiveThread[] {
  if (Array.isArray(raw)) return raw.map(normalizeThreadRecord)
  if (Array.isArray(raw?.threads)) return raw.threads.map(normalizeThreadRecord)
  if (Array.isArray(raw?.data)) return raw.data.map(normalizeThreadRecord)
  return []
}
