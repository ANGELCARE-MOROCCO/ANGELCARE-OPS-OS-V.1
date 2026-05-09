
import { createEmailOSSupabaseClient } from "@/lib/email-os/production/supabase-server"
import { createEmailOSId } from "@/lib/email-os/production/audit"

export async function listRuntimeQueueJobs(limit = 50) {
  const supabase = createEmailOSSupabaseClient()
  const { data, error } = await supabase
    .from("email_os_queue_jobs")
    .select("*")
    .order("scheduled_at", { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function claimNextQueueJobs(limit = 10) {
  const supabase = createEmailOSSupabaseClient()
  const { data, error } = await supabase
    .from("email_os_queue_jobs")
    .select("*")
    .in("status", ["queued", "retrying"])
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit)

  if (error) throw error

  const jobs = data || []

  for (const job of jobs) {
    await supabase
      .from("email_os_queue_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", job.id)
  }

  return jobs
}

export async function markQueueJobCompleted(jobId: string) {
  const supabase = createEmailOSSupabaseClient()
  const { error } = await supabase
    .from("email_os_queue_jobs")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", jobId)

  if (error) throw error
}

export async function markQueueJobFailed(job: any, errorMessage: string) {
  const supabase = createEmailOSSupabaseClient()
  const attempts = Number(job.attempts || 0) + 1
  const maxAttempts = Number(job.max_attempts || 3)
  const shouldRetry = attempts < maxAttempts
  const delayMs = Math.min(1000 * 60 * 30, 1000 * 30 * Math.pow(2, attempts))

  const { error } = await supabase
    .from("email_os_queue_jobs")
    .update({
      status: shouldRetry ? "retrying" : "failed",
      attempts,
      last_error: errorMessage,
      scheduled_at: new Date(Date.now() + delayMs).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", job.id)

  if (error) throw error
}

export async function createRuntimeEvent(input: {
  type: string
  actorId?: string
  mailboxId?: string
  threadId?: string
  payload?: Record<string, unknown>
}) {
  const supabase = createEmailOSSupabaseClient()

  const event = {
    id: createEmailOSId("evt"),
    type: input.type,
    actor_id: input.actorId || null,
    mailbox_id: input.mailboxId || null,
    thread_id: input.threadId || null,
    payload: input.payload || {},
    created_at: new Date().toISOString()
  }

  const { error } = await supabase.from("email_os_runtime_events").insert(event)
  if (error) throw error

  return event
}
