
export type EmailOSId = string

export type EmailOSRole =
  | "ceo"
  | "operations_director"
  | "support_lead"
  | "support_agent"
  | "hr_manager"
  | "legal"
  | "viewer"

export type EmailOSPermission =
  | "email.read"
  | "email.compose"
  | "email.send"
  | "email.approve"
  | "email.configure"
  | "email.audit"
  | "email.automation"
  | "email.assign"
  | "email.archive"
  | "email.queue"
  | "email.sync"

export type EmailOSApiResponse<T = unknown> = {
  ok: boolean
  data?: T
  error?: string
  meta?: Record<string, unknown>
}

export type EmailOSMailbox = {
  id: EmailOSId
  name: string
  address: string
  provider: "smtp_imap" | "gmail" | "microsoft" | "custom"
  status: "active" | "paused" | "error"
  ownerRole?: EmailOSRole
  createdAt?: string
  updatedAt?: string
}

export type EmailOSAuditEvent = {
  id: EmailOSId
  action: string
  actorId?: string
  mailboxId?: string
  threadId?: string
  draftId?: string
  severity: "info" | "warning" | "critical"
  details?: Record<string, unknown>
  createdAt: string
}

export type EmailOSQueueJob = {
  id: EmailOSId
  type: "send" | "sync" | "retry" | "notification" | "sla"
  status: "queued" | "processing" | "completed" | "failed" | "retrying"
  attempts: number
  maxAttempts: number
  payload: Record<string, unknown>
  lastError?: string
  scheduledAt: string
  createdAt: string
  updatedAt: string
}

export type EmailOSApprovalPolicy = {
  id: EmailOSId
  name: string
  enabled: boolean
  mailboxIds: string[]
  requiresExternalApproval: boolean
  requiresAttachmentApproval: boolean
  riskThreshold: number
  approverRoles: EmailOSRole[]
}

export type EmailOSNotification = {
  id: EmailOSId
  type: "approval_required" | "sla_breach" | "queue_failed" | "message_sent" | "sync_completed" | "security_event"
  title: string
  body: string
  priority: "low" | "medium" | "high" | "critical"
  read: boolean
  createdAt: string
}
