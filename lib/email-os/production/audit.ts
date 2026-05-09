
import { createEmailOSSupabaseClient } from "./supabase-server"
import type { EmailOSAuditEvent } from "./types"

export function createEmailOSId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createAuditEvent(input: Omit<EmailOSAuditEvent, "id" | "createdAt">): EmailOSAuditEvent {
  return {
    id: createEmailOSId("audit"),
    createdAt: new Date().toISOString(),
    ...input
  }
}

export async function persistAuditEvent(input: Omit<EmailOSAuditEvent, "id" | "createdAt">) {
  const event = createAuditEvent(input)
  const supabase = createEmailOSSupabaseClient()

  const { error } = await supabase.from("email_os_audit_events").insert({
    id: event.id,
    action: event.action,
    actor_id: event.actorId ?? null,
    mailbox_id: event.mailboxId ?? null,
    thread_id: event.threadId ?? null,
    draft_id: event.draftId ?? null,
    severity: event.severity,
    details: event.details ?? {},
    created_at: event.createdAt
  })

  if (error) throw error
  return event
}
