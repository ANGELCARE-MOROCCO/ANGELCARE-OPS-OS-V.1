export const EMAIL_OS_ENTITIES = ["mailboxes", "templates", "threads", "drafts", "queue", "audit", "automation"] as const

export type EmailOSEntity = (typeof EMAIL_OS_ENTITIES)[number]

export function isEmailOSEntity(value: string): value is EmailOSEntity {
  return EMAIL_OS_ENTITIES.includes(value as EmailOSEntity)
}

export const EMAIL_OS_TABLES: Record<EmailOSEntity, string> = {
  mailboxes: "email_os_core_mailboxes",
  templates: "email_os_core_templates",
  threads: "email_os_core_threads",
  drafts: "email_os_core_drafts",
  queue: "email_os_core_queue",
  audit: "email_os_core_audit",
  automation: "email_os_core_automation"
}

export function makeEmailOSId() {
  return crypto.randomUUID()
}

export function nowIso() {
  return new Date().toISOString()
}
