
import { createEmailOSId } from "./audit"
import { createEmailOSSupabaseClient } from "./supabase-server"
import type { EmailOSQueueJob } from "./types"

export function createQueueJob(input: Pick<EmailOSQueueJob, "type" | "payload"> & Partial<EmailOSQueueJob>): EmailOSQueueJob {
  const now = new Date().toISOString()
  return {
    id: input.id ?? createEmailOSId("job"),
    type: input.type,
    status: input.status ?? "queued",
    attempts: input.attempts ?? 0,
    maxAttempts: input.maxAttempts ?? 3,
    payload: input.payload ?? {},
    lastError: input.lastError,
    scheduledAt: input.scheduledAt ?? now,
    createdAt: input.createdAt ?? now,
    updatedAt: now
  }
}

export function nextRetryDelayMs(attempts: number) {
  return Math.min(1000 * 60 * 30, 1000 * 30 * Math.pow(2, attempts))
}

export function canRetry(job: EmailOSQueueJob) {
  return job.status === "failed" && job.attempts < job.maxAttempts
}

export async function persistQueueJob(job: EmailOSQueueJob) {
  const supabase = createEmailOSSupabaseClient()

  const { error } = await supabase.from("email_os_queue_jobs").upsert({
    id: job.id,
    type: job.type,
    status: job.status,
    attempts: job.attempts,
    max_attempts: job.maxAttempts,
    payload: job.payload,
    last_error: job.lastError ?? null,
    scheduled_at: job.scheduledAt,
    created_at: job.createdAt,
    updated_at: job.updatedAt
  })

  if (error) throw error
  return job
}

export async function loadQueuedJobs(limit = 25) {
  const supabase = createEmailOSSupabaseClient()
  const { data, error } = await supabase
    .from("email_os_queue_jobs")
    .select("*")
    .in("status", ["queued", "retrying"])
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
