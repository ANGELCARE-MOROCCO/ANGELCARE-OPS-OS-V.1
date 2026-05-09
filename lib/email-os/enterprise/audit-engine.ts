
import { createExecutionId } from "./execution-engine"

export type EmailAuditEvent = {
  id: string
  action: string
  actorId?: string
  mailboxId?: string
  threadId?: string
  draftId?: string
  severity: "info" | "warning" | "critical"
  details?: Record<string, unknown>
  createdAtIso: string
}

export function createEmailAuditEvent(input: Omit<EmailAuditEvent, "id" | "createdAtIso">): EmailAuditEvent {
  return {
    id: createExecutionId("audit"),
    createdAtIso: new Date().toISOString(),
    ...input
  }
}

export function auditSeverityForAction(action: string): EmailAuditEvent["severity"] {
  if (["send", "approve", "reject", "credential_update", "permission_update"].includes(action)) return "critical"
  if (["sync", "retry", "escalate", "archive"].includes(action)) return "warning"
  return "info"
}
