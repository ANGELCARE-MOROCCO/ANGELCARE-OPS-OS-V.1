export type RealEmailOSEntity =
  | "mailboxes"
  | "templates"
  | "automation"
  | "approvals"
  | "outbox"
  | "audit"
  | "runtime-events"
  | "threads"
  | "drafts"

export const realEmailOSTableMap: Record<RealEmailOSEntity, string> = {
  mailboxes: "email_os_mailboxes",
  templates: "email_os_templates",
  automation: "email_os_automation_rules",
  approvals: "email_os_approval_decisions",
  outbox: "email_os_queue_jobs",
  audit: "email_os_audit_events",
  "runtime-events": "email_os_runtime_events",
  threads: "email_os_threads",
  drafts: "email_os_drafts"
}

export function isRealEmailOSEntity(value: string): value is RealEmailOSEntity {
  return value in realEmailOSTableMap
}

export function createRealEmailOSId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function nowIso() {
  return new Date().toISOString()
}
