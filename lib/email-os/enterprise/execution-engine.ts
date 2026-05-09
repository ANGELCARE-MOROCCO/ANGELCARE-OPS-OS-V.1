
export type EmailOSExecutionStatus =
  | "idle"
  | "loading"
  | "queued"
  | "processing"
  | "awaiting_approval"
  | "approved"
  | "sent"
  | "retrying"
  | "failed"
  | "completed"

export type EmailOSExecutionAction =
  | "compose"
  | "reply"
  | "approve"
  | "reject"
  | "send"
  | "queue"
  | "retry"
  | "assign"
  | "archive"
  | "escalate"
  | "sync"
  | "audit"
  | "configure"

export type EmailOSExecutionContext = {
  action: EmailOSExecutionAction
  actorId?: string
  mailboxId?: string
  threadId?: string
  draftId?: string
  messageId?: string
  payload?: Record<string, unknown>
}

export function createExecutionId(prefix = "exec") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function requireExecutionFields(
  context: EmailOSExecutionContext,
  fields: Array<keyof EmailOSExecutionContext>
) {
  const missing = fields.filter((field) => !context[field])

  if (missing.length > 0) {
    throw new Error(`Missing Email-OS execution fields: ${missing.join(", ")}`)
  }
}

export function classifyExecutionRisk(context: EmailOSExecutionContext) {
  if (context.action === "send" || context.action === "approve") return "high"
  if (context.action === "configure" || context.action === "sync") return "medium"
  if (context.action === "archive" || context.action === "assign") return "low"
  return "normal"
}
