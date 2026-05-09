
export type EmailQueueJob = {
  id: string
  type: "send" | "sync" | "retry" | "webhook"
  status: "queued" | "processing" | "completed" | "failed" | "retrying"
  attempts: number
  maxAttempts: number
  lastError?: string
  scheduledAtIso: string
}

export function canRetryEmailJob(job: EmailQueueJob) {
  return job.status === "failed" && job.attempts < job.maxAttempts
}

export function nextRetryDelayMs(attempts: number) {
  const base = 1000 * 30
  const multiplier = Math.min(8, Math.pow(2, attempts))
  return base * multiplier
}

export function markJobForRetry(job: EmailQueueJob): EmailQueueJob {
  if (!canRetryEmailJob(job)) return job

  return {
    ...job,
    status: "retrying",
    attempts: job.attempts + 1,
    scheduledAtIso: new Date(Date.now() + nextRetryDelayMs(job.attempts)).toISOString()
  }
}
