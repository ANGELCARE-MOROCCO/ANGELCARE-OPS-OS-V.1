export type LiveThread = {
  id: string
  sender: string
  role?: string
  subject: string
  preview: string
  mailbox: string
  mailboxId?: string
  priority: "Critical" | "High" | "Normal"
  status: "Open" | "Assigned" | "Waiting" | "Approval" | "Resolved"
  time: string
  unread?: boolean
  starred?: boolean
  attachments?: number
  labels: string[]
  receivedAt?: string
}

export type LiveComposePayload = {
  to: string
  subject: string
  html?: string
  text?: string
  mailboxId?: string
  threadId?: string
  requiresApproval?: boolean
}

export type LiveThreadAction =
  | "read"
  | "reply"
  | "archive"
  | "assign"
  | "tag"
  | "snooze"
  | "escalate"
  | "approve"
  | "resolve"
