import { emailOSFinalDb, finalId, nowIso } from "./final-db"

export async function writeFinalAudit(input: {
  action: string
  actorId?: string
  mailboxId?: string
  threadId?: string
  draftId?: string
  severity?: "info" | "warning" | "critical"
  details?: Record<string, unknown>
}) {
  const db = emailOSFinalDb()
  const event = {
    id: finalId("audit"),
    action: input.action,
    actor_id: input.actorId || null,
    mailbox_id: input.mailboxId || null,
    thread_id: input.threadId || null,
    draft_id: input.draftId || null,
    severity: input.severity || "info",
    details: input.details || {},
    created_at: nowIso()
  }

  const { error } = await db.from("email_os_audit_events").insert(event)
  if (error) throw error
  return event
}
