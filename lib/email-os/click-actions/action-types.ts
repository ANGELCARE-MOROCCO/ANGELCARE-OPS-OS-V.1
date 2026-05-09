export type EmailOSClickAction =
  | "thread.read"
  | "thread.archive"
  | "thread.resolve"
  | "thread.assign"
  | "thread.escalate"
  | "thread.snooze"
  | "thread.tag"
  | "compose.send"
  | "compose.saveDraft"
  | "approval.approve"
  | "approval.reject"
  | "template.create"
  | "template.update"
  | "template.delete"
  | "mailbox.create"
  | "mailbox.update"
  | "mailbox.delete"
  | "queue.retry"
  | "sync.mailbox"
  | "audit.open"
  | "automation.create"
  | "automation.toggle"

export type EmailOSActionPayload = {
  threadId?: string
  mailboxId?: string
  draftId?: string
  templateId?: string
  mailboxName?: string
  address?: string
  to?: string
  subject?: string
  text?: string
  html?: string
  decision?: "approved" | "rejected"
  reason?: string
  action?: string
  value?: unknown
  data?: Record<string, unknown>
}

export type EmailOSActionResult = {
  ok: boolean
  action: EmailOSClickAction
  message: string
  data?: unknown
  error?: string
}
