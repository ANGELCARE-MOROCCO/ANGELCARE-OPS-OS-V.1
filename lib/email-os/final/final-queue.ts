import { emailOSFinalDb, finalId, nowIso } from "./final-db"

export async function createFinalQueueJob(input: {
  type: "send" | "sync" | "retry" | "notification" | "sla"
  payload: Record<string, unknown>
  scheduledAt?: string
  maxAttempts?: number
}) {
  const db = emailOSFinalDb()
  const now = nowIso()

  const job = {
    id: finalId("job"),
    type: input.type,
    status: "queued",
    attempts: 0,
    max_attempts: input.maxAttempts || 3,
    payload: input.payload,
    last_error: null,
    scheduled_at: input.scheduledAt || now,
    created_at: now,
    updated_at: now
  }

  const { error } = await db.from("email_os_queue_jobs").insert(job)
  if (error) throw error
  return job
}
