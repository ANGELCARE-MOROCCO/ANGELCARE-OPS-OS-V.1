
import { createEmailOSSupabaseClient } from "@/lib/email-os/production/supabase-server"
import { evaluateEmailSla } from "@/lib/email-os/production/sla"
import { createQueueJob, persistQueueJob } from "@/lib/email-os/production/queue"
import { persistAuditEvent } from "@/lib/email-os/production/audit"
import { createRuntimeEvent } from "./repositories"

export async function runEmailOSSlaSweep() {
  const supabase = createEmailOSSupabaseClient()

  const { data: rules, error: rulesError } = await supabase
    .from("email_os_sla_rules")
    .select("*")
    .eq("enabled", true)

  if (rulesError) throw rulesError

  const { data: threads, error: threadError } = await supabase
    .from("email_os_threads")
    .select("*")
    .in("status", ["open", "pending", "awaiting_reply"])
    .limit(200)

  if (threadError) {
    return {
      checked: 0,
      breached: 0,
      warning: "email_os_threads table not available or incompatible",
      error: threadError.message
    }
  }

  let checked = 0
  let breached = 0

  for (const thread of threads || []) {
    for (const rule of rules || []) {
      checked += 1

      const evaluation = evaluateEmailSla(
        {
          id: rule.id,
          name: rule.name,
          responseMinutes: rule.response_minutes,
          priority: rule.priority,
          escalationRole: rule.escalation_role,
          enabled: rule.enabled
        },
        thread.received_at || thread.created_at || new Date().toISOString()
      )

      if (evaluation.breached) {
        breached += 1

        await persistAuditEvent({
          action: "sla.breach",
          severity: evaluation.risk === "critical" ? "critical" : "warning",
          mailboxId: thread.mailbox_id,
          threadId: thread.id,
          details: { ruleId: rule.id, evaluation }
        })

        await persistQueueJob(createQueueJob({
          type: "notification",
          payload: {
            type: "sla_breach",
            title: "Email SLA breach",
            body: `${rule.name} breached for thread ${thread.id}`,
            priority: evaluation.risk === "critical" ? "critical" : "high"
          }
        }))

        await createRuntimeEvent({
          type: "sla.breach",
          mailboxId: thread.mailbox_id,
          threadId: thread.id,
          payload: { ruleId: rule.id, evaluation }
        })
      }
    }
  }

  return { checked, breached }
}
